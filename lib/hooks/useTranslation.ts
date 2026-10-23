import { useEffect, useMemo, useState } from 'react';
import { translations, type TranslationModule } from '../translations';

export type Language = 'EN' | 'DE';

export const DEFAULT_LANGUAGE: Language = 'DE';
export const STORAGE_KEY = 'lacannelle_language';

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
    const next = stored === 'DE' || stored === 'EN' ? stored : DEFAULT_LANGUAGE;
    setLanguage(next);
    if (typeof window !== 'undefined' && stored !== next) {
      localStorage.setItem(STORAGE_KEY, next);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next.toLowerCase();
    }
  }, []);

  // Persist language selection
  const persistLanguage = (next: Language) => {
    setLanguage(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next.toLowerCase();
    }
  };

  const toggleLanguage = () => {
    persistLanguage(language === 'EN' ? 'DE' : 'EN');
  };

  const t = useMemo(() => {
    const moduleTranslations = translations[module] || {};
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
