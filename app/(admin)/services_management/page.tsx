"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Clock,
  Edit,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Save,
  ShoppingBag,
  Trash2,
  Users,
  Briefcase,
  X
} from 'lucide-react';

import { useTranslation } from '@/lib/hooks/useTranslation';
import AdminLanguageToggle from '../components/AdminLanguageToggle';
import AdminLayout from '../components/AdminLayout';
import { servicesApi, type Service, type ServiceOccasion } from '@/lib/api/services';
import ConfirmDialog from '../components/ConfirmDialog';
import { useBodyScrollLock } from '../components/useBodyScrollLock';
import LoadingOverlay from '../components/LoadingOverlay';
import LoadingSpinner from '@/components/LoadingSpinner';

type FormState = {
  id?: number;
  name: string;
  nameDe: string;
  occasion: ServiceOccasion;
  description: string;
  descriptionDe: string;
  image: string;
  isActive: boolean;
};

function getEmptyForm(): FormState {
  return {
    name: '',
    nameDe: '',
    occasion: 'BOTH',
    description: '',
    descriptionDe: '',
    image: '',
    isActive: true
  };
}

export default function AdminServicesManagement() {
  const { language, toggleLanguage } = useTranslation('admin');
  const isDE = language === 'DE';
  const locale = isDE ? 'de-DE' : 'en-US';

  const t = useMemo(() => {
    return {
      nav: {
        dashboard: isDE ? 'Übersicht' : 'Dashboard',
        orders: isDE ? 'Bestellungen' : 'Orders',
        menu: isDE ? 'Menüverwaltung' : 'Menu Management',
        services: isDE ? 'Services' : 'Services',
        accessories: isDE ? 'Zubehör' : 'Accessories',
        system: isDE ? 'Systemsteuerung' : 'System Control',
        customers: isDE ? 'Kunden' : 'Customers',
        reports: isDE ? 'Berichte' : 'Reports'
      },
      title: isDE ? 'Services' : 'Services',
      subtitle: isDE
        ? 'Erstellen, bearbeiten und zu Menüs zuweisen'
        : 'Create, edit, and assign to menus',
      actions: {
        new: isDE ? 'Neuer Service' : 'New service',
        edit: isDE ? 'Bearbeiten' : 'Edit',
        delete: isDE ? 'Löschen' : 'Delete',
        cancel: isDE ? 'Abbrechen' : 'Cancel',
        save: isDE ? 'Speichern' : 'Save',
        active: isDE ? 'Aktiv' : 'Active',
        inactive: isDE ? 'Inaktiv' : 'Inactive',
        enable: isDE ? 'Aktivieren' : 'Enable',
        disable: isDE ? 'Deaktivieren' : 'Disable'
      },
      placeholders: {
        search: isDE ? 'Name' : 'Name'
      },
      status: {
        loading: isDE ? 'Lade...' : 'Loading...',
        empty: isDE ? 'Keine Services gefunden.' : 'No services found.'
      },
      errors: {
        failedLoad: isDE ? 'Services konnten nicht geladen werden.' : 'Failed to load services',
        failedSave: isDE ? 'Service konnte nicht gespeichert werden.' : 'Failed to save service',
        failedDelete: isDE ? 'Service konnte nicht gelöscht werden.' : 'Failed to delete service',
        failedUpdate: isDE ? 'Service konnte nicht aktualisiert werden.' : 'Failed to update service'
      },
      labels: {
        serviceImageAlt: isDE ? 'Service-Bild' : 'Service image'
      },
      modal: {
        createTitle: isDE ? 'Service erstellen' : 'Create service',
        editTitle: isDE ? 'Service bearbeiten' : 'Edit service'
      },
      fields: {
        name: isDE ? 'Name (EN)' : 'Name (EN)',
        nameDe: isDE ? 'Name (DE)' : 'Name (DE)',
        occasion: isDE ? 'Anlass' : 'Occasion',
        description: isDE ? 'Beschreibung (EN)' : 'Description (EN)',
        descriptionDe: isDE ? 'Beschreibung (DE)' : 'Description (DE)',
        image: isDE ? 'Bild (URL oder Upload)' : 'Image (URL or upload)',
        imageUrl: isDE ? 'Bild-URL' : 'Image URL',
        upload: isDE ? 'Bild hochladen' : 'Upload image',
        status: isDE ? 'Status' : 'Status'
      },
      filters: {
        search: isDE ? 'Suchen' : 'Search',
        allOccasions: isDE ? 'Alle Anlaesse' : 'All occasions',
        business: isDE ? 'Business' : 'Business',
        private: isDE ? 'Privat' : 'Private',
        both: isDE ? 'Beides' : 'Both'
      },
      confirmDelete: isDE ? 'Service wirklich löschen?' : 'Delete this service?'
    };
  }, [isDE]);

  const navigation = useMemo(() => {
    return [
      { id: 'dashboard', name: t.nav.dashboard, icon: BarChart3, path: '/dashboard' },
      { id: 'orders', name: t.nav.orders, icon: Package, path: '/orders' },
      { id: 'menu', name: t.nav.menu, icon: Menu, path: '/menu_management' },
      { id: 'services', name: t.nav.services, icon: Briefcase, path: '/services_management' },
      { id: 'accessories', name: t.nav.accessories, icon: ShoppingBag, path: '/accessories' },
      { id: 'system', name: t.nav.system, icon: Clock, path: '/system_control' },
      { id: 'customers', name: t.nav.customers, icon: Users, path: '/customers' },
      { id: 'reports', name: t.nav.reports, icon: BarChart3, path: '/reports' }
    ];
  }, [t]);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [search, setSearch] = useState('');
  const [occasionFilter, setOccasionFilter] = useState<'ALL' | ServiceOccasion>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(getEmptyForm());
  const [saving, setSaving] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [mutatingLabel, setMutatingLabel] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDeleteService, setConfirmDeleteService] = useState<Service | null>(null);

  useBodyScrollLock(modalOpen);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      const matchesSearch = !q
        || s.name.toLowerCase().includes(q)
        || (s.nameDe || '').toLowerCase().includes(q)
        || (s.description || '').toLowerCase().includes(q)
        || (s.descriptionDe || '').toLowerCase().includes(q);
      const matchesOccasion = occasionFilter === 'ALL' || s.occasion === occasionFilter;
      return matchesSearch && matchesOccasion;
    });
  }, [services, search, occasionFilter]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await servicesApi.getServices();
      setServices(data);
    } catch (e: any) {
      setError(e?.message || t.errors.failedLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runMutation = async (label: string, action: () => Promise<void>) => {
    setMutating(true);
    setMutatingLabel(label);
    try {
      await action();
    } finally {
      setMutating(false);
      setMutatingLabel('');
    }
  };

  const openCreate = () => {
    setForm(getEmptyForm());
    setModalOpen(true);
  };

  const openEdit = (service: Service) => {
    setForm({
      id: service.id,
      name: service.name,
      nameDe: service.nameDe || '',
      occasion: service.occasion,
      description: service.description || '',
      descriptionDe: service.descriptionDe || '',
      image: service.image || '',
      isActive: service.isActive
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

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      const payload: Partial<Service> = {
        name: form.name.trim(),
        nameDe: form.nameDe.trim() || null,
        occasion: form.occasion,
        description: form.description.trim() || null,
        descriptionDe: form.descriptionDe.trim() || null,
        image: form.image.trim() || null,
        isActive: form.isActive
      };
      if (form.id) {
        await servicesApi.updateService(form.id, payload as any);
      } else {
        await servicesApi.createService(payload as any);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message || t.errors.failedSave);
    } finally {
      setSaving(false);
    }
  };

  const requestRemove = (service: Service) => {
    setConfirmDeleteService(service);
    setConfirmOpen(true);
  };

  const remove = async (service: Service) => {
    await runMutation(isDE ? 'Lösche...' : 'Deleting...', async () => {
      try {
        setError('');
        await servicesApi.deleteService(service.id);
        await load();
      } catch (e: any) {
        setError(e?.message || t.errors.failedDelete);
      }
    });
  };

  const toggleActive = async (service: Service) => {
    await runMutation(isDE ? 'Aktualisiere...' : 'Updating...', async () => {
      try {
        setError('');
        await servicesApi.updateService(service.id, { isActive: !service.isActive } as any);
        setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, isActive: !s.isActive } : s)));
      } catch (e: any) {
        setError(e?.message || t.errors.failedUpdate);
      }
    });
  };

  const overlayLabel = loading
    ? t.status.loading
    : saving
    ? (isDE ? 'Speichert...' : 'Saving...')
    : mutatingLabel || (isDE ? 'Bitte warten...' : 'Please wait...');

  return (
    <AdminLayout
      navigation={navigation}
      title={t.title}
      adminUserLabel={isDE ? 'Admin Benutzer' : 'Admin User'}
      adminRoleLabel={isDE ? 'Administrator' : 'Administrator'}
      languageToggle={<AdminLanguageToggle language={language} onToggle={toggleLanguage} />}
      locale={locale}
      openMenuLabel={isDE ? 'Menü öffnen' : 'Open menu'}
      closeMenuLabel={isDE ? 'Menü schließen' : 'Close menu'}
      headerMeta={
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            type="button"
            disabled={loading || saving || mutating}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isDE ? 'Aktualisieren' : 'Refresh'}</span>
          </button>
          <button
            onClick={openCreate}
            type="button"
            disabled={loading || saving || mutating}
            className="px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.actions.new}</span>
          </button>
        </div>
      }
    >
      <LoadingOverlay open={loading || saving || mutating} label={overlayLabel} minDurationMs={900} />
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 font-elegant">{t.subtitle}</h2>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span className="min-w-0">{error}</span>
        </div>
      ) : null}

      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid sm:grid-cols-2 gap-3 w-full md:max-w-2xl">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">{t.filters.search}</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                placeholder={t.placeholders.search}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">{t.fields.occasion}</label>
              <select
                value={occasionFilter}
                onChange={(e) => setOccasionFilter(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              >
                <option value="ALL">{t.filters.allOccasions}</option>
                <option value="BUSINESS">{t.filters.business}</option>
                <option value="PRIVATE">{t.filters.private}</option>
                <option value="BOTH">{t.filters.both}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <LoadingSpinner className="py-6" label={t.status.loading} />
          ) : filtered.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">{t.status.empty}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((service) => (
                (() => {
                  const displayName = isDE ? (service.nameDe || service.name) : service.name;
                  const displayDescription = isDE ? (service.descriptionDe || service.description) : service.description;
                  return (
                <div key={service.id} className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                  <div className="h-32 bg-gray-100">
                    {service.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={service.image} alt={displayName} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">{displayName}</div>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-1 rounded-full text-xs font-semibold ${
                          service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {service.isActive ? t.actions.active : t.actions.inactive}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                      <span className="font-semibold">{service.occasion}</span>
                      <button
                        type="button"
                        onClick={() => toggleActive(service)}
                        className="text-amber-700 hover:text-amber-800 font-semibold"
                      >
                        {service.isActive ? t.actions.disable : t.actions.enable}
                      </button>
                    </div>

                    {displayDescription ? (
                      <p className="mt-3 text-sm text-gray-700 overflow-hidden text-ellipsis">
                        {displayDescription}
                      </p>
                    ) : null}

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(service)}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm font-semibold">{t.actions.edit}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => requestRemove(service)}
                        className="px-3 py-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-700 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-semibold">{t.actions.delete}</span>
                      </button>
                    </div>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200">
              <div className="font-bold text-gray-900">
                {form.id ? t.modal.editTitle : t.modal.createTitle}
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label={t.actions.cancel}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
              <div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t.fields.name}</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t.fields.nameDe}</label>
                    <input
                      value={form.nameDe}
                      onChange={(e) => setForm((prev) => ({ ...prev, nameDe: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">{t.fields.occasion}</label>
                  <select
                    value={form.occasion}
                    onChange={(e) => setForm((prev) => ({ ...prev, occasion: e.target.value as ServiceOccasion }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                  >
                    <option value="BUSINESS">{t.filters.business}</option>
                    <option value="PRIVATE">{t.filters.private}</option>
                    <option value="BOTH">{t.filters.both}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">{t.fields.status}</label>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 accent-amber-600"
                    />
                    <span className="text-sm text-gray-800">
                      {form.isActive ? t.actions.active : t.actions.inactive}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t.fields.description}</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t.fields.descriptionDe}</label>
                    <textarea
                      value={form.descriptionDe}
                      onChange={(e) => setForm((prev) => ({ ...prev, descriptionDe: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-[180px_1fr] gap-4 items-start">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-sm font-semibold text-gray-900 mb-2">{t.fields.image}</div>
                  <div className="aspect-[4/3] w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {form.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.image} alt={form.name || t.labels.serviceImageAlt} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t.fields.imageUrl}</label>
                    <input
                      value={form.image}
                      onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                      placeholder={isDE ? 'https://beispiel.de/bild.jpg' : 'https://example.com/image.jpg'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t.fields.upload}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0])}
                      className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold"
                disabled={saving}
              >
                {t.actions.cancel}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !form.name.trim()}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {t.actions.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={isDE ? 'Service löschen' : 'Delete service'}
        description={t.confirmDelete}
        confirmText={t.actions.delete}
        cancelText={t.actions.cancel}
        isDanger
        isLoading={mutating}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmDeleteService(null);
        }}
        onConfirm={async () => {
          if (!confirmDeleteService) return;
          const target = confirmDeleteService;
          setConfirmOpen(false);
          setConfirmDeleteService(null);
          await remove(target);
        }}
      />
    </AdminLayout>
  );
}
