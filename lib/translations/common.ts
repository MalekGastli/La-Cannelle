import type { Language } from '../hooks/useTranslation';

type CommonTranslations = Record<
  Language,
  {
    nav: {
      home: string;
      about: string;
      services: string;
      menus: string;
      contact: string;
      connect: string;
      order: string;
    };
    accessibility: {
      switchToGerman: string;
      switchToEnglish: string;
      englishFlagAlt: string;
      germanFlagAlt: string;
    };
    footer: {
      quickLinks: string;
      contact: string;
      followUs: string;
      brandTitle: string;
      brandTagline: string;
      contactPhone: string;
      contactEmail: string;
      contactAddress: string;
      copyright: string;
      social: {
        instagram: string;
        tiktok: string;
      };
    };
    buttons: {
      next: string;
      back: string;
      confirm: string;
      backToHome: string;
    };
  }
>;

export const commonTranslations: CommonTranslations = {
  EN: {
    nav: {
      home: 'Home',
      about: 'About',
      services: 'Services',
      menus: 'Menus',
      contact: 'Contact',
      connect: 'Connect',
      order: 'Order',
    },
    accessibility: {
      switchToGerman: 'Switch to German',
      switchToEnglish: 'Switch to English',
      englishFlagAlt: 'English flag',
      germanFlagAlt: 'German flag',
    },
    footer: {
      quickLinks: 'Quick Links',
      contact: 'Contact',
      followUs: 'Follow Us',
      brandTitle: 'La Cannelle',
      brandTagline: 'Creating unforgettable culinary experiences',
      contactPhone: '+49 2133 978 2992',
      contactEmail: 'booking@la-cannelle.com',
      contactAddress: 'Borsigstrasse 2, 41541 Dormagen',
      copyright: '(c) 2025 La Cannelle Catering. All rights reserved.',
      social: {
        instagram: 'Instagram',
        tiktok: 'TikTok',
      },
    },
    buttons: {
      next: 'Next',
      back: 'Back',
      confirm: 'Confirm',
      backToHome: 'Back to Home',
    },
  },
  DE: {
    nav: {
      home: 'Startseite',
      about: 'Über uns',
      services: 'Dienstleistungen',
      menus: 'Menus',
      contact: 'Kontakt',
      connect: 'Verbinden',
      order: 'Bestellen',
    },
    accessibility: {
      switchToGerman: 'Zur deutschen Sprache wechseln',
      switchToEnglish: 'Zur englischen Sprache wechseln',
      englishFlagAlt: 'Englische Flagge',
      germanFlagAlt: 'Deutsche Flagge',
    },
    footer: {
      quickLinks: 'Schnellzugriff',
      contact: 'Kontakt',
      followUs: 'Folgen Sie uns',
      brandTitle: 'La Cannelle',
      brandTagline: 'Unvergessliche kulinarische Erlebnisse',
      contactPhone: '+49 2133 978 2992',
      contactEmail: 'booking@la-cannelle.com',
      contactAddress: 'Borsigstrasse 2, 41541 Dormagen',
      copyright: '(c) 2025 La Cannelle Catering. Alle Rechte vorbehalten.',
      social: {
        instagram: 'Instagram',
        tiktok: 'TikTok',
      },
    },
    buttons: {
      next: 'Weiter',
      back: 'Zurück',
      confirm: 'Bestätigen',
      backToHome: 'Zurück zur Startseite',
    },
  },
};
