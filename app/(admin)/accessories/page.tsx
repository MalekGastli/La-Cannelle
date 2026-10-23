"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  TrendingUp,
  Package,
  Menu,
  Clock,
  Users,
  DollarSign,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Briefcase,
  BarChart3
} from 'lucide-react';

import { useTranslation } from '@/lib/hooks/useTranslation';
import AdminLanguageToggle from '../components/AdminLanguageToggle';
import AdminLayout from '../components/AdminLayout';
import { accessoriesApi, type Accessory } from '@/lib/api/accessories';
import ConfirmDialog from '../components/ConfirmDialog';
import { useBodyScrollLock } from '../components/useBodyScrollLock';
import LoadingOverlay from '../components/LoadingOverlay';
import LoadingSpinner from '@/components/LoadingSpinner';

type FormState = {
  id?: number;
  name: string;
  description: string;
  details: string;
  price: string;
  quantityMode: 'GUEST_COUNT' | 'FIXED' | 'CLIENT';
  fixedQuantity: string;
  image: string;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  details: '',
  price: '0',
  quantityMode: 'GUEST_COUNT',
  fixedQuantity: '',
  image: '',
  isActive: true
});

export default function AdminAccessories() {
  const { language, toggleLanguage } = useTranslation('admin');
  const [isVisible, setIsVisible] = useState(false);
  const locale = language === 'DE' ? 'de-DE' : 'en-US';

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useBodyScrollLock(modalOpen);

  const copy = useMemo(() => {
    const isDE = language === 'DE';
    return {
      nav: {
        dashboard: isDE ? 'Übersicht' : 'Dashboard',
        orders: isDE ? 'Bestellungen' : 'Orders',
        menu: isDE ? 'Menüverwaltung' : 'Menu Management',
        services: isDE ? 'Dienstleistungen' : 'Services',
        accessories: isDE ? 'Zubehör' : 'Accessories',
        system: isDE ? 'Systemsteuerung' : 'System Control',
        customers: isDE ? 'Kunden' : 'Customers',
        reports: isDE ? 'Berichte' : 'Reports'
      },
      header: {
        title: isDE ? 'Zubehör verwalten' : 'Accessories Management',
        subtitle: isDE
          ? 'Erstellen, bearbeiten und deaktivieren Sie optionales Zubehör'
          : 'Create, edit, and deactivate optional accessories',
        add: isDE ? 'Zubehör hinzufügen' : 'Add Accessory',
        refresh: isDE ? 'Aktualisieren' : 'Refresh'
      },
      filters: {
        searchPlaceholder: isDE ? 'Suchen...' : 'Search...',
        all: isDE ? 'Alle' : 'All',
        active: isDE ? 'Aktiv' : 'Active',
        inactive: isDE ? 'Inaktiv' : 'Inactive'
      },
      table: {
        image: isDE ? 'Bild' : 'Image',
        name: isDE ? 'Name' : 'Name',
        price: isDE ? 'Preis' : 'Price',
        quantityRule: isDE ? 'Mengenregel' : 'Quantity rule',
        status: isDE ? 'Status' : 'Status',
        updated: isDE ? 'Aktualisiert' : 'Updated',
        actions: isDE ? 'Aktionen' : 'Actions'
      },
      actions: {
        edit: isDE ? 'Bearbeiten' : 'Edit',
        delete: isDE ? 'Löschen' : 'Delete',
        confirmDelete: isDE ? 'Dieses Zubehör löschen?' : 'Delete this accessory?',
      },
      confirm: {
        title: isDE ? 'Zubehör löschen' : 'Delete accessory',
        body: isDE ? 'Möchten Sie dieses Zubehör wirklich löschen?' : 'Do you really want to delete this accessory?',
      },
      modal: {
        createTitle: isDE ? 'Zubehör erstellen' : 'Create Accessory',
        editTitle: isDE ? 'Zubehör bearbeiten' : 'Edit Accessory',
        save: isDE ? 'Speichern' : 'Save',
        cancel: isDE ? 'Abbrechen' : 'Cancel',
        previewAlt: isDE ? 'Vorschau' : 'Preview',
        english: isDE ? 'Englisch' : 'English',
        german: isDE ? 'Deutsch' : 'German',
        required: isDE ? 'Pflichtfeld' : 'Required'
      },
      fields: {
        name: isDE ? 'Name' : 'Name',
        description: isDE ? 'Beschreibung' : 'Description',
        details: isDE ? 'Details' : 'Details',
        price: isDE ? 'Preis' : 'Price',
        quantityMode: isDE ? 'Mengenregel' : 'Quantity rule',
        quantityModeGuest: isDE ? 'Wie Gästeanzahl (Bestellung)' : 'Same as guest count (order)',
        quantityModeFixed: isDE ? 'Feste Menge' : 'Fixed quantity',
        quantityModeClient: isDE ? 'Vom Kunden wählbar' : 'Client adjustable',
        fixedQuantity: isDE ? 'Feste Menge' : 'Fixed quantity',
        image: isDE ? 'Bild (URL oder Upload)' : 'Image (URL or upload)',
        imageUrl: isDE ? 'Bild URL' : 'Image URL',
        upload: isDE ? 'Bild hochladen' : 'Upload image',
        isActive: isDE ? 'Aktiv' : 'Active'
      },
      toast: {
        saved: isDE ? 'Gespeichert' : 'Saved',
        deleted: isDE ? 'Gelöscht' : 'Deleted',
        failedLoad: isDE ? 'Laden fehlgeschlagen' : 'Failed to load',
        failedSave: isDE ? 'Speichern fehlgeschlagen' : 'Failed to save',
        failedDelete: isDE ? 'Löschen fehlgeschlagen' : 'Failed to delete'
      },
      status: {
        loading: isDE ? 'Lade...' : 'Loading...',
        noResults: isDE ? 'Kein Zubehör gefunden.' : 'No accessories found.',
      }
    };
  }, [language]);

  useEffect(() => {
    setIsVisible(true);
  }, []);


  const loadAccessories = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await accessoriesApi.getAccessories();
      setAccessories(data);
    } catch (err: any) {
      setLoadError(err?.message || copy.toast.failedLoad);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccessories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAccessories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return accessories.filter((a) => {
      if (statusFilter === 'active' && !a.isActive) return false;
      if (statusFilter === 'inactive' && a.isActive) return false;
      if (!query) return true;
      const haystack = [
        a.nameEn,
        a.nameDe || '',
        a.descriptionEn,
        a.descriptionDe || ''
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [accessories, search, statusFilter]);

  const openCreate = () => {
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (accessory: Accessory) => {
    setForm({
      id: accessory.id,
      name: accessory.nameDe || accessory.nameEn || '',
      description: accessory.descriptionDe || accessory.descriptionEn || '',
      details: accessory.detailsDe || accessory.detailsEn || '',
      price: String(accessory.price ?? 0),
      quantityMode: accessory.quantityMode === 'FIXED'
        ? 'FIXED'
        : accessory.quantityMode === 'CLIENT'
        ? 'CLIENT'
        : 'GUEST_COUNT',
      fixedQuantity: accessory.fixedQuantity != null ? String(accessory.fixedQuantity) : '',
      image: accessory.image || '',
      isActive: Boolean(accessory.isActive)
    });
    setModalOpen(true);
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      setForm((prev) => ({ ...prev, image: value }));
    };
    reader.readAsDataURL(file);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm());
  };

  const saveAccessory = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      return;
    }
    if (form.quantityMode === 'FIXED' && !(Number(form.fixedQuantity) > 0)) {
      return;
    }

    const name = form.name.trim();
    const description = form.description.trim();
    const details = form.details.trim();

    const payload: any = {
      nameEn: name,
      nameDe: name,
      descriptionEn: description,
      descriptionDe: description,
      detailsEn: details || null,
      detailsDe: details || null,
      unitEn: null,
      unitDe: null,
      price: Number(form.price),
      quantityMode: form.quantityMode,
      fixedQuantity: form.quantityMode === 'FIXED' ? Number(form.fixedQuantity) : null,
      image: form.image.trim() || null,
      isActive: form.isActive
    };

    try {
      setSaving(true);
      if (form.id) {
        const updated = await accessoriesApi.updateAccessory(form.id, payload);
        setAccessories((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await accessoriesApi.createAccessory(payload);
        setAccessories((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : copy.toast.failedSave;
      setLoadError(message || copy.toast.failedSave);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccessory = async (id: number) => {
    setDeleting(true);
    try {
      await accessoriesApi.deleteAccessory(id);
      setAccessories((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : copy.toast.failedDelete;
      setLoadError(message || copy.toast.failedDelete);
    } finally {
      setDeleting(false);
    }
  };

  const requestDeleteAccessory = (id: number) => {
    setConfirmDeleteId(id);
    setConfirmOpen(true);
  };

  const navigation = [
    { id: 'dashboard', name: copy.nav.dashboard, icon: TrendingUp, path: '/dashboard' },
    { id: 'orders', name: copy.nav.orders, icon: Package, path: '/orders' },
    { id: 'menu', name: copy.nav.menu, icon: Menu, path: '/menu_management' },
    { id: 'services', name: copy.nav.services, icon: Briefcase, path: '/services_management' },
    { id: 'accessories', name: copy.nav.accessories, icon: ShoppingBag, path: '/accessories' },
    { id: 'system', name: copy.nav.system, icon: Clock, path: '/system_control' },
    { id: 'customers', name: copy.nav.customers, icon: Users, path: '/customers' },
    { id: 'reports', name: copy.nav.reports, icon: BarChart3, path: '/reports' }
  ];

  return (
    <AdminLayout
      navigation={navigation}
      title={copy.header.title}
      adminUserLabel={language === 'DE' ? 'Admin Benutzer' : 'Admin User'}
      adminRoleLabel={language === 'DE' ? 'Administrator' : 'Administrator'}
      languageToggle={<AdminLanguageToggle language={language} onToggle={toggleLanguage} />}
      locale={locale}
      openMenuLabel={language === 'DE' ? 'Menü öffnen' : 'Open menu'}
      closeMenuLabel={language === 'DE' ? 'Menü schließen' : 'Close menu'}
      headerMeta={
        <div className="flex items-center gap-3">
          <button
            onClick={loadAccessories}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            type="button"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{copy.header.refresh}</span>
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-black transition-colors flex items-center gap-2"
            type="button"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{copy.header.add}</span>
          </button>
        </div>
      }
    >
      <LoadingOverlay
        open={isLoading || saving || deleting}
        label={
          isLoading
            ? copy.status.loading
            : deleting
            ? (language === 'DE' ? 'Lösche...' : 'Deleting...')
            : language === 'DE'
            ? 'Speichert...'
            : 'Saving...'
        }
        minDurationMs={900}
      />
      <div className={`${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 mb-6`}>
        <p className="text-gray-600">{copy.header.subtitle}</p>
      </div>
            {loadError && (
              <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{loadError}</span>
              </div>
            )}

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-gray-500" size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={copy.filters.searchPlaceholder}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder:text-gray-500 bg-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
              >
                <option value="all">{copy.filters.all}</option>
                <option value="active">{copy.filters.active}</option>
                <option value="inactive">{copy.filters.inactive}</option>
              </select>
              <div className="flex items-center justify-end text-sm text-gray-600 px-2">
                {filteredAccessories.length} / {accessories.length}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-300 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-300">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {copy.table.image}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {copy.table.name}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {copy.table.price}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {copy.table.quantityRule}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {copy.table.status}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {copy.table.updated}
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {copy.table.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-600">
                          <LoadingSpinner label={copy.status.loading} />
                        </td>
                      </tr>
                    ) : filteredAccessories.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-600">
                          <div className="space-y-3">
                            <div>{copy.status.noResults}</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                        filteredAccessories.map((a) => (
                          (() => {
                            const displayName = language === 'DE'
                              ? (a.nameDe || a.nameEn)
                              : (a.nameEn || a.nameDe || '');
                            return (
                          <tr key={a.id} className="hover:bg-amber-50/50">
                            <td className="px-6 py-4">
                              <div className="h-12 w-12 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={a.image || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop'}
                                  alt={displayName}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">{displayName}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-800">EUR {Number(a.price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-gray-800 text-sm">
                            {a.quantityMode === 'FIXED'
                              ? `${copy.fields.quantityModeFixed}: ${a.fixedQuantity ?? '-'}`
                              : a.quantityMode === 'CLIENT'
                              ? copy.fields.quantityModeClient
                              : copy.fields.quantityModeGuest}
                          </td>
                          <td className="px-6 py-4">
                            {a.isActive ? (
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200">
                                <CheckCircle className="w-4 h-4" />
                                {copy.filters.active}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                                {copy.filters.inactive}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-700 text-sm">
                            {new Date(a.updatedAt).toLocaleDateString(language === 'DE' ? 'de-DE' : 'en-US')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(a)}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                                title={copy.actions.edit}
                                type="button"
                              >
                                <Edit className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                onClick={() => requestDeleteAccessory(a.id)}
                                className="p-2 rounded-lg border border-red-200 hover:bg-red-50"
                                title={copy.actions.delete}
                                type="button"
                              >
                                <Trash2 className="w-4 h-4 text-red-700" />
                              </button>
                            </div>
                          </td>
                          </tr>
                            );
                          })()
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <button
            type="button"
            aria-label={copy.modal.cancel}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {form.id ? copy.modal.editTitle : copy.modal.createTitle}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-800">
                    {copy.fields.name} <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-800">
                    {copy.fields.description} <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="mt-2 w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-800">{copy.fields.details}</label>
                  <textarea
                    value={form.details}
                    onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))}
                    rows={2}
                    className="mt-2 w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-800">{copy.fields.price}</label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    inputMode="decimal"
                    className="mt-2 w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-800">{copy.fields.quantityMode}</label>
                  <select
                    value={form.quantityMode}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const next = (raw === 'FIXED' || raw === 'CLIENT' ? raw : 'GUEST_COUNT') as FormState['quantityMode'];
                      setForm((p) => ({
                        ...p,
                        quantityMode: next,
                        fixedQuantity: next === 'FIXED' ? (p.fixedQuantity || '1') : ''
                      }));
                    }}
                    className="mt-2 w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white text-gray-900"
                  >
                    <option value="GUEST_COUNT">{copy.fields.quantityModeGuest}</option>
                    <option value="FIXED">{copy.fields.quantityModeFixed}</option>
                    <option value="CLIENT">{copy.fields.quantityModeClient}</option>
                  </select>
                </div>

                {form.quantityMode === 'FIXED' && (
                  <div>
                    <label className="text-sm font-semibold text-gray-800">{copy.fields.fixedQuantity}</label>
                    <input
                      value={form.fixedQuantity}
                      onChange={(e) => setForm((p) => ({ ...p, fixedQuantity: e.target.value }))}
                      inputMode="numeric"
                      className="mt-2 w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white text-gray-900 placeholder:text-gray-500"
                      placeholder="1"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-800">{copy.fields.image}</label>

                  <label className="mt-3 block text-xs font-semibold text-gray-700">{copy.fields.imageUrl}</label>
                  <input
                    value={form.image}
                    onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white text-gray-900 placeholder:text-gray-500"
                  />

                  <label className="mt-4 block text-xs font-semibold text-gray-700">{copy.fields.upload}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />

                  {form.image.trim() && (
                    <div className="mt-3 h-44 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.image.trim()} alt={copy.modal.previewAlt} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-gray-800">
                    {copy.fields.isActive}
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 bg-gray-50/60">
              <button
                onClick={closeModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors"
              >
                {copy.modal.cancel}
              </button>
              <button
                onClick={saveAccessory}
                disabled={
                  saving
                  || !form.name.trim()
                  || !form.description.trim()
                  || (form.quantityMode === 'FIXED' && !(Number(form.fixedQuantity) > 0))
                }
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {copy.modal.save}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={copy.confirm.title}
        description={copy.confirm.body}
        confirmText={copy.actions.delete}
        cancelText={copy.modal.cancel}
        isDanger
        isLoading={deleting}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmDeleteId(null);
        }}
        onConfirm={async () => {
          if (confirmDeleteId == null) return;
          setConfirmOpen(false);
          await deleteAccessory(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </AdminLayout>
  );
}
