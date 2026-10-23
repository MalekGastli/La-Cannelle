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
    image: 'https://images.unsplash.com/photo-1555992336-03a23c7b20a6?w=800&fit=crop',
    isActive: true
  },
  {
    name: 'Corporate Events',
    occasion: 'BUSINESS',
    description: 'Professional catering for meetings, conferences, and launches.',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&fit=crop',
    isActive: true
  },
  // Legacy services (from the older system / backup.sql)
  {
    name: 'Büffet Catering',
    occasion: 'BUSINESS',
    description:
      'Kalt-warme Büffetmenüs mit einer Portion pro Person und Gang, serviert in beheizten Behältern samt Vorlegebesteck.',
    image: 'https://www.expondo.co.uk/inspirations/wp-content/uploads/2024/04/corporate-catering.jpg',
    isActive: true
  },
  {
    name: 'Fingerfood Catering',
    occasion: 'BOTH',
    description: 'Kalte Fingerfoodhäppchen, serviert auf nachhaltigen Einwegplatten.',
    image:
      'https://image.essen-und-trinken.de/11884488/t/Uc/v8/w1440/r1/-/gefluegelsalat-mit-ananas-und-curry-93d618a2e27d9d40c2c0e68c752c2460-eut20170106701-jpg--35717-.jpg',
    isActive: true
  },
  {
    name: 'Event Catering',
    occasion: 'PRIVATE',
    description: 'Birthdays, anniversaries, and private celebrations.',
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&fit=crop',
    isActive: true
  },
  {
    name: 'Weddings',
    occasion: 'PRIVATE',
    description: 'Bespoke wedding menus, service, and coordination.',
    image: 'https://images.unsplash.com/photo-1523438097201-fb5f1f6b227b?w=800&fit=crop',
    isActive: true
  }
  ,
  {
    name: 'Private Dinners',
    occasion: 'PRIVATE',
    description: 'Chef-at-home style experiences for intimate gatherings.',
    image: 'https://oasiskauai.com/wp-content/uploads/2024/02/private-dining.jpg',
    isActive: true
  },
  {
    name: 'Weihnachts Catering',
    occasion: 'BOTH',
    description:
      'Wähle zwischen festlichen Set-Menüs oder einem individuell kombinierbaren À La Carte Menü – perfekt für deine Weihnachtsfeier!',
    image: 'https://lindchen.de/wp-content/uploads/2024/12/Weihnachtsessen_iStock-1174661659.jpg',
    isActive: true
  }
];
