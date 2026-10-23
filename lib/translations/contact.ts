import type { Language } from '../hooks/useTranslation';

const base = {
  nav: { 
    about: 'About', 
    services: 'Services', 
    menus: 'Menus', 
    contact: 'Contact', 
    connect: 'Connect', 
    order: 'Order Now' 
  },
  hero: { 
    title: 'Get in Touch', 
    subtitle: "Let's create something extraordinary together" 
  },
  quickOrder: {
    title: 'Quick Order',
    subtitle: 'Need immediate assistance? Place a quick order',
    button: 'Quick Order Now',
  },
  social: {
    title: 'Follow Us',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  },
  location: {
    title: 'Our Location',
    loading: 'Loading Google Maps...',
    openMap: 'Open in Google Maps',
  },
  contactForm: {
    title: 'Send Us a Message',
    name: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    eventType: 'Event Type',
    eventTypePlaceholder: 'Select Event Type',
    eventDate: 'Event Date',
    invalidEventDate: 'Please choose today or a future date.',
    guests: 'Number of Guests',
    message: 'Your Message',
    eventTypes: ['Corporate Event', 'Wedding', 'Private Party', 'Conference', 'Product Launch', 'Other'],
    button: 'Send Message',
    submit: 'Send Message',
  },
  contactInfo: {
    title: 'Contact Information',
    phone: '02133 978 2992',
    mobile: '0163 599 7062',
    email: 'booking@la-cannelle.com',
    address: 'Borsigstrasse 2, 41541 Dormagen',
    hours: {
      title: 'Business Hours',
      weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM',
      saturday: 'Saturday: 10:00 AM - 4:00 PM',
      sunday: 'Sunday: Closed',
    },
  },
  success: { 
    message: 'Thank you for reaching out! We will get back to you soon.' 
  },
  alerts: {
    invalidEmail: 'Please enter a valid email address.',
    invalidPhone: 'Please enter a valid phone number.',
    failedToSend: 'Failed to send. Please try again.',
  },
  placeholders: {
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+49 123 456 789',
    guests: '50',
    message: 'Tell us about your event and any special requirements...',
  }
};

export const contactTranslations: Record<Language, typeof base> = {
  EN: base,
  DE: {
    ...base,
    nav: {
      about: 'Über uns',
      services: 'Dienstleistungen',
      menus: 'Menus',
      contact: 'Kontakt',
      connect: 'Verbinden',
      order: 'Jetzt bestellen',
    },
    hero: { 
      title: 'Kontaktieren Sie uns', 
      subtitle: 'Lassen Sie uns gemeinsam etwas Besonderes schaffen' 
    },
    quickOrder: {
      title: 'Schnellbestellung',
      subtitle: 'Brauchen Sie sofort Hilfe? Geben Sie eine Schnellbestellung auf',
      button: 'Jetzt schnell bestellen',
    },
    social: {
      title: 'Folgen Sie uns',
      instagram: 'Instagram',
      tiktok: 'TikTok',
    },
    location: {
      title: 'Unser Standort',
      loading: 'Google Maps wird geladen...',
      openMap: 'In Google Maps öffnen',
    },
    contactForm: {
      ...base.contactForm,
      title: 'Senden Sie uns eine Nachricht',
      name: 'Vollständiger Name',
      email: 'E-Mail-Adresse',
      phone: 'Telefonnummer',
      eventType: 'Veranstaltungstyp',
      eventTypePlaceholder: 'Veranstaltungstyp wählen',
      eventDate: 'Veranstaltungsdatum',
      invalidEventDate: 'Bitte wählen Sie heute oder ein zukünftiges Datum.',
      guests: 'Anzahl der Gäste',
      message: 'Ihre Nachricht',
      eventTypes: ['Firmenevent', 'Hochzeit', 'Private Feier', 'Konferenz', 'Produktvorstellung', 'Andere'],
      button: 'Nachricht senden',
      submit: 'Nachricht senden',
    },
    contactInfo: {
      ...base.contactInfo,
      title: 'Kontaktinformationen',
      phone: '+49 2133 978 2992',
      mobile: '+49 163 599 7062',
      email: 'booking@la-cannelle.com',
      address: 'Borsigstraße 2, 41541 Dormagen',
      hours: {
        title: 'Geschäftszeiten',
        weekdays: 'Montag - Freitag: 9:00 - 18:00 Uhr',
        saturday: 'Samstag: 10:00 - 16:00 Uhr',
        sunday: 'Sonntag: Geschlossen',
      },
    },
    success: { 
      message: 'Vielen Dank für Ihre Nachricht! Wir melden uns bald bei Ihnen.' 
    },
    alerts: {
      invalidEmail: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      invalidPhone: 'Bitte geben Sie eine gültige Telefonnummer ein.',
      failedToSend: 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.',
    },
    placeholders: {
      name: 'Max Mustermann',
      email: 'max@example.com',
      phone: '+49 123 456 789',
      guests: '50',
      message: 'Erzählen Sie uns von Ihrer Veranstaltung und besonderen Anforderungen...',
    }
  },
};
