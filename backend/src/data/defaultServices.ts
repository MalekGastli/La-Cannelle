import { ServiceOccasion } from '@prisma/client';

export type DefaultService = {
  name: string;
  occasion: ServiceOccasion;
  description: string;
  image: string;
  isActive: boolean;
};

export const DEFAULT_SERVICES: DefaultService[] = [
  {
    name: 'Office Catering',
    occasion: 'BUSINESS',
    description: 'Breakfast meetings, lunch delivery, and ongoing office catering.',
    image: '/images/services/office.jpg',
    isActive: true
  },
  {
    name: 'Corporate Events',
    occasion: 'BUSINESS',
    description: 'Professional catering for meetings, conferences, and launches.',
    image: '/images/services/corporate.jpg',
    isActive: true
  },
  // Legacy services (from the older system / backup.sql)
  {
    name: 'Büffet Catering',
    occasion: 'BUSINESS',
    description:
      'Kalt-warme Büffetmenüs mit einer Portion pro Person und Gang, serviert in beheizten Behältern samt Vorlegebesteck.',
    image: '/images/home_image.jpeg',
    isActive: true
  },
  {
    name: 'Fingerfood Catering',
    occasion: 'BOTH',
    description: 'Kalte Fingerfoodhäppchen, serviert auf nachhaltigen Einwegplatten.',
    image:
      '/images/truffle-arancini.jpg',
    isActive: true
  },
  {
    name: 'Event Catering',
    occasion: 'PRIVATE',
    description: 'Birthdays, anniversaries, and private celebrations.',
    image: '/images/services/event.jpg',
    isActive: true
  },
  {
    name: 'Weddings',
    occasion: 'PRIVATE',
    description: 'Bespoke wedding menus, service, and coordination.',
    image: '/images/services/weddings.jpg',
    isActive: true
  }
  ,
  {
    name: 'Private Dinners',
    occasion: 'PRIVATE',
    description: 'Chef-at-home style experiences for intimate gatherings.',
    image: '/images/exclusive-dining.jpg',
    isActive: true
  },
  {
    name: 'Weihnachts Catering',
    occasion: 'BOTH',
    description:
      'Wähle zwischen festlichen Set-Menüs oder einem individuell kombinierbaren À La Carte Menü – perfekt für deine Weihnachtsfeier!',
    image: '/images/community-feast.jpg',
    isActive: true
  }
];
