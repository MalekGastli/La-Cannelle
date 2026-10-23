import { AppError } from '../middleware/errorHandler';

type CaptchaProvider = 'turnstile' | '';

const normalizeBool = (value: unknown) => {
  if (value === undefined) return undefined;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return undefined;
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
};

const getCaptchaProvider = (): CaptchaProvider => {
  const raw = (process.env.CAPTCHA_PROVIDER || '').trim().toLowerCase();
  if (raw === 'turnstile') return 'turnstile';
  if (raw) return '';
  if (readTurnstileSecret()) return 'turnstile';
  return process.env.NODE_ENV === 'production' ? 'turnstile' : '';
};

const isCaptchaEnabled = () => {
  const forced = normalizeBool(process.env.CAPTCHA_ENABLED);
  if (forced !== undefined) return forced;
  const provider = getCaptchaProvider();
  if (provider === 'turnstile') return Boolean(readTurnstileSecret());
  return false;
};

const readTurnstileSecret = () => (process.env.TURNSTILE_SECRET_KEY || '').trim();

export const captchaService = {
  isEnabled() {
    return isCaptchaEnabled();
  },

  async verify(token: string | undefined | null, options?: { ip?: string }) {
    if (!isCaptchaEnabled()) return;

    const provider = getCaptchaProvider();
    if (provider === '') {
      throw new AppError('Captcha is misconfigured (unknown provider)', 500);
    }

    if (!token || !String(token).trim()) {
      throw new AppError('Captcha token is required', 400);
    }

    if (provider === 'turnstile') {
      const secret = readTurnstileSecret();
      if (!secret) {
        throw new AppError('Captcha is misconfigured (missing TURNSTILE_SECRET_KEY)', 500);
      }

      const body = new URLSearchParams();
      body.set('secret', secret);
      body.set('response', String(token));
      if (options?.ip) body.set('remoteip', options.ip);

      let response: Response;
      try {
        response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body,
        });
      } catch {
        throw new AppError('Captcha verification failed', 503);
      }

      const data = (await response.json().catch(() => null)) as any;
      if (!response.ok || !data || data.success !== true) {
        const errorCodes = Array.isArray(data?.['error-codes']) ? data['error-codes'] : [];
        const suffix = errorCodes.length ? `: ${errorCodes.join(', ')}` : '';
        throw new AppError(`Captcha validation failed${suffix}`, 400);
      }

      return;
    }
  },
};
