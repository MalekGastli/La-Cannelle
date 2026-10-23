import type { Language } from '../hooks/useTranslation';

type AdminTranslations = {
  nav: {
    dashboard: string;
    orders: string;
    menu: string;
    customers: string;
    reports: string;
    system: string;
  };
  auth: {
    title: string;
    subtitle: string;
    loginLabel: string;
    passwordLabel: string;
    submit: string;
    signingIn: string;
    invalidCredentials: string;
  };
  labels: {
    viewAllOrders: string;
  };
};

export const adminTranslations: Record<Language, AdminTranslations> = {
  EN: {
    nav: {
      dashboard: 'Dashboard',
      orders: 'Orders',
      menu: 'Menu Management',
      customers: 'Customers',
      reports: 'Reports',
      system: 'System Control',
    },
    auth: {
      title: 'Admin Login',
      subtitle: 'Sign in to access the admin area.',
      loginLabel: 'Login',
      passwordLabel: 'Password',
      submit: 'Login',
      signingIn: 'Signing in...',
      invalidCredentials: 'Invalid credentials',
    },
    labels: {
      viewAllOrders: 'View All Orders',
    },
  },
  DE: {
    nav: {
      dashboard: 'Übersicht',
      orders: 'Bestellungen',
      menu: 'Menüverwaltung',
      customers: 'Kunden',
      reports: 'Berichte',
      system: 'Systemsteuerung',
    },
    auth: {
      title: 'Admin Anmeldung',
      subtitle: 'Melden Sie sich an, um den Adminbereich zu nutzen.',
      loginLabel: 'Login',
      passwordLabel: 'Passwort',
      submit: 'Anmelden',
      signingIn: 'Anmeldung...',
      invalidCredentials: 'Ungültige Zugangsdaten',
    },
    labels: {
      viewAllOrders: 'Alle Bestellungen ansehen',
    },
  },
};
