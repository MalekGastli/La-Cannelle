import { prisma } from '../prisma';
import { translationService } from './translationService';

const chunk = <T,>(items: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
};

/**
 * Public GET requests must never call DeepL or write to the database. On-read translation is therefore OFF
 * unless DEEPL_AUTO_TRANSLATE_ON_READ is explicitly enabled, and even then it only runs fire-and-forget,
 * deduplicated and rate-limited, never inside (or able to fail) the request.
 */
export const isAutoTranslateOnReadEnabled = () => {
  const raw = process.env.DEEPL_AUTO_TRANSLATE_ON_READ;
  if (raw === undefined) return false;
  const normalized = String(raw).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

type BackfillKind = 'products' | 'services' | 'accessories';

const ON_READ_MIN_INTERVAL_MS = 60_000; // at most one background run per kind per minute per instance
const ON_READ_MAX_ITEMS = 20; // and at most this many rows per run
const onReadRunning = new Set<BackfillKind>();
const onReadLastStart: Partial<Record<BackfillKind, number>> = {};

const hasStrings = (value: unknown) => Array.isArray(value) && value.some((v) => String(v ?? '').trim());

const needsTranslation: Record<BackfillKind, (row: any) => boolean> = {
  products: (p) => (!p.ingredientsDe && hasStrings(p.ingredients)) || (!p.allergensDe && hasStrings(p.allergens)),
  services: (s) => (!s.nameDe && s.name) || (!s.descriptionDe && s.description),
  accessories: (a) =>
    (!a.nameDe && a.nameEn) || (!a.descriptionDe && a.descriptionEn) || (!a.detailsDe && a.detailsEn) || (!a.unitDe && a.unitEn),
};

export const translationBackfillService = {
  /**
   * Fire-and-forget. Returns immediately; errors are swallowed. `onDone` runs after rows were written
   * (callers use it to invalidate their in-memory cache).
   */
  scheduleOnRead(kind: BackfillKind, rows: any[], onDone?: () => void) {
    try {
      if (!isAutoTranslateOnReadEnabled()) return;
      if (!(process.env.DEEPL_AUTH_KEY || process.env.DEEPL_API_KEY)) return;
      if (onReadRunning.has(kind)) return;
      const now = Date.now();
      if (now - (onReadLastStart[kind] ?? 0) < ON_READ_MIN_INTERVAL_MS) return;

      // copies, so the background job never mutates objects that live in the response cache
      const pending = rows.filter(needsTranslation[kind]).slice(0, ON_READ_MAX_ITEMS).map((row) => ({ ...row }));
      if (!pending.length) return;

      onReadRunning.add(kind);
      onReadLastStart[kind] = now;
      setImmediate(() => {
        const run =
          kind === 'products'
            ? this.backfillProductsDe(pending as any)
            : kind === 'services'
            ? this.backfillServicesDe(pending as any)
            : this.backfillAccessoriesDe(pending as any);
        run
          .then(() => onDone?.())
          .catch((error) => console.warn(`On-read translation (${kind}) failed:`, (error as Error)?.message ?? error))
          .finally(() => onReadRunning.delete(kind));
      });
    } catch (error) {
      console.warn('Could not schedule on-read translation:', (error as Error)?.message ?? error);
    }
  },

  async backfillProductsDe(products: Array<{
    id: number;
    name: string;
    description: string;
    ingredients?: any;
    ingredientsDe?: any;
    allergens?: any;
    allergensDe?: any;
  }>) {
    const normalizeStringArray = (value: unknown) => {
      if (!Array.isArray(value)) return [];
      return value
        .map((item) => String(item ?? '').trim())
        .filter((item) => item.length > 0);
    };

    const missingIngredients = products.filter(p => !p.ingredientsDe && normalizeStringArray((p as any).ingredients).length > 0);
    for (const product of missingIngredients) {
      const ingredients = normalizeStringArray((product as any).ingredients);
      const translated = await translationService.translateTexts(ingredients, { targetLang: 'DE' });
      if (!translated) return;
      await prisma.product.update({
        where: { id: product.id },
        data: { ingredientsDe: translated }
      });
      (product as any).ingredientsDe = translated;
    }

    const missingAllergens = products.filter(p => !p.allergensDe && normalizeStringArray((p as any).allergens).length > 0);
    for (const product of missingAllergens) {
      const allergens = normalizeStringArray((product as any).allergens);
      const translated = await translationService.translateTexts(allergens, { targetLang: 'DE' });
      if (!translated) return;
      await prisma.product.update({
        where: { id: product.id },
        data: { allergensDe: translated }
      });
      (product as any).allergensDe = translated;
    }
  },

  async backfillAccessoriesDe(accessories: Array<{
    id: number;
    nameEn: string;
    nameDe?: string | null;
    descriptionEn: string;
    descriptionDe?: string | null;
    detailsEn?: string | null;
    detailsDe?: string | null;
    unitEn?: string | null;
    unitDe?: string | null;
  }>) {
    const missingNames = accessories.filter(a => !a.nameDe && a.nameEn);
    const missingDescriptions = accessories.filter(a => !a.descriptionDe && a.descriptionEn);
    const missingDetails = accessories.filter(a => !a.detailsDe && a.detailsEn);
    const missingUnits = accessories.filter(a => !a.unitDe && a.unitEn);

    for (const batch of chunk(missingNames, 25)) {
      const translated = await translationService.translateTexts(batch.map(a => a.nameEn), { targetLang: 'DE' });
      if (!translated) return;
      await Promise.all(batch.map((a, idx) => prisma.accessory.update({
        where: { id: a.id },
        data: { nameDe: translated[idx] ?? null }
      })));
      batch.forEach((a, idx) => { (a as any).nameDe = translated[idx] ?? null; });
    }

    for (const batch of chunk(missingDescriptions, 10)) {
      const translated = await translationService.translateTexts(batch.map(a => a.descriptionEn), { targetLang: 'DE' });
      if (!translated) return;
      await Promise.all(batch.map((a, idx) => prisma.accessory.update({
        where: { id: a.id },
        data: { descriptionDe: translated[idx] ?? null }
      })));
      batch.forEach((a, idx) => { (a as any).descriptionDe = translated[idx] ?? null; });
    }

    for (const batch of chunk(missingDetails, 10)) {
      const translated = await translationService.translateTexts(batch.map(a => a.detailsEn || ''), { targetLang: 'DE' });
      if (!translated) return;
      await Promise.all(batch.map((a, idx) => prisma.accessory.update({
        where: { id: a.id },
        data: { detailsDe: translated[idx] ? translated[idx] : null }
      })));
      batch.forEach((a, idx) => { (a as any).detailsDe = translated[idx] ? translated[idx] : null; });
    }

    for (const batch of chunk(missingUnits, 25)) {
      const translated = await translationService.translateTexts(batch.map(a => a.unitEn || ''), { targetLang: 'DE' });
      if (!translated) return;
      await Promise.all(batch.map((a, idx) => prisma.accessory.update({
        where: { id: a.id },
        data: { unitDe: translated[idx] ? translated[idx] : null }
      })));
      batch.forEach((a, idx) => { (a as any).unitDe = translated[idx] ? translated[idx] : null; });
    }
  },

  async backfillServicesDe(services: Array<{ id: number; name: string; description?: string | null; nameDe?: string | null; descriptionDe?: string | null }>) {
    const missingNames = services.filter(s => !s.nameDe && s.name);
    const missingDescriptions = services.filter(s => !s.descriptionDe && s.description);

    for (const batch of chunk(missingNames, 25)) {
      const translated = await translationService.translateTexts(batch.map(s => s.name), { targetLang: 'DE' });
      if (!translated) return;
      await Promise.all(batch.map((s, idx) => prisma.service.update({
        where: { id: s.id },
        data: { nameDe: translated[idx] ?? null }
      })));
      batch.forEach((s, idx) => { (s as any).nameDe = translated[idx] ?? null; });
    }

    for (const batch of chunk(missingDescriptions, 10)) {
      const translated = await translationService.translateTexts(batch.map(s => s.description || ''), { targetLang: 'DE' });
      if (!translated) return;
      await Promise.all(batch.map((s, idx) => prisma.service.update({
        where: { id: s.id },
        data: { descriptionDe: translated[idx] ? translated[idx] : null }
      })));
      batch.forEach((s, idx) => { (s as any).descriptionDe = translated[idx] ? translated[idx] : null; });
    }
  }
};
