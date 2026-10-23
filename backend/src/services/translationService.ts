import { AppError } from '../middleware/errorHandler';

type DeeplTargetLang = 'DE' | 'EN';

const getDeepLAuthKey = () => {
  const key = process.env.DEEPL_AUTH_KEY || process.env.DEEPL_API_KEY;
  return key ? String(key).trim() : '';
};

let deeplDisabledUntilMs = 0;

const getDeepLEndpoint = () => {
  // DeepL Free: https://api-free.deepl.com
  // DeepL Pro:  https://api.deepl.com
  const raw = process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate';
  return raw.trim().replace(/\/$/, '');
};

export const translationService = {
  async translateTexts(texts: string[], options: { targetLang: DeeplTargetLang }) {
    const authKey = getDeepLAuthKey();
    if (!authKey) {
      return null;
    }

    if (!Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    const now = Date.now();
    if (now < deeplDisabledUntilMs) {
      return null;
    }

    const payload = {
      target_lang: options.targetLang,
      text: texts,
    };

    // Using fetch with header-based authentication
    const response = await fetch(getDeepLEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Use JSON for the body content
        'Authorization': `DeepL-Auth-Key ${authKey}`, // Add header-based authentication
      },
      body: JSON.stringify(payload), // Send data as JSON
    });

    if (!response.ok) {
      // DeepL can return 429 (rate limit) or 456 (quota exceeded). In both cases we should not break the app:
      // keep existing content and let callers fall back to EN fields.
      if (response.status === 429 || response.status === 456) {
        // basic in-process backoff so we don't spam DeepL (and slow down requests) while rate-limited / out of quota
        deeplDisabledUntilMs = Date.now() + (response.status === 429 ? 2 * 60 * 1000 : 6 * 60 * 60 * 1000);
        return null;
      }
      const body = await response.text().catch(() => '');
      throw new AppError(`DeepL translation failed (${response.status}) ${body}`.trim(), 502);
    }

    const data = await response.json().catch(() => null) as any;
    const translations = Array.isArray(data?.translations) ? data.translations : null;
    if (!translations) {
      throw new AppError('DeepL translation failed (invalid response)', 502);
    }

    return translations.map((t: any) => String(t?.text ?? ''));
  },

  async translateText(text: string, options: { targetLang: DeeplTargetLang }) {
    const results = await this.translateTexts([text], options);
    if (!results) return null;
    return results[0] ?? '';
  }
};
