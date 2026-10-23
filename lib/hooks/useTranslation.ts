import { useEffect, useMemo, useState } from 'react';
import { translations, type TranslationModule } from '../translations';
import { FR, TR } from '../translations/dictionaries';

export type BaseLanguage = 'EN' | 'DE';
export type Language = BaseLanguage | 'FR' | 'TR';
export const LANGUAGES: Language[] = ['TR', 'EN', 'FR', 'DE'];
export const isLanguage = (value: unknown): value is Language =>
  value === 'EN' || value === 'DE' || value === 'FR' || value === 'TR';

const DICTIONARIES: Record<'FR' | 'TR', Record<string, string>> = { FR, TR };

const localizeDeep = (node: any, dict: Record<string, string>): any => {
  if (typeof node === 'string') return dict[node] ?? node;
  if (Array.isArray(node)) return node.map((item) => localizeDeep(item, dict));
  if (node && typeof node === 'object') {
    const out: Record<string, any> = {};
    for (const key of Object.keys(node)) out[key] = localizeDeep(node[key], dict);
    return out;
  }
  return node;
};

export const DEFAULT_LANGUAGE: Language = 'DE';
export const LANGUAGE_EVENT = 'lacannelle:language';
export const STORAGE_KEY = 'lacannelle_language';

const pickCache = new WeakMap<object, Partial<Record<'FR' | 'TR', any>>>();

/** Resolve a `Record<'EN' | 'DE', T>` translation module for any language (FR/TR derive from EN). */
export const pick = <T,>(moduleContent: Record<BaseLanguage, T>, language: Language): T => {
  if (language === 'DE' || language === 'EN') return moduleContent[language];
  const cached = pickCache.get(moduleContent) ?? {};
  if (!cached[language]) {
    cached[language] = localizeDeep(moduleContent.EN, DICTIONARIES[language]);
    pickCache.set(moduleContent, cached);
  }
  return cached[language] as T;
};

const createSafeProxy = (target: any, fallbackLabel = ''): any =>
  new Proxy(target ?? {}, {
    get(obj, prop: string) {
      if (prop === '__isProxy') return true;
      const value = obj?.[prop as keyof typeof obj];
      if (value === undefined || value === null) {
        // Return a readable fallback instead of throwing so UI never crashes when a key is missing
        return typeof prop === 'string' ? (fallbackLabel || prop) : '';
      }
      if (typeof value === 'object') {
        return createSafeProxy(value, fallbackLabel);
      }
      return value;
    },
  });

export const useTranslation = (module: TranslationModule) => {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  // Hydrate language preference once on the client
  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY) as Language | null)
      : null;
    const next = isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
    setLanguage(next);
    if (typeof window !== 'undefined' && stored !== next) {
      localStorage.setItem(STORAGE_KEY, next);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next.toLowerCase();
    }
    // Keep every hook instance (header, page, widgets) in sync
    const onChange = (event: Event) => {
      const value = (event as CustomEvent<Language>).detail;
      if (isLanguage(value)) setLanguage(value);
    };
    window.addEventListener(LANGUAGE_EVENT, onChange);
    return () => window.removeEventListener(LANGUAGE_EVENT, onChange);
  }, []);

  // Persist language selection
  const persistLanguage = (next: Language) => {
    setLanguage(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: next }));
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next.toLowerCase();
    }
  };

  const toggleLanguage = () => {
    persistLanguage(language === 'DE' ? 'EN' : 'DE');
  };

  const t = useMemo(() => {
    const moduleTranslations: any = translations[module] || {};
    if (language === 'FR' || language === 'TR') {
      const base = moduleTranslations.EN ?? translations.common.EN;
      return createSafeProxy(localizeDeep(base, DICTIONARIES[language]));
    }
    const moduleContent =
      moduleTranslations[language] ||
      moduleTranslations.EN ||
      translations.common?.[language] ||
      translations.common?.EN ||
      {};
    return createSafeProxy(moduleContent);
  }, [language, module]);

  return {
    t,
    language,
    toggleLanguage,
    setLanguage: persistLanguage,
  };
};
