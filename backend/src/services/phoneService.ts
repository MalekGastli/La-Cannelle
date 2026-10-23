type RestCountriesCountry = {
  cca2?: string;
  name?: { common?: string };
  flags?: { png?: string; svg?: string; alt?: string };
  flag?: string;
  idd?: { root?: string; suffixes?: string[] };
};

export interface PhoneCountryFlag {
  iso2: string;
  name: string;
  flagEmoji: string;
  flagPng?: string;
  flagSvg?: string;
  flagAlt?: string;
}

const RESTCOUNTRIES_BASE_URL = (process.env.RESTCOUNTRIES_BASE_URL || 'https://restcountries.com/v3.1').replace(/\/$/, '');
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const cache = new Map<string, { expiresAt: number; value: PhoneCountryFlag[] }>();
let callingCodeIndexCache: { expiresAt: number; index: Map<string, PhoneCountryFlag[]> } | null = null;

const iso2ToFlagEmoji = (iso2: string) => {
  const normalized = iso2.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return '';
  }
  const [first, second] = normalized;
  return String.fromCodePoint(127397 + first.charCodeAt(0), 127397 + second.charCodeAt(0));
};

const normalizeCallingCode = (value: string) => {
  const digitsOnly = value.replace(/[^\d]/g, '');
  return digitsOnly.slice(0, 3);
};

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export const phoneService = {
  normalizeCallingCode,

  async buildCallingCodeIndex(): Promise<Map<string, PhoneCountryFlag[]>> {
    if (callingCodeIndexCache && callingCodeIndexCache.expiresAt > Date.now()) {
      return callingCodeIndexCache.index;
    }

    const url = `${RESTCOUNTRIES_BASE_URL}/all?fields=cca2,name,flags,flag,idd`;
    const response = await fetchWithTimeout(url, 15000);
    if (!response.ok) {
      callingCodeIndexCache = {
        expiresAt: Date.now() + 5 * 60 * 1000,
        index: new Map(),
      };
      return callingCodeIndexCache.index;
    }

    const data = (await response.json()) as RestCountriesCountry[];
    const index = new Map<string, PhoneCountryFlag[]>();

    const add = (callingCode: string, item: PhoneCountryFlag) => {
      const normalized = normalizeCallingCode(callingCode);
      if (!normalized) return;
      const list = index.get(normalized);
      if (!list) {
        index.set(normalized, [item]);
        return;
      }
      if (!list.some((existing) => existing.iso2 === item.iso2)) {
        list.push(item);
      }
    };

    for (const country of Array.isArray(data) ? data : []) {
      const iso2 = (country.cca2 || '').trim().toUpperCase();
      if (!/^[A-Z]{2}$/.test(iso2)) continue;

      const name = (country.name?.common || '').trim() || iso2;
      const flagEmoji = (country.flag && country.flag.trim()) || iso2ToFlagEmoji(iso2);
      const item: PhoneCountryFlag = { iso2, name, flagEmoji };
      if (country.flags?.png) item.flagPng = country.flags.png;
      if (country.flags?.svg) item.flagSvg = country.flags.svg;
      if (country.flags?.alt) item.flagAlt = country.flags.alt;

      const root = (country.idd?.root || '').trim();
      const rootDigits = root.replace(/[^\d]/g, '');
      const suffixes = Array.isArray(country.idd?.suffixes) ? country.idd!.suffixes! : [];

      if (rootDigits) {
        // E.164 only has two 1-digit country calling codes: 1 and 7.
        if (rootDigits === '1' || rootDigits === '7') {
          add(rootDigits, item);
        }

        // Most countries have 2-3 digit calling codes composed as root + suffix.
        for (const suffix of suffixes) {
          const suffixDigits = String(suffix || '').replace(/[^\d]/g, '');
          if (!suffixDigits) continue;
          add(`${rootDigits}${suffixDigits}`, item);
        }
      }
    }

    callingCodeIndexCache = { expiresAt: Date.now() + CACHE_TTL_MS, index };
    return index;
  },

  async getCountriesByCallingCode(callingCode: string): Promise<PhoneCountryFlag[]> {
    const normalized = normalizeCallingCode(callingCode);
    if (!normalized) {
      return [];
    }

    const cached = cache.get(normalized);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const index = await this.buildCallingCodeIndex();
    const countries = index.get(normalized) || [];

    cache.set(normalized, { expiresAt: Date.now() + CACHE_TTL_MS, value: countries });
    return countries;
  },

  async resolveFromPhoneOrCode(input: string) {
    const trimmed = (input || '').trim();
    if (!trimmed) {
      return null;
    }

    const match = trimmed.match(/^\+?(\d{1,15})/);
    if (!match) {
      return null;
    }

    const digits = match[1];
    const maxLen = Math.min(3, digits.length);
    for (let len = maxLen; len >= 1; len -= 1) {
      const candidate = digits.slice(0, len);
      const countries = await this.getCountriesByCallingCode(candidate);
      if (countries.length > 0) {
        return { callingCode: candidate, countries };
      }
    }

    return { callingCode: digits.slice(0, maxLen), countries: [] as PhoneCountryFlag[] };
  },
};
