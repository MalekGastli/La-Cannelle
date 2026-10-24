import { prisma } from '../prisma';

const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|hash/i;
const MAX_DETAIL_CHARS = 4000;
const AUDIT_TIMEOUT_MS = 2000;

/** Drops secrets and caps size so an audit row can never be huge or leak credentials. */
function sanitizeDetail(detail?: Record<string, unknown>) {
  if (!detail) return undefined;
  try {
    const clean = JSON.parse(
      JSON.stringify(detail, (key, value) => (key && SENSITIVE_KEY.test(key) ? '[redacted]' : value))
    );
    if (JSON.stringify(clean).length > MAX_DETAIL_CHARS) return { truncated: true };
    return clean;
  } catch {
    return { unserializable: true };
  }
}

/**
 * Best-effort audit trail. NEVER throws and never blocks the request for more than
 * AUDIT_TIMEOUT_MS: a failing or slow audit_logs table must not fail the action it records.
 * (It is awaited rather than fire-and-forget because serverless runtimes may freeze the
 * instance as soon as the response is sent.)
 */
export async function audit(
  actor: { id?: number; email?: string } | undefined,
  action: string,
  target = '',
  detail?: Record<string, unknown>
): Promise<void> {
  try {
    const write = prisma.auditLog
      .create({
        data: {
          userId: actor?.id ?? null,
          userEmail: (actor?.email ?? 'system').slice(0, 254),
          action: action.slice(0, 100),
          target: String(target ?? '').slice(0, 300),
          detail: sanitizeDetail(detail) as any,
        },
      })
      .then(() => undefined)
      .catch((error) => console.error('audit failed', (error as Error)?.message ?? error));

    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<void>((resolve) => {
      timer = setTimeout(() => {
        console.error('audit timed out', action);
        resolve();
      }, AUDIT_TIMEOUT_MS);
    });
    await Promise.race([write, timeout]);
    if (timer) clearTimeout(timer);
  } catch (error) {
    console.error('audit failed', (error as Error)?.message ?? error);
  }
}
