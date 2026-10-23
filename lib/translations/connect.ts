import type { Language } from '../hooks/useTranslation';

type ConnectTranslations = {
  nav: { services: string; menus: string; contact: string; connect: string; order: string };
  hero: { title: string; subtitle: string };
  tabs: Record<string, string>;
  profile: {
    personal: {
      title: string;
      subtitle: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      company: string;
      position: string;
    };
    preferences: {
      title: string;
      newsletter: string;
      sms: string;
      reminders: string;
      dietary: string;
      allergies: string;
    };
    save: string;
    edit: string;
  };
  orders: {
    title: string;
    status: { pending: string; confirmed: string; completed: string };
    viewDetails: string;
  };
  favorites: { title: string };
  payments: { title: string; default: string; setDefault: string; remove: string; addCard: string };
  settings: {
    title: string;
    security: string;
    notifications: string;
    privacy: string;
    language: string;
    delete: string;
  };
};

const en: ConnectTranslations = {
  nav: { services: 'Services', menus: 'Menus', contact: 'Contact', connect: 'Connect', order: 'Order' },
  hero: { title: 'Welcome back', subtitle: 'Manage your preferences, orders, and payment methods' },
  tabs: {
    profile: 'Profile',
    orders: 'Orders',
    favorites: 'Favorites',
    payments: 'Payments',
    settings: 'Settings',
  },
  profile: {
    personal: {
      title: 'Personal Information',
      subtitle: 'Keep your details up to date',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      position: 'Position',
    },
    preferences: {
      title: 'Preferences',
      newsletter: 'Subscribe to newsletter',
      sms: 'Receive SMS notifications',
      reminders: 'Event reminders',
      dietary: 'Dietary preferences',
      allergies: 'Allergies',
    },
    save: 'Save changes',
    edit: 'Edit profile',
  },
  orders: {
    title: 'Recent Orders',
    status: { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed' },
    viewDetails: 'View details',
  },
  favorites: { title: 'Favorites' },
  payments: {
    title: 'Payment Methods',
    default: 'Default',
    setDefault: 'Set as default',
    remove: 'Remove',
    addCard: 'Add New Card',
  },
  settings: {
    title: 'Settings',
    security: 'Security',
    notifications: 'Notifications',
    privacy: 'Privacy',
    language: 'Language',
    delete: 'Delete account',
  },
};

const de: ConnectTranslations = {
  nav: {
    services: 'Dienstleistungen',
    menus: 'Menus',
    contact: 'Kontakt',
    connect: 'Verbinden',
    order: 'Bestellen',
  },
  hero: {
    title: 'Willkommen zurück',
    subtitle: 'Verwalten Sie Ihre Einstellungen, Bestellungen und Zahlungsmethoden',
  },
  tabs: {
    profile: 'Profil',
    orders: 'Bestellungen',
    favorites: 'Favoriten',
    payments: 'Zahlungen',
    settings: 'Einstellungen',
  },
  profile: {
    personal: {
      title: 'Persönliche Daten',
      subtitle: 'Halten Sie Ihre Informationen aktuell',
      firstName: 'Vorname',
      lastName: 'Nachname',
      email: 'E-Mail',
      phone: 'Telefon',
      company: 'Firma',
      position: 'Position',
    },
    preferences: {
      title: 'Einstellungen',
      newsletter: 'Newsletter abonnieren',
      sms: 'SMS-Benachrichtigungen',
      reminders: 'Event-Erinnerungen',
      dietary: 'Ernährungspräferenzen',
      allergies: 'Allergien',
    },
    save: 'Änderungen speichern',
    edit: 'Profil bearbeiten',
  },
  orders: {
    title: 'Letzte Bestellungen',
    status: { pending: 'Ausstehend', confirmed: 'Bestätigt', completed: 'Abgeschlossen' },
    viewDetails: 'Details ansehen',
  },
  favorites: { title: 'Favoriten' },
  payments: {
    title: 'Zahlungsmethoden',
    default: 'Standard',
    setDefault: 'Als Standard setzen',
    remove: 'Entfernen',
    addCard: 'Neue Karte hinzufügen',
  },
  settings: {
    title: 'Einstellungen',
    security: 'Sicherheit',
    notifications: 'Benachrichtigungen',
    privacy: 'Datenschutz',
    language: 'Sprache',
    delete: 'Konto löschen',
  },
};

export const connectTranslations: Record<Language, ConnectTranslations> = {
  EN: en,
  DE: de,
};
