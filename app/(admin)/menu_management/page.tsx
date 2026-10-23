"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, Package, Menu as MenuIcon, Briefcase, Clock, Users, ShoppingBag, BarChart3, ShieldCheck,
  Plus, Search, Copy, Pencil, Camera, Languages, EyeOff, Euro, UtensilsCrossed, BookOpen,
} from 'lucide-react';

import { useTranslation } from '@/lib/hooks/useTranslation';
import { L } from '@/lib/i18n/inline';
import { useAdminSession } from '@/lib/hooks/useAdminSession';
import { productsApi, type BulkAction, type Product } from '@/lib/api/products';
import { menusApi, type Menu } from '@/lib/api/menus';
import { servicesApi, type Service } from '@/lib/api/services';
import AdminLanguageToggle from '../components/AdminLanguageToggle';
import AdminLayout from '../components/AdminLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import { adminButtonPrimary, adminButtonSecondary, adminCard, adminInput, adminSelect } from '../components/adminStyles';
import ProductEditor, { draftFromProduct, draftToPayload, emptyDraft, type ProductDraft } from './ProductEditor';
import MenuEditor, { draftFromMenu, emptyMenuDraft, menuDraftToPayload, type MenuDraft } from './MenuEditor';
import { CATEGORIES, categoryLabel, euro, hasTranslations, marginOf } from './catalogueShared';

type Tab = 'dishes' | 'menus';
type Attention = '' | 'noPhoto' | 'hidden' | 'lowMargin' | 'noTranslation';

export default function AdminCatalogue() {
  const { language, toggleLanguage } = useTranslation('admin');
  const session = useAdminSession();
  const isDe = language === 'DE';
  const locale = isDe ? 'de-DE' : 'en-US';
  const t = (de: string, en: string) => L(language, de, en);

  const navigation = useMemo(
    () => [
      { id: 'dashboard', name: t('Übersicht', 'Dashboard'), icon: TrendingUp, path: '/dashboard' },
      { id: 'orders', name: t('Bestellungen', 'Orders'), icon: Package, path: '/orders' },
      { id: 'menu', name: t('Speisen & Menüs', 'Dishes & Menus'), icon: MenuIcon, path: '/menu_management' },
      { id: 'services', name: 'Services', icon: Briefcase, path: '/services_management' },
      { id: 'accessories', name: t('Zubehör', 'Accessories'), icon: ShoppingBag, path: '/accessories' },
      { id: 'system', name: t('Systemsteuerung', 'System Control'), icon: Clock, path: '/system_control' },
      { id: 'customers', name: t('Kunden', 'Customers'), icon: Users, path: '/customers' },
      { id: 'reports', name: t('Berichte', 'Reports'), icon: BarChart3, path: '/reports' },
      { id: 'team', name: 'Team', icon: ShieldCheck, path: '/team' },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

  const [tab, setTab] = useState<Tab>('dishes');
  const [products, setProducts] = useState<Product[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<'all' | 'visible' | 'hidden'>('all');
  const [attention, setAttention] = useState<Attention>('');
  const [selection, setSelection] = useState<Set<number>>(new Set());

  const [productEditor, setProductEditor] = useState<{ id?: number; draft: ProductDraft; name: string } | null>(null);
  const [menuEditor, setMenuEditor] = useState<{ id?: number; draft: MenuDraft } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; run: () => Promise<void> } | null>(null);
  const [priceEdit, setPriceEdit] = useState<{ id: number; value: string } | null>(null);
  const [bulkPrice, setBulkPrice] = useState<{ percent: string } | null>(null);

  const canProductsCreate = session.can('products.create');
  const canProductsEdit = session.can('products.edit');
  const canProductsDelete = session.can('products.delete');
  const canMenusCreate = session.can('menus.create');
  const canMenusEdit = session.can('menus.edit');
  const canMenusDelete = session.can('menus.delete');

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? '' : current)), 4000);
  };

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, m, s] = await Promise.all([
        productsApi.getProducts(),
        menusApi.getMenus({ includeImages: true }),
        servicesApi.getServices().catch(() => [] as Service[]),
      ]);
      setProducts(p);
      setMenus(m);
      setServices(s as Service[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (job: () => Promise<void>, success?: string) => {
    setBusy(true);
    setError('');
    try {
      await job();
      await load();
      if (success) flash(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  /* ---------- derived ---------- */
  const lowMargin = (p: Product) => {
    const m = marginOf(p.price, p.cost);
    return m !== null && m < 0.4;
  };
  const counts = useMemo(() => ({
    all: products.length,
    hidden: products.filter((p) => !p.available).length,
    noPhoto: products.filter((p) => !p.image).length,
    lowMargin: products.filter(lowMargin).length,
    noTranslation: products.filter((p) => !hasTranslations(p)).length,
  }), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q)) return false;
      if (category !== 'all' && String(p.category).toUpperCase() !== category) return false;
      if (status === 'visible' && !p.available) return false;
      if (status === 'hidden' && p.available) return false;
      if (attention === 'noPhoto' && p.image) return false;
      if (attention === 'hidden' && p.available) return false;
      if (attention === 'lowMargin' && !lowMargin(p)) return false;
      if (attention === 'noTranslation' && hasTranslations(p)) return false;
      return true;
    });
  }, [products, search, category, status, attention]);

  const selectedIds = useMemo(() => Array.from(selection).filter((id) => products.some((p) => p.id === id)), [selection, products]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selection.has(p.id));
  const menuCountOf = (p: Product) => (p.menuProducts || []).length;

  /* ---------- actions ---------- */
  const openNewProduct = () => setProductEditor({ draft: emptyDraft(), name: '' });
  const openProduct = (p: Product) => setProductEditor({ id: p.id, draft: draftFromProduct(p), name: p.name });

  const saveProduct = (draft: ProductDraft) =>
    run(async () => {
      const payload = draftToPayload(draft);
      if (productEditor?.id) await productsApi.updateProduct(productEditor.id, payload as any);
      else await productsApi.createProduct(payload as any);
      setProductEditor(null);
    }, t('Gericht gespeichert.', 'Dish saved.'));

  const askDeleteProduct = (ids: number[]) =>
    setConfirm({
      title: ids.length === 1 ? t('Gericht löschen?', 'Delete dish?') : t(`${ids.length} Gerichte löschen?`, `Delete ${ids.length} dishes?`),
      message: t('Bereits bestellte Gerichte werden nur ausgeblendet, damit alte Bestellungen vollständig bleiben.', 'Dishes that were already ordered are only hidden so past orders stay complete.'),
      run: async () => {
        await run(async () => {
          const result = await productsApi.bulkDelete(ids);
          setSelection(new Set());
          setProductEditor(null);
          flash(t(`${result.deleted} gelöscht, ${result.archived} ausgeblendet.`, `${result.deleted} deleted, ${result.archived} hidden.`));
        });
      },
    });

  const bulk = (change: BulkAction, success: string) =>
    run(async () => { await productsApi.bulkUpdate(selectedIds, change); }, success);

  const toggleAvailable = (p: Product) =>
    run(async () => { await productsApi.updateProduct(p.id, { available: !p.available } as any); });

  const commitPrice = () => {
    if (!priceEdit) return;
    const value = Number(priceEdit.value.replace(',', '.'));
    const id = priceEdit.id;
    setPriceEdit(null);
    if (!Number.isFinite(value) || value <= 0) return;
    run(async () => { await productsApi.updateProduct(id, { price: value } as any); }, t('Preis aktualisiert.', 'Price updated.'));
  };

  const duplicateProduct = (p: Product) =>
    run(async () => {
      const copy = await productsApi.duplicateProduct(p.id);
      setProductEditor({ id: copy.id, draft: draftFromProduct(copy), name: copy.name });
    }, t('Kopie angelegt – bitte prüfen und speichern.', 'Copy created – review it and save.'));

  const openNewMenu = () => setMenuEditor({ draft: emptyMenuDraft() });
  const openMenu = (m: Menu) => setMenuEditor({ id: m.id, draft: draftFromMenu(m) });

  const saveMenu = (draft: MenuDraft) =>
    run(async () => {
      const payload = menuDraftToPayload(draft);
      if (menuEditor?.id) await menusApi.updateMenu(menuEditor.id, payload as any);
      else await menusApi.createMenu(payload as any);
      setMenuEditor(null);
    }, t('Menü gespeichert.', 'Menu saved.'));

  const duplicateMenu = (m: Menu) =>
    run(async () => { await menusApi.duplicateMenu(m.id); }, t('Kopie angelegt (inaktiv).', 'Copy created (inactive).'));

  const askDeleteMenu = (m: Menu) =>
    setConfirm({
      title: t('Menü löschen?', 'Delete menu?'),
      message: t(`„${m.name}“ wird entfernt. Die Gerichte bleiben erhalten.`, `“${m.name}” will be removed. The dishes are kept.`),
      run: async () => { await run(async () => { await menusApi.deleteMenu(m.id); setMenuEditor(null); }, t('Menü gelöscht.', 'Menu deleted.')); },
    });

  const toggleMenuActive = (m: Menu) =>
    run(async () => { await menusApi.updateMenu(m.id, { isActive: !m.isActive } as any); });

  const chip = (key: Attention, label: string, count: number, icon: React.ReactNode) => (
    <button
      key={key}
      type="button"
      aria-pressed={attention === key}
      disabled={count === 0 && attention !== key}
      onClick={() => setAttention(attention === key ? '' : key)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${attention === key ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-stone-200 bg-white text-gray-700 hover:bg-stone-50'}`}
    >
      {icon}{label}<span className="rounded-full bg-black/5 px-1.5 text-xs tabular-nums">{count}</span>
    </button>
  );

  /* ---------- render ---------- */
  const dishes = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" aria-label={t('Was Aufmerksamkeit braucht', 'Needs attention')}>
        {chip('noPhoto', t('Ohne Foto', 'No photo'), counts.noPhoto, <Camera size={14} />)}
        {chip('hidden', t('Versteckt', 'Hidden'), counts.hidden, <EyeOff size={14} />)}
        {chip('lowMargin', t('Niedrige Marge', 'Low margin'), counts.lowMargin, <Euro size={14} />)}
        {chip('noTranslation', t('Ohne Übersetzung', 'Not translated'), counts.noTranslation, <Languages size={14} />)}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className={`${adminInput} !pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Gericht suchen …', 'Search dishes…')} aria-label={t('Gericht suchen', 'Search dishes')} />
        </div>
        <select className={`${adminSelect} !w-auto`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t('Kategorie', 'Category')}>
          <option value="all">{t('Alle Kategorien', 'All categories')}</option>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{isDe ? c.de : c.en}</option>)}
        </select>
        <select className={`${adminSelect} !w-auto`} value={status} onChange={(e) => setStatus(e.target.value as any)} aria-label="Status">
          <option value="all">{t('Alle', 'All')}</option>
          <option value="visible">{t('Sichtbar', 'Visible')}</option>
          <option value="hidden">{t('Versteckt', 'Hidden')}</option>
        </select>
      </div>

      {selectedIds.length > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-900 bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          <strong>{t(`${selectedIds.length} ausgewählt`, `${selectedIds.length} selected`)}</strong>
          <span className="flex-1" />
          {canProductsEdit && (
            <>
              <button type="button" className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20" onClick={() => bulk({ action: 'setAvailable', value: true }, t('Gerichte sichtbar.', 'Dishes visible.'))}>{t('Anzeigen', 'Show')}</button>
              <button type="button" className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20" onClick={() => bulk({ action: 'setAvailable', value: false }, t('Gerichte versteckt.', 'Dishes hidden.'))}>{t('Verstecken', 'Hide')}</button>
              <button type="button" className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20" onClick={() => setBulkPrice({ percent: '5' })}>{t('Preis ändern', 'Change price')}</button>
              <select className="rounded-lg bg-white/10 px-2 py-1.5 text-white" aria-label={t('Kategorie setzen', 'Set category')} value="" onChange={(e) => e.target.value && bulk({ action: 'setCategory', value: e.target.value }, t('Kategorie geändert.', 'Category changed.'))}>
                <option className="text-black" value="">{t('Kategorie …', 'Category…')}</option>
                {CATEGORIES.map((c) => <option className="text-black" key={c.key} value={c.key}>{isDe ? c.de : c.en}</option>)}
              </select>
              <select className="rounded-lg bg-white/10 px-2 py-1.5 text-white" aria-label={t('Zu Menü hinzufügen', 'Add to menu')} value="" onChange={(e) => e.target.value && bulk({ action: 'addToMenu', value: Number(e.target.value) }, t('Zum Menü hinzugefügt.', 'Added to menu.'))}>
                <option className="text-black" value="">{t('Zu Menü …', 'Add to menu…')}</option>
                {menus.map((m) => <option className="text-black" key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </>
          )}
          {canProductsDelete && <button type="button" className="rounded-lg bg-red-600 px-3 py-1.5 hover:bg-red-700" onClick={() => askDeleteProduct(selectedIds)}>{t('Löschen', 'Delete')}</button>}
          <button type="button" className="rounded-lg px-2 py-1.5 underline" onClick={() => setSelection(new Set())}>{t('Auswahl aufheben', 'Clear')}</button>
        </div>
      )}

      {filtered.length > 0 && (
        <label className="flex items-center gap-2 px-1 text-sm text-gray-600">
          <input type="checkbox" className="accent-gray-900" checked={allFilteredSelected}
            onChange={(e) => setSelection(e.target.checked ? new Set([...selection, ...filtered.map((p) => p.id)]) : new Set([...selection].filter((id) => !filtered.some((p) => p.id === id))))} />
          {t(`${filtered.length} Gerichte`, `${filtered.length} dishes`)}
        </label>
      )}

      <ul className="space-y-2">
        {filtered.map((p) => {
          const margin = marginOf(p.price, p.cost);
          return (
            <li key={p.id} className={`${adminCard} flex items-center gap-3 !rounded-2xl p-3 sm:gap-4 sm:p-4 ${selection.has(p.id) ? 'ring-2 ring-gray-900' : ''}`}>
              <input type="checkbox" className="accent-gray-900" aria-label={t('Auswählen', 'Select')} checked={selection.has(p.id)}
                onChange={(e) => { const next = new Set(selection); if (e.target.checked) next.add(p.id); else next.delete(p.id); setSelection(next); }} />
              <button type="button" onClick={() => openProduct(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left" disabled={!session.can('products.view')}>
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-16 sm:w-16">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : <Camera size={18} className="absolute inset-0 m-auto text-gray-400" />}
                </span>
                <span className="min-w-0">
                  <span className={`block line-clamp-2 font-semibold sm:truncate ${p.available ? 'text-gray-900' : 'text-gray-500'}`}>{p.name}</span>
                  <span className="block truncate text-xs text-gray-500">
                    {categoryLabel(String(p.category), isDe)} · {t(`in ${menuCountOf(p)} Menüs`, `in ${menuCountOf(p)} menus`)}
                    {!hasTranslations(p) && <span className="ml-1 text-amber-700">· {t('nicht übersetzt', 'not translated')}</span>}
                  </span>
                </span>
              </button>
              <div className="text-right">
                {priceEdit?.id === p.id ? (
                  <input autoFocus inputMode="decimal" className="w-20 rounded-lg border border-amber-500 px-2 py-1 text-right text-sm" value={priceEdit.value}
                    onChange={(e) => setPriceEdit({ id: p.id, value: e.target.value })} onBlur={commitPrice}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitPrice(); if (e.key === 'Escape') setPriceEdit(null); }} aria-label={t('Preis', 'Price')} />
                ) : (
                  <button type="button" className="rounded-lg px-2 py-1 text-sm font-semibold hover:bg-stone-100 disabled:hover:bg-transparent" disabled={!canProductsEdit}
                    title={canProductsEdit ? t('Preis ändern', 'Edit price') : undefined} onClick={() => setPriceEdit({ id: p.id, value: String(p.price) })}>
                    {euro(p.price, locale)}
                  </button>
                )}
                {margin !== null && <span className={`block text-[11px] ${margin < 0.4 ? 'text-red-600' : 'text-gray-500'}`}>{Math.round(margin * 100)} % {t('Marge', 'margin')}</span>}
              </div>
              <button type="button" role="switch" aria-checked={p.available} aria-label={t('Sichtbar im Shop', 'Visible in shop')} disabled={!canProductsEdit || busy}
                onClick={() => toggleAvailable(p)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${p.available ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${p.available ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
              <div className="hidden gap-1 sm:flex">
                {canProductsEdit && <button type="button" className="rounded-lg p-2 text-gray-600 hover:bg-stone-100" aria-label={t('Bearbeiten', 'Edit')} onClick={() => openProduct(p)}><Pencil size={16} /></button>}
                {canProductsCreate && <button type="button" className="rounded-lg p-2 text-gray-600 hover:bg-stone-100" aria-label={t('Duplizieren', 'Duplicate')} onClick={() => duplicateProduct(p)}><Copy size={16} /></button>}
              </div>
            </li>
          );
        })}
        {!loading && filtered.length === 0 && (
          <li className={`${adminCard} p-8 text-center text-gray-600`}>
            {products.length === 0 ? t('Noch keine Gerichte. Legen Sie das erste an.', 'No dishes yet. Add the first one.') : t('Keine Treffer für diese Filter.', 'Nothing matches these filters.')}
          </li>
        )}
      </ul>
    </div>
  );

  const menuGrid = (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {menus.map((m) => {
        const dishCount = (m.menuProducts || []).length;
        const courses = (m.steps || []).filter((s) => Number(s.included) > 0);
        return (
          <article key={m.id} className={`${adminCard} flex flex-col overflow-hidden !rounded-2xl ${m.isActive ? '' : 'opacity-75'}`}>
            <button type="button" className="relative block h-36 w-full bg-stone-100 text-left" onClick={() => openMenu(m)} disabled={!session.can('menus.view')}>
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.image} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : <Camera size={22} className="absolute inset-0 m-auto text-gray-400" />}
              {!m.isActive && <span className="absolute left-3 top-3 rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">{t('Inaktiv', 'Inactive')}</span>}
            </button>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <h3 className="font-semibold text-gray-900">{m.name}</h3>
              <p className="text-sm text-gray-600">
                {m.price != null ? t(`${euro(m.price, locale)} p. P.`, `${euro(m.price, locale)} per person`) : t('Preis auf Anfrage', 'Price on request')}
                {m.minPeople ? ` · ${t(`ab ${m.minPeople} Gästen`, `min. ${m.minPeople} guests`)}` : ''}
              </p>
              <p className="text-xs text-gray-500">
                {courses.map((s) => `${s.included}× ${categoryLabel(String(s.label).toUpperCase(), isDe)}`).join(' · ') || t('Keine Gänge festgelegt', 'No courses set')}
              </p>
              <p className="text-xs text-gray-500">{t(`${dishCount} Gerichte zur Auswahl`, `${dishCount} dishes to choose from`)}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <button type="button" role="switch" aria-checked={m.isActive} aria-label={t('Aktiv', 'Active')} disabled={!canMenusEdit || busy} onClick={() => toggleMenuActive(m)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${m.isActive ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${m.isActive ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
                <span className="flex gap-1">
                  {canMenusCreate && <button type="button" className="rounded-lg p-2 text-gray-600 hover:bg-stone-100" aria-label={t('Duplizieren', 'Duplicate')} onClick={() => duplicateMenu(m)}><Copy size={16} /></button>}
                  <button type="button" className={`${adminButtonSecondary} !px-3 !py-1.5 text-xs`} onClick={() => openMenu(m)}><Pencil size={14} />{canMenusEdit ? t('Bearbeiten', 'Edit') : t('Ansehen', 'View')}</button>
                </span>
              </div>
            </div>
          </article>
        );
      })}
      {!loading && menus.length === 0 && <div className={`${adminCard} p-8 text-center text-gray-600 sm:col-span-2 xl:col-span-3`}>{t('Noch keine Menüs.', 'No menus yet.')}</div>}
    </div>
  );

  return (
    <AdminLayout
      navigation={navigation}
      title={t('Speisen & Menüs', 'Dishes & menus')}
      adminUserLabel={session.me?.name || 'Admin'}
      adminRoleLabel={session.me?.roleName || ''}
      languageToggle={<AdminLanguageToggle language={language} onToggle={toggleLanguage} />}
      locale={locale}
    >
      <div className="space-y-5">
        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
        {notice && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" className="inline-flex rounded-2xl border border-stone-200 bg-white p-1">
            {([['dishes', t('Gerichte', 'Dishes'), UtensilsCrossed, products.length], ['menus', t('Menüs', 'Menus'), BookOpen, menus.length]] as const).map(([key, label, Icon, n]) => (
              <button key={key} role="tab" aria-selected={tab === key} type="button" onClick={() => setTab(key)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${tab === key ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-stone-100'}`}>
                <Icon size={16} />{label}<span className="text-xs opacity-70">{n}</span>
              </button>
            ))}
          </div>
          {tab === 'dishes' && canProductsCreate && <button type="button" className={adminButtonPrimary} onClick={openNewProduct}><Plus size={16} />{t('Gericht hinzufügen', 'Add dish')}</button>}
          {tab === 'menus' && canMenusCreate && <button type="button" className={adminButtonPrimary} onClick={openNewMenu}><Plus size={16} />{t('Menü anlegen', 'New menu')}</button>}
        </div>

        {loading ? <p className="text-gray-600">{t('Lädt …', 'Loading…')}</p> : tab === 'dishes' ? dishes : menuGrid}

        <p className="pt-2 text-center text-xs text-gray-500">
          <a href="/menu_management/classic" className="underline">{t('Klassischer Editor', 'Classic editor')}</a>
          {' · '}{t('für Spezialfälle wie die Wiederherstellung der Standardmenüs', 'for special cases such as restoring the default menus')}
        </p>
      </div>

      {productEditor && (
        <ProductEditor
          key={productEditor.id ?? 'new'}
          initial={productEditor.draft}
          isNew={!productEditor.id || productEditor.draft.name === ''}
          menus={menus}
          existingNames={products.map((p) => p.name)}
          busy={busy}
          canDelete={canProductsDelete}
          language={language}
          locale={locale}
          t={t}
          onSave={saveProduct}
          onClose={() => setProductEditor(null)}
          onDelete={productEditor.id ? () => askDeleteProduct([productEditor.id!]) : undefined}
        />
      )}

      {menuEditor && (
        <MenuEditor
          key={menuEditor.id ?? 'new'}
          initial={menuEditor.draft}
          isNew={!menuEditor.id}
          products={products}
          services={services}
          busy={busy}
          canDelete={canMenusDelete}
          language={language}
          locale={locale}
          t={t}
          onSave={saveMenu}
          onClose={() => setMenuEditor(null)}
          onDelete={menuEditor.id ? () => askDeleteMenu(menus.find((m) => m.id === menuEditor.id)!) : undefined}
        />
      )}

      {bulkPrice && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">{t('Preis ändern', 'Change price')}</h2>
            <p className="mt-1 text-sm text-gray-600">{t(`Für ${selectedIds.length} Gerichte. Minus senkt, Plus erhöht den Preis.`, `For ${selectedIds.length} dishes. Minus lowers, plus raises the price.`)}</p>
            <div className="mt-4 flex items-center gap-2">
              <input autoFocus inputMode="decimal" className={adminInput} value={bulkPrice.percent} onChange={(e) => setBulkPrice({ percent: e.target.value })} aria-label="%" />
              <span className="text-lg font-semibold">%</span>
            </div>
            <div className="mt-2 flex gap-2">
              {['-10', '-5', '5', '10'].map((v) => <button key={v} type="button" className={`${adminButtonSecondary} !px-3 !py-1.5 text-xs`} onClick={() => setBulkPrice({ percent: v })}>{Number(v) > 0 ? `+${v}` : v} %</button>)}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={adminButtonSecondary} onClick={() => setBulkPrice(null)}>{t('Abbrechen', 'Cancel')}</button>
              <button type="button" className={adminButtonPrimary} disabled={!Number.isFinite(Number(bulkPrice.percent.replace(',', '.'))) || Number(bulkPrice.percent.replace(',', '.')) === 0}
                onClick={() => { const amount = Number(bulkPrice.percent.replace(',', '.')); setBulkPrice(null); bulk({ action: 'adjustPrice', value: { mode: 'percent', amount } }, t('Preise angepasst.', 'Prices updated.')); }}>
                {t('Anwenden', 'Apply')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          description={confirm.message}
          confirmText={t('Bestätigen', 'Confirm')}
          cancelText={t('Abbrechen', 'Cancel')}
          isDanger
          onCancel={() => setConfirm(null)}
          onConfirm={async () => { const job = confirm.run; setConfirm(null); await job(); }}
        />
      )}
    </AdminLayout>
  );
}
