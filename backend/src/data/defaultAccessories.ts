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
    image: '/images/accessories/table-setting.jpg',
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
      '/images/accessories/table-setting.jpg',
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
    image: '/images/home_image.jpeg',
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
    image: '/images/accessories/table-setting.jpg',
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
    image: '/images/accessories/table-setting.jpg',
    isActive: true
  }
];
