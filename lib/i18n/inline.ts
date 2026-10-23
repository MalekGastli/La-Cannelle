import type { Language } from '@/lib/hooks/useTranslation';
import { INLINE_FR, INLINE_TR } from './inlineDictionaries';

/**
 * Inline copy for the public pages: German and English are written next to the markup,
 * French and Turkish are looked up by the English source string (falls back to English).
 */
export function L(language: Language, de: string, en: string): string {
  if (language === 'DE') return de;
  if (language === 'FR') return INLINE_FR[en] ?? en;
  if (language === 'TR') return INLINE_TR[en] ?? en;
  return en;
}

const LOCALES: Record<Language, string> = { DE: 'de-DE', EN: 'en-US', FR: 'fr-FR', TR: 'tr-TR' };
export const localeOf = (language: Language): string => LOCALES[language];

const WEEKDAYS: Record<Language, string[]> = {
  DE: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  EN: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  FR: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  TR: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
};
export const weekdaysOf = (language: Language): string[] => WEEKDAYS[language];

/** Explicit four-language copy for strings that interpolate values. */
export function P(language: Language, copy: Record<Language, string>): string {
  return copy[language];
}
