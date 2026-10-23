import type { Product } from '@/lib/api/products';

export const CATEGORIES = [
  { key: 'FINGERFOOD', de: 'Fingerfood', en: 'Finger food', minQty: 10 },
  { key: 'STARTER', de: 'Vorspeisen', en: 'Starters', minQty: 5 },
  { key: 'SOUP', de: 'Suppen', en: 'Soups', minQty: 5 },
  { key: 'MAIN', de: 'Hauptgerichte', en: 'Mains', minQty: 5 },
  { key: 'SIDE', de: 'Beilagen', en: 'Sides', minQty: 5 },
  { key: 'DESSERT', de: 'Desserts', en: 'Desserts', minQty: 5 },
  { key: 'BEVERAGE', de: 'Getränke', en: 'Drinks', minQty: 10 },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

export const categoryLabel = (key: string, isDe: boolean) => {
  const found = CATEGORIES.find((c) => c.key === String(key).toUpperCase());
  return found ? (isDe ? found.de : found.en) : key;
};

/** The 14 EU allergens, stored in both languages so the shop can show either. */
export const ALLERGENS = [
  { en: 'Gluten', de: 'Gluten' },
  { en: 'Crustaceans', de: 'Krebstiere' },
  { en: 'Eggs', de: 'Eier' },
  { en: 'Fish', de: 'Fisch' },
  { en: 'Peanuts', de: 'Erdnüsse' },
  { en: 'Soy', de: 'Soja' },
  { en: 'Milk', de: 'Milch' },
  { en: 'Nuts', de: 'Schalenfrüchte' },
  { en: 'Celery', de: 'Sellerie' },
  { en: 'Mustard', de: 'Senf' },
  { en: 'Sesame', de: 'Sesam' },
  { en: 'Sulphites', de: 'Sulfite' },
  { en: 'Lupin', de: 'Lupinen' },
  { en: 'Molluscs', de: 'Weichtiere' },
];

/** Price that reaches a target margin on top of cost (default 60 %), rounded up to the next 10 cents. */
export const suggestPrice = (cost: number, margin = 0.6) => {
  if (!(cost > 0)) return 0;
  return Math.ceil((cost / (1 - margin)) * 10) / 10;
};

export const marginOf = (price: number, cost: number) => (price > 0 && cost > 0 ? (price - cost) / price : null);

export const euro = (value: number | null | undefined, locale: string) =>
  value == null || Number.isNaN(Number(value))
    ? '–'
    : new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(Number(value));

export const hasTranslations = (p: Pick<Product, 'translations'>) => {
  const t = p.translations || {};
  return ['EN', 'FR', 'TR'].every((l) => Boolean((t as any)[l]?.name));
};

/** Downscale a picked photo so the upload stays small, returns a JPEG data URL. */
export const prepareImage = (file: File, maxSide = 1400, quality = 0.85): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('This file is not a usable image'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unavailable'));
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
