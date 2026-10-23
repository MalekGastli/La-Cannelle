import type { Language } from '../hooks/useTranslation';

type HomeTranslations = {
  menuHighlights: any;
  nav: { home: string; about: string; services: string; menus: string; contact: string; connect: string; order: string };
  hero: { title: string; subtitle: string; cta: string };
  errors: { menusLoadFailed: string };
  quickMenu: {
    title: string;
    description: string;
    categories: { title: string; description: string }[];
  };
  exclusivity: {
    subtitle: string;
    title: string;
    text: string;
    stats: { number: string; label: string }[];
    badge: { title: string; subtitle: string };
  };
  company: {
    subtitle: string;
    title: string;
    text: string;
    badge: { title: string; subtitle: string };
    review: { ratingLabel: string; quote: string; author: string };
    values: {
      mission: { title: string; subtitle: string; description: string };
      vision: { title: string; subtitle: string; description: string };
      excellence: { title: string; subtitle: string; description: string };
      community: { title: string; subtitle: string; description: string };
    };
  };
  menuShowcase: {
    title: string;
    description: string;
    items: {
      name: string;
      category: string;
      price: string;
      description: string;
      image?: string;
      popular?: boolean;
      featured?: boolean;
    }[];
    badges: { popular: string; featured: string };
    viewDetails: string;
    exploreFull: string;
  };
  passion: {
    subtitle: string;
    title: string;
    text: string;
    skills: { title: string; description: string }[];
    cta: string;
  };
  journey: { title: string; milestones: { title: string; date: string; description: string }[] };
  services: { title: string; subtitle: string; items: { title: string; description: string; icon?: string }[]; cta: string };
  menus: {
    priceLabel: string;
    includes: string;
    noItems: string;
    loading: string;
    categoryAll: any;
    viewDetails: any;
    exploreFull: any; title: string; description: string; items: { name: string; desc: string; price?: string }[]; cta: string 
};
  testimonials: { title: string; items: { quote: string; name: string; role: string }[] };
  brandBanner: { title: string; subtitle: string };
  footer: {
    tagline: string;
    quickLinksTitle: string;
    contactTitle: string;
    contact: { phone: string; email: string; location: string };
    hoursTitle: string;
    hours: { weekdays: string; saturday: string; sunday: string };
    copyright: string;
  };
};

const en: HomeTranslations = {
  nav: { home: 'Home', about: 'About', services: 'Services', menus: 'Menus', contact: 'Contact', connect: 'Connect', order: 'Order' },
  hero: {
    title: 'Culinary excellence for unforgettable events',
    subtitle: 'Tailored catering, thoughtful service, and bold flavors for every occasion.',
    cta: 'Plan your event',
  },
  errors: {
    menusLoadFailed: 'Unable to load menus right now.',
  },
  quickMenu: {
    title: 'Popular picks',
    description: 'Choose a starting point or build your own experience.',
    categories: [
      { title: "Chef's tasting", description: 'Seasonal highlights' },
      { title: 'Private dining', description: 'Intimate gatherings' },
      { title: 'Business events', description: 'Polished service' },
      { title: 'Celebrations', description: 'Make it memorable' },
    ],
  },
  exclusivity: {
    subtitle: 'Signature approach',
    title: 'Elevated catering without compromise',
    text: 'From menu design to on-site execution, we obsess over the details so you can enjoy the moment.',
    stats: [
      { number: '500+', label: 'Events served' },
      { number: '4.9/5', label: 'Client rating' },
      { number: '30+', label: 'Team members' },
    ],
    badge: { title: 'Trusted partner', subtitle: 'End-to-end support' },
  },
  company: {
    subtitle: 'Crafted for you',
    title: 'Hospitality-first mindset',
    text: 'We combine fine dining techniques with warm, attentive service so guests feel cared for.',
    badge: { title: 'Premium service', subtitle: 'Discreet & reliable' },
    review: { ratingLabel: 'Client feedback', quote: '"Flawless execution and beautiful cuisine."', author: 'Event partner' },
    values: {
      mission: { title: 'Mission', subtitle: 'Delight every guest', description: 'Designing experiences that bring people together.' },
      vision: { title: 'Vision', subtitle: 'Raise the bar', description: 'Setting new standards for modern catering.' },
      excellence: { title: 'Excellence', subtitle: 'Precision & care', description: 'Quality ingredients, expert chefs, perfect timing.' },
      community: { title: 'Community', subtitle: 'People first', description: 'Building lasting relationships with clients and teams.' },
    },
  },
  menuShowcase: {
    title: 'Featured menus',
    description: 'Curated selections that guests love.',
    items: [
      {
        name: 'Seasonal Signature',
        category: "Chef's pick",
        price: 'from 65 EUR',
        description: 'Five-course tasting with seasonal highlights.',
        popular: true,
        featured: true,
      },
      {
        name: 'Garden Fresh',
        category: 'Vegetarian',
        price: 'from 48 EUR',
        description: 'Vibrant vegetarian dishes packed with flavor.',
        featured: true,
      },
      {
        name: 'Business Classic',
        category: 'Corporate',
        price: 'from 55 EUR',
        description: 'Elegant options for meetings and receptions.',
      },
    ],
    badges: { popular: 'Popular', featured: 'Featured' },
    viewDetails: 'View details',
    exploreFull: 'Explore all menus',
  },
  passion: {
    subtitle: 'Chef-led',
    title: 'Modern technique, generous hospitality',
    text: 'Our kitchen team blends innovation with comfort - beautiful and delicious.',
    skills: [
      { title: 'Menu design', description: 'Aligned with your theme and guests.' },
      { title: 'Dietary needs', description: 'Thoughtful options for every requirement.' },
      { title: 'Logistics', description: 'On-time delivery and coordinated service.' },
    ],
    cta: 'Meet the team',
  },
  journey: {
    title: 'How we work',
    milestones: [
      { title: 'Discovery', date: 'Step 1', description: 'We understand your goals and guests.' },
      { title: 'Concept', date: 'Step 2', description: 'Menus and experience tailored to you.' },
      { title: 'Tasting', date: 'Step 3', description: 'Optional tasting and refinements.' },
      { title: 'Execution', date: 'Step 4', description: 'Seamless delivery on event day.' },
    ],
  },
  services: {
    title: 'Service formats',
    subtitle: 'Tailored experiences for every occasion.',
    items: [
      { title: 'Full-service catering', description: 'Events with staff on site.' },
      { title: 'Drop-off', description: 'Beautifully packaged and ready to serve.' },
      { title: 'Bar & drinks', description: 'Wine, cocktails, and pairings.' },
    ],
    cta: 'View all services',
  },
  menus: {
    title: 'Menu snapshots',
    description: "A quick peek at what's cooking: compact, curated, ready to order.", // 新增的翻译
    items: [
      { name: 'Brunch Social', desc: 'Breakfast favorites and warm dishes.' },
      { name: 'Evening Soiree', desc: 'Finger food and elegant mains.' },
      { name: 'Family Style', desc: 'Shared platters for lively tables.' },
    ],
    cta: 'Browse menus',
    priceLabel: '',
    includes: '',
    noItems: '',
    loading: '',
    categoryAll: undefined,
    viewDetails: undefined,
    exploreFull: undefined
  },
  testimonials: {
    title: 'What clients say',
    items: [
      { quote: 'Professional, responsive, and delicious.', name: 'Laura M.', role: 'Corporate client' },
      { quote: 'Guests talked about it for weeks.', name: 'David K.', role: 'Host' },
    ],
  },
  brandBanner: { title: 'Trusted by leading brands', subtitle: 'Events, offsites, launches, and celebrations.' },
  footer: {
    tagline: 'Unforgettable culinary experiences.',
    quickLinksTitle: 'Quick Links',
    contactTitle: 'Contact',
    contact: { phone: '+49 2133 978 2992', email: 'booking@la-cannelle.com', location: 'Dormagen, Germany' },
    hoursTitle: 'Hours',
    hours: { weekdays: 'Mon - Fri: 9:00 - 18:00', saturday: 'Sat: 10:00 - 16:00', sunday: 'Sun: Closed' },
    copyright: '(c) 2025 La Cannelle Catering. All rights reserved.',
  },
  menuHighlights: undefined
};

const de: HomeTranslations = {
  nav: {
    home: 'Startseite',
    about: 'Über uns',
    services: 'Dienstleistungen',
    menus: 'Menus',
    contact: 'Kontakt',
    connect: 'Verbinden',
    order: 'Bestellen',
  },
  hero: {
    title: 'Kulinarische Exzellenz für unvergessliche Events',
    subtitle: 'Maßgeschneidertes Catering, aufmerksamer Service und starke Aromen für jeden Anlass.',
    cta: 'Event planen',
  },
  errors: {
    menusLoadFailed: 'Menus konnten gerade nicht geladen werden.',
  },
  quickMenu: {
    title: 'Beliebte Auswahl',
    description: 'Wählen Sie einen Einstieg oder stellen Sie Ihr Erlebnis individuell zusammen.',
    categories: [
      { title: 'Chef-Tasting', description: 'Saisonale Highlights' },
      { title: 'Private Dining', description: 'Intime Runden' },
      { title: 'Business Events', description: 'Professioneller Service' },
      { title: 'Feiern', description: 'Unvergessliche Momente' },
    ],
  },
  exclusivity: {
    subtitle: 'Signature Ansatz',
    title: 'Catering ohne Kompromisse',
    text: 'Von der Menugestaltung bis zur Umsetzung kümmern wir uns um jedes Detail, damit Sie den Moment genießen können.',
    stats: [
      { number: '500+', label: 'Betreute Events' },
      { number: '4,9/5', label: 'Kundenzufriedenheit' },
      { number: '30+', label: 'Teammitglieder' },
    ],
    badge: { title: 'Verlässlicher Partner', subtitle: 'Rundum-Betreuung' },
  },
  company: {
    subtitle: 'Für Sie gemacht',
    title: 'Gastfreundschaft zuerst',
    text: 'Wir verbinden Fine-Dining-Technik mit herzlichem Service, damit sich Gäste umsorgt fühlen.',
    badge: { title: 'Premium-Service', subtitle: 'Diskret & zuverlässig' },
    review: { ratingLabel: 'Kundenstimme', quote: '"Makellose Umsetzung und wunderschöne Küche."', author: 'Eventpartner' },
    values: {
      mission: { title: 'Mission', subtitle: 'Jeden Gast begeistern', description: 'Erlebnisse gestalten, die Menschen verbinden.' },
      vision: { title: 'Vision', subtitle: 'Neue Maßstäbe', description: 'Wir setzen Standards für modernes Catering.' },
      excellence: { title: 'Exzellenz', subtitle: 'Präzision & Sorgfalt', description: 'Beste Zutaten, erfahrene Köche, perfektes Timing.' },
      community: { title: 'Gemeinschaft', subtitle: 'Menschen im Fokus', description: 'Langfristige Beziehungen zu Kunden und Teams.' },
    },
  },
  menuShowcase: {
    title: 'Ausgewählte Menus',
    description: 'Kuratiert und bei Gästen beliebt.',
    items: [
      {
        name: 'Saisonale Signature',
        category: 'Chef-Auswahl',
        price: 'ab 65 EUR',
        description: 'Fünf Gänge mit saisonalen Highlights.',
        popular: true,
        featured: true,
      },
      {
        name: 'Garden Fresh',
        category: 'Vegetarisch',
        price: 'ab 48 EUR',
        description: 'Bunte vegetarische Gerichte voller Geschmack.',
        featured: true,
      },
      {
        name: 'Business Classic',
        category: 'Business',
        price: 'ab 55 EUR',
        description: 'Elegante Optionen für Meetings und Empfänge.',
      },
    ],
    badges: { popular: 'Beliebt', featured: 'Empfohlen' },
    viewDetails: 'Details ansehen',
    exploreFull: 'Alle Menus ansehen',
  },
  passion: {
    subtitle: 'Von Köchen gemacht',
    title: 'Moderne Technik, großzügige Gastlichkeit',
    text: 'Unser Küchenteam verbindet Innovation mit Wohlfühlmomenten - ästhetisch und köstlich zugleich.',
    skills: [
      { title: 'Menugestaltung', description: 'Passend zu Thema und Gästen.' },
      { title: 'Ernährungswünsche', description: 'Sorgfältige Optionen für alle Bedürfnisse.' },
      { title: 'Logistik', description: 'Pünktliche Lieferung und koordinierter Service.' },
    ],
    cta: 'Team kennenlernen',
  },
  journey: {
    title: 'So arbeiten wir',
    milestones: [
      { title: 'Erkundung', date: 'Schritt 1', description: 'Wir verstehen Ziele und Gäste.' },
      { title: 'Konzept', date: 'Schritt 2', description: 'Menus und Erlebnisse abgestimmt auf Sie.' },
      { title: 'Verkostung', date: 'Schritt 3', description: 'Optionales Tasting und Feinschliff.' },
      { title: 'Durchführung', date: 'Schritt 4', description: 'Perfekte Umsetzung am Eventtag.' },
    ],
  },
  services: {
    title: 'Service-Formate',
    subtitle: 'Maßgeschneiderte Erlebnisse für jeden Anlass.',
    items: [
      { title: 'Catering mit Team', description: 'Events mit Team vor Ort.' },
      { title: 'Lieferung', description: 'Schön verpackt und servierfertig.' },
      { title: 'Bar & Getränke', description: 'Wein, Cocktails und Pairings.' },
    ],
    cta: 'Alle Services ansehen',
  },
  menus: {
    title: 'Menu-Einblicke',
    description: 'Ein kurzer Einblick in unsere Küche: kompakt, kuratiert und bestellbereit.', // 新增的翻译
    items: [
      { name: 'Brunch Social', desc: 'Frühstücks-Spezialitäten und warme Gerichte.' },
      { name: 'Evening Soiree', desc: 'Fingerfood und elegante Hauptgänge.' },
      { name: 'Family Style', desc: 'Geteilte Platten für lebendige Tische.' },
    ],
    cta: 'Menupläne anzeigen',
    priceLabel: '',
    includes: '',
    noItems: '',
    loading: '',
    categoryAll: undefined,
    viewDetails: undefined,
    exploreFull: undefined
  },
  testimonials: {
    title: 'Stimmen unserer Kunden',
    items: [
      { quote: 'Professionell, reaktionsschnell und köstlich.', name: 'Laura M.', role: 'Unternehmenskunde' },
      { quote: 'Die Gäste schwärmen noch Wochen später.', name: 'David K.', role: 'Event-Gastgeber' },
    ],
  },
  brandBanner: { title: 'Vertraut von führenden Marken', subtitle: 'Events, Offsites, Launches und Feiern.' },
  footer: {
    tagline: 'Unvergessliche kulinarische Erlebnisse.',
    quickLinksTitle: 'Schnellzugriff',
    contactTitle: 'Kontakt',
    contact: { phone: '+49 2133 978 2992', email: 'booking@la-cannelle.com', location: 'Dormagen, Deutschland' },
    hoursTitle: 'Öffnungszeiten',
    hours: { weekdays: 'Mo - Fr: 9:00 - 18:00', saturday: 'Sa: 10:00 - 16:00', sunday: 'So: Geschlossen' },
    copyright: '(c) 2025 La Cannelle Catering. Alle Rechte vorbehalten.',
  },
  menuHighlights: undefined
};

export const homeTranslations: Record<Language, HomeTranslations> = {
  EN: en,
  DE: de,
};
