export type DefaultAccessory = {
  nameEn: string;
  nameDe: string;
  descriptionEn: string;
  descriptionDe: string;
  detailsEn?: string | null;
  detailsDe?: string | null;
  unitEn?: string | null;
  unitDe?: string | null;
  price: number;
  image: string;
  isActive: boolean;
};

export const DEFAULT_ACCESSORIES: DefaultAccessory[] = [
  {
    nameEn: 'Besteck (Messer, Gabel, Löffel)',
    nameDe: 'Besteck (Messer, Gabel, Löffel)',
    descriptionEn:
      'Standard Besteck-Set, bestehend aus Messer, Gabel und / oder Löffel - basierend auf Bestellung. Vermietung, inkl. Reinigungskosten',
    descriptionDe:
      'Standard Besteck-Set, bestehend aus Messer, Gabel und / oder Löffel - basierend auf Bestellung. Vermietung, inkl. Reinigungskosten',
    detailsEn: null,
    detailsDe: null,
    unitEn: null,
    unitDe: null,
    price: 2,
    image: 'https://www.schoenerdaheim.de/media/46/4a/b1/1709296112/catering-08-hotel-amb-01.jpg?1712150457',
    isActive: true
  },
  {
    nameEn: 'Weingläser',
    nameDe: 'Weingläser',
    descriptionEn: 'Klassische, kristallklare Weingläser',
    descriptionDe: 'Klassische, kristallklare Weingläser',
    detailsEn: 'Fassungsvermögen 350ml',
    detailsDe: 'Fassungsvermögen 350ml',
    unitEn: null,
    unitDe: null,
    price: 2.25,
    image:
      'https://www.gastronomie-kaufhaus.de/out/pictures/master/product/1/zieher-vision-weinglas-balanced-gastronomie-kaufhaus-1-2535.jpg',
    isActive: true
  },
  {
    nameEn: 'Buffet-Servierplatten',
    nameDe: 'Buffet-Servierplatten',
    descriptionEn: 'Große ovale Servierplatten für Buffet-Aufbau',
    descriptionDe: 'Große ovale Servierplatten für Buffet-Aufbau',
    detailsEn: 'Keramik, hitzebeständig',
    detailsDe: 'Keramik, hitzebeständig',
    unitEn: null,
    unitDe: null,
    price: 8.5,
    image: 'https://media.xxxlutz.com/i/xxxlutz/NCYF89xExQUHUFb5RKpHL2EA/?fmt=auto&%24hq%24=&w=1200',
    isActive: true
  },
  {
    nameEn: 'Tischdecken',
    nameDe: 'Tischdecken',
    descriptionEn: 'Elegante Tischwäsche für formelle Events',
    descriptionDe: 'Elegante Tischwäsche für formelle Events',
    detailsEn: 'Verschiedene Größen verfügbar',
    detailsDe: 'Verschiedene Größen verfügbar',
    unitEn: null,
    unitDe: null,
    price: 12,
    image: 'https://de.euroelectronics.eu/cdn/shop/products/77746.jpg?v=1660303869&width=1800',
    isActive: true
  },
  {
    nameEn: 'Kaffeetassen & Untertassen',
    nameDe: 'Kaffeetassen & Untertassen',
    descriptionEn: 'Klassische Tassen und Untertassen für den Kaffeeservice',
    descriptionDe: 'Klassische Tassen und Untertassen für den Kaffeeservice',
    detailsEn: 'Porzellan-Set (Tasse + Untertasse)',
    detailsDe: 'Porzellan-Set (Tasse + Untertasse)',
    unitEn: null,
    unitDe: null,
    price: 2.1,
    image: 'https://m.media-amazon.com/images/I/51GC4TPowZL.jpg',
    isActive: true
  }
];
