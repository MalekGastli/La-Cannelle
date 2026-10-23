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

/** "N guests minimum" in all four languages. */
export function minPeopleLabel(language: Language, count: number): string {
  return P(language, {
    DE: `${count} Personen Minimum`,
    EN: `${count} guest minimum`,
    FR: `${count} convives minimum`,
    TR: `En az ${count} kişi`,
  });
}

// Descriptions that come from the seeded default menus are stored in German.
const MENU_DESCRIPTIONS: Record<string, Record<'EN' | 'FR' | 'TR', string>> = {
  'Viel Auswahl für besondere Anlässe!': {
    EN: 'Plenty of choice for special occasions!',
    FR: 'Un grand choix pour les grandes occasions !',
    TR: 'Özel günler için geniş seçenekler!',
  },
  'Das Standard Fingerfood-Menü': {
    EN: 'Our standard finger food menu',
    FR: 'Notre menu de bouchées standard',
    TR: 'Standart fingerfood menümüz',
  },
  'Überschaulich aber preiswert!': {
    EN: 'Compact but good value!',
    FR: 'Simple mais économique !',
    TR: 'Sade ama uygun fiyatlı!',
  },
  'Das Klassische Büffet!': {
    EN: 'The classic buffet!',
    FR: 'Le buffet classique !',
    TR: 'Klasik büfe!',
  },
};

export function menuDesc(language: Language, description?: string | null): string {
  const text = description || '';
  if (language === 'DE') return text;
  return MENU_DESCRIPTIONS[text]?.[language] ?? text;
}
