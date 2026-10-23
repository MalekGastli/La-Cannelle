export type DefaultMenu = {
  name: string;
  description: string;
  price: number;
  image: string;
  minPeople: number;
  isActive: boolean;
  steps: Array<{ label: string; included: number }>;
  serviceName?: string;
  productFilter: {
    type: 'CATEGORIES_ANY';
    categories: Array<'STARTER' | 'SOUP' | 'MAIN' | 'FINGERFOOD' | 'SIDE' | 'DESSERT' | 'BEVERAGE'>;
  };
};

export const DEFAULT_MENUS: DefaultMenu[] = [
  {
    name: 'Fingerfood Premium',
    description: 'Viel Auswahl für besondere Anlässe!',
    price: 28.9,
    image: '/images/truffle-arancini.jpg',
    minPeople: 15,
    isActive: true,
    steps: [{ label: 'fingerfood', included: 6 }],
    serviceName: 'Fingerfood Catering',
    productFilter: { type: 'CATEGORIES_ANY', categories: ['FINGERFOOD'] }
  },
  {
    name: 'Fingerfood Classic',
    description: 'Das Standard Fingerfood-Menü',
    price: 21.9,
    image: '/images/mediterranean-buffet.jpg',
    minPeople: 15,
    isActive: true,
    steps: [{ label: 'fingerfood', included: 5 }],
    serviceName: 'Fingerfood Catering',
    productFilter: { type: 'CATEGORIES_ANY', categories: ['FINGERFOOD'] }
  },
  {
    name: 'Fingerfood Basic',
    description: 'Überschaulich aber preiswert!',
    price: 16.9,
    image: '/images/salad.jpg',
    minPeople: 15,
    isActive: true,
    steps: [{ label: 'fingerfood', included: 4 }],
    serviceName: 'Fingerfood Catering',
    productFilter: { type: 'CATEGORIES_ANY', categories: ['FINGERFOOD'] }
  },
  {
    name: 'Büffet Premium',
    description: 'Viel Auswahl für besondere Anlässe!',
    price: 31.9,
    image: '/images/home_image.jpeg',
    minPeople: 30,
    isActive: true,
    steps: [
      { label: 'starter', included: 4 },
      { label: 'soup', included: 1 },
      { label: 'main', included: 3 },
      { label: 'dessert', included: 2 }
    ],
    serviceName: 'Büffet Catering',
    productFilter: {
      type: 'CATEGORIES_ANY',
      categories: ['STARTER', 'SOUP', 'MAIN', 'SIDE', 'DESSERT', 'BEVERAGE']
    }
  },
  {
    name: 'Büffet Classic',
    description: 'Das Klassische Büffet!',
    price: 24.9,
    image: '/images/lamb.jpg',
    minPeople: 20,
    isActive: true,
    steps: [
      { label: 'starter', included: 3 },
      { label: 'soup', included: 0 },
      { label: 'main', included: 2 },
      { label: 'dessert', included: 1 }
    ],
    serviceName: 'Büffet Catering',
    productFilter: {
      type: 'CATEGORIES_ANY',
      categories: ['STARTER', 'SOUP', 'MAIN', 'SIDE', 'DESSERT', 'BEVERAGE']
    }
  },
  {
    name: 'Büffet Basic',
    description: 'Überschaulich aber preiswert!',
    price: 20.9,
    image: '/images/risotto.jpg',
    minPeople: 10,
    isActive: true,
    steps: [
      { label: 'starter', included: 2 },
      { label: 'main', included: 1 }
    ],
    serviceName: 'Büffet Catering',
    productFilter: {
      type: 'CATEGORIES_ANY',
      categories: ['STARTER', 'SOUP', 'MAIN', 'SIDE', 'DESSERT', 'BEVERAGE']
    }
  }
];
