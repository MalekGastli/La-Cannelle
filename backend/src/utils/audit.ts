import { prisma } from '../prisma';

/** Best-effort audit trail; never blocks the action it records. */
export async function audit(
  actor: { id?: number; email?: string } | undefined,
  action: string,
  target = '',
  detail?: Record<string, unknown>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: actor?.id ?? null,
        userEmail: actor?.email ?? 'system',
        action,
        target,
        detail: (detail as any) ?? undefined,
      },
    });
  } catch (error) {
    console.error('audit failed', error);
  }
}
