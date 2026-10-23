"use client";

import React, { useMemo, useState } from 'react';
import { Camera, Lightbulb, Minus, Plus, Search, Trash2, Wand2, X } from 'lucide-react';

import type { Menu } from '@/lib/api/menus';
import type { Product } from '@/lib/api/products';
import type { Service } from '@/lib/api/services';
import { productName } from '@/lib/i18n/catalog';
import { adminButtonPrimary, adminButtonSecondary, adminInput } from '../components/adminStyles';
import { CATEGORIES, categoryLabel, euro, prepareImage } from './catalogueShared';

type T = (de: string, en: string) => string;

export type MenuDraft = {
  name: string;
  description: string;
  isActive: boolean;
  price: string;
  minPeople: string;
  startDate: string;
  endDate: string;
  image: string | null;
  imageChanged: boolean;
  /** portions per guest by course (category key), 0 = course not offered */
  courses: Record<string, number>;
  /** steps with labels we do not manage here (kept untouched on save) */
  otherSteps: Array<{ label: string; included: number }>;
  productIds: number[];
  serviceIds: number[];
};

const KEYS = CATEGORIES.map((c) => c.key);

export const emptyMenuDraft = (): MenuDraft => ({
  name: '', description: '', isActive: true, price: '', minPeople: '10', startDate: '', endDate: '',
  image: null, imageChanged: false, courses: { STARTER: 2, MAIN: 2, DESSERT: 1 }, otherSteps: [], productIds: [], serviceIds: [],
});

const toDateInput = (value?: string | null) => (value ? String(value).slice(0, 10) : '');

export const draftFromMenu = (m: Menu): MenuDraft => {
  const courses: Record<string, number> = {};
  const otherSteps: Array<{ label: string; included: number }> = [];
  (m.steps || []).forEach((s) => {
    const key = String(s.label || '').toUpperCase();
    if (KEYS.includes(key as any)) courses[key] = (courses[key] || 0) + Number(s.included || 0);
    else otherSteps.push({ label: s.label, included: Number(s.included || 0) });
  });
  return {
    name: m.name || '',
    description: m.description || '',
    isActive: m.isActive,
    price: m.price != null ? String(m.price) : '',
    minPeople: m.minPeople != null ? String(m.minPeople) : '',
    startDate: toDateInput(m.startDate),
    endDate: toDateInput(m.endDate),
    image: m.image || null,
    imageChanged: false,
    courses,
    otherSteps,
    productIds: (m.menuProducts || []).map((mp) => mp.productId),
    serviceIds: (m.menuServices || []).map((ms) => ms.serviceId),
  };
};

export const menuDraftToPayload = (d: MenuDraft) => {
  const steps = [
    ...KEYS.filter((k) => (d.courses[k] || 0) > 0).map((k) => ({ label: k.toLowerCase(), included: d.courses[k] })),
    ...d.otherSteps,
  ];
  return {
    name: d.name.trim(),
    description: d.description.trim(),
    isActive: d.isActive,
    price: d.price === '' ? null : Number(String(d.price).replace(',', '.')) || 0,
    minPeople: d.minPeople === '' ? null : Math.max(1, parseInt(d.minPeople, 10) || 1),
    startDate: d.startDate || '',
    endDate: d.endDate || '',
    steps,
    productIds: d.productIds,
    serviceIds: d.serviceIds,
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

const Label = ({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-gray-800">{children}</label>
);

export default function MenuEditor({
  initial, isNew, products, services, busy, canDelete, language, locale, t, onSave, onClose, onDelete,
}: {
  initial: MenuDraft;
  isNew: boolean;
  products: Product[];
  services: Service[];
  busy: boolean;
  canDelete: boolean;
  language: string;
  locale: string;
  t: T;
  onSave: (draft: MenuDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [d, setD] = useState<MenuDraft>(initial);
  const [query, setQuery] = useState('');
  const [imageError, setImageError] = useState('');
  const isDe = language === 'DE';
  const set = (patch: Partial<MenuDraft>) => setD((prev) => ({ ...prev, ...patch }));

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selected = useMemo(() => new Set(d.productIds), [d.productIds]);
  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || productName('EN', p.name).toLowerCase().includes(q));
  }, [products, query]);

  const grouped = useMemo(
    () => CATEGORIES.map((c) => ({ ...c, items: visibleProducts.filter((p) => String(p.category).toUpperCase() === c.key) })).filter((g) => g.items.length),
    [visibleProducts]
  );

  const toggle = (ids: number[], on: boolean) =>
    set({ productIds: on ? Array.from(new Set([...d.productIds, ...ids])) : d.productIds.filter((x) => !ids.includes(x)) });

  const setCourse = (key: string, value: number) => set({ courses: { ...d.courses, [key]: Math.max(0, Math.min(20, value)) } });

  // Recommendation: average price of the chosen dishes per course × portions per guest
  const suggestedPrice = useMemo(() => {
    let sum = 0;
    for (const key of KEYS) {
      const portions = d.courses[key] || 0;
      if (!portions) continue;
      const chosen = d.productIds.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p) && String(p!.category).toUpperCase() === key);
      if (!chosen.length) continue;
      sum += portions * (chosen.reduce((a, p) => a + p.price, 0) / chosen.length);
    }
    return sum > 0 ? Math.ceil(sum) - 0.1 : 0;
  }, [d.courses, d.productIds, byId]);

  // Warnings: a course needs at least as many dishes to choose from as portions per guest
  const courseWarnings = KEYS.filter((k) => {
    const portions = d.courses[k] || 0;
    if (!portions) return false;
    const n = d.productIds.filter((id) => String(byId.get(id)?.category).toUpperCase() === k).length;
    return n < portions;
  });

  const addAllForCourses = () => {
    const ids = products
      .filter((p) => p.available && (d.courses[String(p.category).toUpperCase()] || 0) > 0)
      .map((p) => p.id);
    set({ productIds: Array.from(new Set([...d.productIds, ...ids])) });
  };

  const onPhoto = async (file?: File | null) => {
    if (!file) return;
    setImageError('');
    try { set({ image: await prepareImage(file), imageChanged: true }); }
    catch (e) { setImageError(e instanceof Error ? e.message : String(e)); }
  };

  const price = Number(String(d.price).replace(',', '.')) || 0;
  const canSave = d.name.trim().length > 1 && !busy;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[94dvh] w-full max-w-3xl flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-5 py-4 sm:px-7">
          <h2 className="text-xl font-semibold text-gray-900">{isNew ? t('Neues Menü', 'New menu') : t('Menü bearbeiten', 'Edit menu')}</h2>
          <button type="button" onClick={onClose} aria-label={t('Schließen', 'Close')} className="rounded-lg p-1.5 text-gray-500 hover:bg-stone-100"><X size={18} /></button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
          <Section title={t('Grunddaten', 'Basics')}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="shrink-0">
                <div className="h-32 w-full overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50 sm:w-40">
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
                  {d.image && <button type="button" className={`${adminButtonSecondary} !px-3 !py-2`} aria-label={t('Foto entfernen', 'Remove photo')} onClick={() => set({ image: null, imageChanged: true })}><Trash2 size={14} /></button>}
                </div>
                {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <Label htmlFor="m-name">{t('Name', 'Name')} *</Label>
                  <input id="m-name" className={adminInput} value={d.name} onChange={(e) => set({ name: e.target.value })} autoFocus={isNew} />
                </div>
                <div>
                  <Label htmlFor="m-desc">{t('Beschreibung', 'Description')}</Label>
                  <textarea id="m-desc" rows={2} className={adminInput} value={d.description} onChange={(e) => set({ description: e.target.value })} />
                </div>
              </div>
            </div>
          </Section>

          <Section title={t('Gänge pro Gast', 'Courses per guest')} hint={t('Wie viele Gerichte darf sich jeder Gast je Gang aussuchen? 0 = Gang nicht im Menü.', 'How many dishes may each guest pick per course? 0 = course not in this menu.')}>
            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map((c) => {
                const value = d.courses[c.key] || 0;
                return (
                  <div key={c.key} className={`flex items-center justify-between rounded-xl border px-3 py-2 ${value ? 'border-amber-300 bg-amber-50/60' : 'border-stone-200'}`}>
                    <span className="text-sm font-medium text-gray-800">{isDe ? c.de : c.en}</span>
                    <span className="flex items-center gap-2">
                      <button type="button" aria-label={t('Weniger', 'Fewer')} className="rounded-lg border border-stone-200 bg-white p-1.5 hover:bg-stone-50" onClick={() => setCourse(c.key, value - 1)}><Minus size={14} /></button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
                      <button type="button" aria-label={t('Mehr', 'More')} className="rounded-lg border border-stone-200 bg-white p-1.5 hover:bg-stone-50" onClick={() => setCourse(c.key, value + 1)}><Plus size={14} /></button>
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title={t('Preis & Bedingungen', 'Price & conditions')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="m-price">{t('Preis pro Person (€)', 'Price per person (€)')}</Label>
                <input id="m-price" inputMode="decimal" className={adminInput} value={d.price} onChange={(e) => set({ price: e.target.value })} placeholder="0,00" />
              </div>
              <div>
                <Label htmlFor="m-min">{t('Mindestanzahl Gäste', 'Minimum guests')}</Label>
                <input id="m-min" type="number" min={1} className={adminInput} value={d.minPeople} onChange={(e) => set({ minPeople: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="m-start">{t('Verfügbar ab (optional)', 'Available from (optional)')}</Label>
                <input id="m-start" type="date" className={adminInput} value={d.startDate} onChange={(e) => set({ startDate: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="m-end">{t('Verfügbar bis (optional)', 'Available until (optional)')}</Label>
                <input id="m-end" type="date" className={adminInput} value={d.endDate} onChange={(e) => set({ endDate: e.target.value })} />
              </div>
            </div>
            {suggestedPrice > 0 && Math.abs(suggestedPrice - price) > 0.05 && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <Lightbulb size={16} className="shrink-0" />
                <span>{t('Aus den gewählten Gerichten ergibt sich etwa', 'Based on the chosen dishes, a fitting price is about')} <strong>{euro(suggestedPrice, locale)}</strong>.</span>
                <button type="button" className="font-semibold underline" onClick={() => set({ price: suggestedPrice.toFixed(2) })}>{t('Übernehmen', 'Use it')}</button>
              </div>
            )}
          </Section>

          <Section title={`${t('Gerichte', 'Dishes')} (${d.productIds.length})`}>
            {courseWarnings.length > 0 && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
                {t('Zu wenig Auswahl bei: ', 'Not enough choice for: ')}{courseWarnings.map((k) => categoryLabel(k, isDe)).join(', ')}.
                {' '}{t('Gäste brauchen mindestens so viele Gerichte wie Portionen pro Gast.', 'Guests need at least as many dishes as portions per guest.')}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[12rem] flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input className={`${adminInput} !pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Gericht suchen …', 'Search dishes…')} aria-label={t('Gericht suchen', 'Search dishes')} />
              </div>
              <button type="button" className={`${adminButtonSecondary} !py-2.5 text-xs`} onClick={addAllForCourses}>
                <Wand2 size={14} /> {t('Alle passenden Gerichte hinzufügen', 'Add all fitting dishes')}
              </button>
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-stone-200/80 p-3">
              {grouped.length === 0 && <p className="text-sm text-gray-500">{t('Keine Gerichte gefunden.', 'No dishes found.')}</p>}
              {grouped.map((g) => {
                const ids = g.items.map((p) => p.id);
                const allOn = ids.every((id) => selected.has(id));
                return (
                  <div key={g.key}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">{isDe ? g.de : g.en}</span>
                      <button type="button" className="text-xs font-semibold text-amber-800 underline" onClick={() => toggle(ids, !allOn)}>{allOn ? t('Alle abwählen', 'Clear all') : t('Alle wählen', 'Select all')}</button>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {g.items.map((p) => (
                        <label key={p.id} className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-stone-50 ${p.available ? '' : 'opacity-60'}`}>
                          <input type="checkbox" className="accent-gray-900" checked={selected.has(p.id)} onChange={(e) => toggle([p.id], e.target.checked)} />
                          <span className="min-w-0 flex-1 truncate">{p.name}</span>
                          {!p.available && <span className="text-[10px] uppercase text-gray-500">{t('versteckt', 'hidden')}</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {services.length > 0 && (
            <Section title={t('Für diese Services', 'For these services')} hint={t('Das Menü erscheint nur bei den gewählten Services.', 'The menu only appears for the selected services.')}>
              <div className="flex flex-wrap gap-2">
                {services.map((s) => {
                  const on = d.serviceIds.includes(s.id);
                  return (
                    <button key={s.id} type="button" aria-pressed={on}
                      onClick={() => set({ serviceIds: on ? d.serviceIds.filter((x) => x !== s.id) : [...d.serviceIds, s.id] })}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${on ? 'border-gray-900 bg-gray-900 text-white' : 'border-stone-200 bg-white text-gray-700 hover:bg-stone-50'}`}>
                      {isDe ? (s.nameDe || s.name) : s.name}
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          <label className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/80 px-4 py-3 sm:px-5">
            <span>
              <span className="block text-sm font-semibold text-gray-800">{t('Im Shop sichtbar', 'Visible in the shop')}</span>
              <span className="block text-xs text-gray-500">{t('Inaktive Menüs sind für Gäste nicht auswählbar.', 'Inactive menus cannot be chosen by guests.')}</span>
            </span>
            <input type="checkbox" className="h-5 w-10 cursor-pointer accent-gray-900" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 px-5 py-4 sm:px-7">
          {!isNew && canDelete && onDelete ? (
            <button type="button" className="text-sm font-semibold text-red-600 hover:underline" onClick={onDelete}>{t('Löschen', 'Delete')}</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className={adminButtonSecondary} onClick={onClose}>{t('Abbrechen', 'Cancel')}</button>
            <button type="button" className={adminButtonPrimary} disabled={!canSave} onClick={() => onSave(d)}>{busy ? t('Speichern …', 'Saving…') : t('Speichern', 'Save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
