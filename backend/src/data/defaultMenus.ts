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
    image: 'https://iili.io/fWOK5n2.md.jpg',
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
    image: 'https://unikorncatering.de/wp-content/uploads/2024/05/Fingerfood-Buffet-scaled.jpg',
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
    image: 'https://spreekueche.de/uploads/c/spreekuumlche-24.09.2919016-340x500-1.jpg',
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
    image: 'https://yeamama.com.sg/wp-content/uploads/2023/01/Premium-Buffet.png',
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
    image: 'https://www.foodline.sg/PageImage/Article/Top-Catering-Menu-Pic.jpg',
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
    image: 'https://www.elsiekitchen.com.sg/wp-content/uploads/2023/01/385A8339-scaled.jpg',
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
