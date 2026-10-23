"use client";

import React, { useMemo, useState } from 'react';
import { Camera, ChevronDown, Lightbulb, Sparkles, Trash2, X } from 'lucide-react';

import type { Product } from '@/lib/api/products';
import type { Menu } from '@/lib/api/menus';
import { productName, productDesc } from '@/lib/i18n/catalog';
import {
  adminButtonPrimary,
  adminButtonSecondary,
  adminInput,
  adminSelect,
} from '../components/adminStyles';
import { ALLERGENS, CATEGORIES, categoryLabel, euro, marginOf, prepareImage, suggestPrice } from './catalogueShared';

type T = (de: string, en: string) => string;

export type ProductDraft = {
  name: string;
  description: string;
  category: string;
  customCategory: string;
  price: string;
  cost: string;
  minOrderQuantity: string;
  available: boolean;
  allergens: string[];
  allergensDe: string[];
  menuIds: number[];
  image: string | null;
  imageChanged: boolean;
  translations: Record<'EN' | 'FR' | 'TR', { name: string; description: string }>;
};

const LANGS: Array<{ key: 'EN' | 'FR' | 'TR'; label: string }> = [
  { key: 'EN', label: 'English' },
  { key: 'FR', label: 'Français' },
  { key: 'TR', label: 'Türkçe' },
];

export const emptyDraft = (): ProductDraft => ({
  name: '',
  description: '',
  category: 'MAIN',
  customCategory: '',
  price: '',
  cost: '',
  minOrderQuantity: '5',
  available: true,
  allergens: [],
  allergensDe: [],
  menuIds: [],
  image: null,
  imageChanged: false,
  translations: { EN: { name: '', description: '' }, FR: { name: '', description: '' }, TR: { name: '', description: '' } },
});

export const draftFromProduct = (p: Product): ProductDraft => ({
  name: p.name || '',
  description: p.description || '',
  category: String(p.category || 'MAIN').toUpperCase(),
  customCategory: p.customCategory || '',
  price: String(p.price ?? ''),
  cost: p.cost ? String(p.cost) : '',
  minOrderQuantity: String(p.minOrderQuantity ?? 1),
  available: p.available,
  allergens: Array.isArray(p.allergens) ? p.allergens : [],
  allergensDe: Array.isArray(p.allergensDe) ? p.allergensDe : [],
  menuIds: (p.menuProducts || []).map((mp) => mp.menuId),
  image: p.image || null,
  imageChanged: false,
  translations: {
    EN: { name: p.translations?.EN?.name || '', description: p.translations?.EN?.description || '' },
    FR: { name: p.translations?.FR?.name || '', description: p.translations?.FR?.description || '' },
    TR: { name: p.translations?.TR?.name || '', description: p.translations?.TR?.description || '' },
  },
});

export const draftToPayload = (d: ProductDraft) => {
  const translations: Record<string, { name?: string; description?: string }> = {};
  (['EN', 'FR', 'TR'] as const).forEach((l) => {
    const { name, description } = d.translations[l];
    if (name.trim() || description.trim()) translations[l] = { name: name.trim(), description: description.trim() };
  });
  return {
    name: d.name.trim(),
    description: d.description.trim(),
    category: d.category,
    customCategory: d.customCategory.trim() || null,
    price: Number(String(d.price).replace(',', '.')) || 0,
    cost: Number(String(d.cost).replace(',', '.')) || 0,
    minOrderQuantity: Math.max(1, parseInt(d.minOrderQuantity, 10) || 1),
    available: d.available,
    allergens: d.allergens,
    allergensDe: d.allergensDe,
    ingredients: [] as string[],
    menuIds: d.menuIds,
    translations,
    ...(d.imageChanged && { image: d.image }),
  };
};

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200/80 p-4 sm:p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">{title}</h3>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-gray-800">{children}</label>;
}

export default function ProductEditor({
  initial,
  isNew,
  menus,
  existingNames,
  busy,
  canDelete,
  language,
  locale,
  t,
  onSave,
  onClose,
  onDelete,
}: {
  initial: ProductDraft;
  isNew: boolean;
  menus: Menu[];
  existingNames: string[];
  busy: boolean;
  canDelete: boolean;
  language: string;
  locale: string;
  t: T;
  onSave: (draft: ProductDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [d, setD] = useState<ProductDraft>(initial);
  const [showTranslations, setShowTranslations] = useState(
    Boolean(initial.translations.EN.name || initial.translations.FR.name || initial.translations.TR.name)
  );
  const [imageError, setImageError] = useState('');
  const isDe = language === 'DE';
  const set = (patch: Partial<ProductDraft>) => setD((prev) => ({ ...prev, ...patch }));

  const price = Number(String(d.price).replace(',', '.')) || 0;
  const cost = Number(String(d.cost).replace(',', '.')) || 0;
  const margin = marginOf(price, cost);
  const suggested = suggestPrice(cost);
  const categoryDefaultQty = CATEGORIES.find((c) => c.key === d.category)?.minQty;

  const nameTaken = useMemo(() => {
    const n = d.name.trim().toLowerCase();
    return Boolean(n) && existingNames.some((x) => x.trim().toLowerCase() === n && x.trim().toLowerCase() !== initial.name.trim().toLowerCase());
  }, [d.name, existingNames, initial.name]);

  const toggleAllergen = (a: { en: string; de: string }) => {
    const has = d.allergens.includes(a.en);
    set({
      allergens: has ? d.allergens.filter((x) => x !== a.en) : [...d.allergens, a.en],
      allergensDe: has ? d.allergensDe.filter((x) => x !== a.de) : [...d.allergensDe, a.de],
    });
  };

  const onPhoto = async (file?: File | null) => {
    if (!file) return;
    setImageError('');
    try {
      set({ image: await prepareImage(file), imageChanged: true });
    } catch (e) {
      setImageError(e instanceof Error ? e.message : String(e));
    }
  };

  const fillSuggestions = () => {
    const next = { ...d.translations };
    (['EN', 'FR', 'TR'] as const).forEach((l) => {
      const name = productName(l, d.name);
      const description = productDesc(l, d.description);
      next[l] = {
        name: next[l].name || (name !== d.name ? name : ''),
        description: next[l].description || (description !== d.description ? description : ''),
      };
    });
    set({ translations: next });
  };

  const canSave = d.name.trim().length > 1 && price > 0 && !busy;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[94dvh] w-full max-w-3xl flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-5 py-4 sm:px-7">
          <h2 className="text-xl font-semibold text-gray-900">{isNew ? t('Neues Gericht', 'New dish') : t('Gericht bearbeiten', 'Edit dish')}</h2>
          <button type="button" onClick={onClose} aria-label={t('Schließen', 'Close')} className="rounded-lg p-1.5 text-gray-500 hover:bg-stone-100"><X size={18} /></button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
          <Section title={t('Grunddaten', 'Basics')}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="shrink-0">
                <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50 sm:w-36">
                  {d.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-xs text-gray-500"><Camera size={22} />{t('Foto fehlt', 'No photo')}</div>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <label className={`${adminButtonSecondary} flex-1 cursor-pointer !px-3 !py-2 text-xs`}>
                    {d.image ? t('Ändern', 'Change') : t('Foto hochladen', 'Upload photo')}
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => { onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                  {d.image && (
                    <button type="button" className={`${adminButtonSecondary} !px-3 !py-2`} aria-label={t('Foto entfernen', 'Remove photo')} onClick={() => set({ image: null, imageChanged: true })}><Trash2 size={14} /></button>
                  )}
                </div>
                {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <Label htmlFor="p-name">{t('Name', 'Name')} *</Label>
                  <input id="p-name" className={adminInput} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder={t('z. B. Rindergulasch mit Spätzle', 'e.g. Beef goulash with spätzle')} autoFocus={isNew} />
                  {nameTaken && <p className="mt-1 text-xs text-amber-700">{t('Ein Gericht mit diesem Namen existiert schon.', 'A dish with this name already exists.')}</p>}
                </div>
                <div>
                  <Label htmlFor="p-desc">{t('Beschreibung', 'Description')}</Label>
                  <textarea id="p-desc" rows={3} className={adminInput} value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder={t('Ein bis zwei Sätze, die Appetit machen', 'One or two sentences that make guests hungry')} />
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="p-cat">{t('Kategorie', 'Category')}</Label>
                <select id="p-cat" className={adminSelect} value={d.category} onChange={(e) => set({ category: e.target.value, minOrderQuantity: String(CATEGORIES.find((c) => c.key === e.target.value)?.minQty ?? d.minOrderQuantity) })}>
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{isDe ? c.de : c.en}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="p-custom">{t('Eigene Kategorie (optional)', 'Custom category (optional)')}</Label>
                <input id="p-custom" className={adminInput} value={d.customCategory} onChange={(e) => set({ customCategory: e.target.value })} placeholder={t('z. B. Vegan', 'e.g. Vegan')} />
              </div>
            </div>
          </Section>

          <Section title={t('Preis', 'Price')} hint={t('Der Preis gilt pro Portion. Tragen Sie Ihre Kosten ein, dann schlagen wir einen Preis vor.', 'The price is per portion. Enter your cost and we will suggest a price.')}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="p-price">{t('Verkaufspreis (€)', 'Selling price (€)')} *</Label>
                <input id="p-price" inputMode="decimal" className={adminInput} value={d.price} onChange={(e) => set({ price: e.target.value })} placeholder="0,00" />
              </div>
              <div>
                <Label htmlFor="p-cost">{t('Unsere Kosten (€)', 'Our cost (€)')}</Label>
                <input id="p-cost" inputMode="decimal" className={adminInput} value={d.cost} onChange={(e) => set({ cost: e.target.value })} placeholder="0,00" />
              </div>
              <div>
                <Label htmlFor="p-min">{t('Mindestmenge', 'Minimum quantity')}</Label>
                <input id="p-min" type="number" min={1} className={adminInput} value={d.minOrderQuantity} onChange={(e) => set({ minOrderQuantity: e.target.value })} />
              </div>
            </div>
            {(suggested > 0 || margin !== null || categoryDefaultQty) && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <Lightbulb size={16} className="shrink-0" />
                {margin !== null && (
                  <span>{t('Marge', 'Margin')}: <strong>{Math.round(margin * 100)} %</strong>{margin < 0.4 ? ` – ${t('niedrig', 'low')}` : margin >= 0.55 ? ` – ${t('gesund', 'healthy')}` : ''}</span>
                )}
                {suggested > 0 && Math.abs(suggested - price) > 0.05 && (
                  <button type="button" className="font-semibold underline" onClick={() => set({ price: suggested.toFixed(2) })}>
                    {t(`Vorschlag übernehmen: ${euro(suggested, locale)}`, `Use suggested price: ${euro(suggested, locale)}`)}
                  </button>
                )}
                {categoryDefaultQty && Number(d.minOrderQuantity) !== categoryDefaultQty && (
                  <button type="button" className="font-semibold underline" onClick={() => set({ minOrderQuantity: String(categoryDefaultQty) })}>
                    {t(`Üblich für ${categoryLabel(d.category, true)}: ${categoryDefaultQty}`, `Usual for ${categoryLabel(d.category, false)}: ${categoryDefaultQty}`)}
                  </button>
                )}
              </div>
            )}
          </Section>

          <Section title={t('Allergene', 'Allergens')} hint={t('Tippen Sie an, was enthalten ist.', 'Tap everything that is contained.')}>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => {
                const on = d.allergens.includes(a.en);
                return (
                  <button key={a.en} type="button" aria-pressed={on} onClick={() => toggleAllergen(a)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${on ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-stone-200 bg-white text-gray-700 hover:bg-stone-50'}`}>
                    {isDe ? a.de : a.en}
                  </button>
                );
              })}
            </div>
          </Section>

          {menus.length > 0 && (
            <Section title={t('In diesen Menüs anbieten', 'Offer in these menus')}>
              <div className="flex flex-wrap gap-2">
                {menus.map((m) => {
                  const on = d.menuIds.includes(m.id);
                  return (
                    <button key={m.id} type="button" aria-pressed={on}
                      onClick={() => set({ menuIds: on ? d.menuIds.filter((x) => x !== m.id) : [...d.menuIds, m.id] })}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${on ? 'border-gray-900 bg-gray-900 text-white' : 'border-stone-200 bg-white text-gray-700 hover:bg-stone-50'}`}>
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          <section className="rounded-2xl border border-stone-200/80">
            <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left sm:px-5" onClick={() => setShowTranslations((v) => !v)} aria-expanded={showTranslations}>
              <span>
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-700">{t('Übersetzungen', 'Translations')}</span>
                <span className="block text-xs text-gray-500">{t('Optional. Ohne Übersetzung sehen Gäste den deutschen Text.', 'Optional. Without a translation guests see the German text.')}</span>
              </span>
              <ChevronDown size={18} className={`transition-transform ${showTranslations ? 'rotate-180' : ''}`} />
            </button>
            {showTranslations && (
              <div className="space-y-4 border-t border-stone-200/80 px-4 py-4 sm:px-5">
                <button type="button" className={`${adminButtonSecondary} !py-2 text-xs`} onClick={fillSuggestions}>
                  <Sparkles size={14} /> {t('Bekannte Übersetzungen einfügen', 'Fill in known translations')}
                </button>
                {LANGS.map((l) => (
                  <div key={l.key} className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">{l.label}</span>
                    <input className={adminInput} aria-label={`${l.label} – ${t('Name', 'Name')}`} placeholder={t('Name', 'Name')} value={d.translations[l.key].name}
                      onChange={(e) => set({ translations: { ...d.translations, [l.key]: { ...d.translations[l.key], name: e.target.value } } })} />
                    <textarea rows={2} className={adminInput} aria-label={`${l.label} – ${t('Beschreibung', 'Description')}`} placeholder={t('Beschreibung', 'Description')} value={d.translations[l.key].description}
                      onChange={(e) => set({ translations: { ...d.translations, [l.key]: { ...d.translations[l.key], description: e.target.value } } })} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <label className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/80 px-4 py-3 sm:px-5">
            <span>
              <span className="block text-sm font-semibold text-gray-800">{t('Im Shop sichtbar', 'Visible in the shop')}</span>
              <span className="block text-xs text-gray-500">{t('Ausgeblendete Gerichte können nicht bestellt werden.', 'Hidden dishes cannot be ordered.')}</span>
            </span>
            <input type="checkbox" className="h-5 w-10 cursor-pointer accent-gray-900" checked={d.available} onChange={(e) => set({ available: e.target.checked })} />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 px-5 py-4 sm:px-7">
          {!isNew && canDelete && onDelete ? (
            <button type="button" className="text-sm font-semibold text-red-600 hover:underline" onClick={onDelete}>{t('Löschen', 'Delete')}</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className={adminButtonSecondary} onClick={onClose}>{t('Abbrechen', 'Cancel')}</button>
            <button type="button" className={adminButtonPrimary} disabled={!canSave} onClick={() => onSave(d)}>
              {busy ? t('Speichern …', 'Saving…') : t('Speichern', 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
