"use client";

import React, { useState, useEffect } from 'react';
import { 
  Menu, Package, Calendar, DollarSign, BarChart3,
  Users, TrendingUp, Clock, Plus, Edit, Archive, Trash2,
  Search, Filter, Save, XCircle, CheckCircle, AlertCircle,
  Utensils, Wine, Coffee, Dessert, Pause, Play, Calendar as CalendarIcon,
  Users as UsersIcon, Settings, AlertTriangle, Check, ShoppingBag, Briefcase
} from 'lucide-react';

import { useTranslation } from '@/lib/hooks/useTranslation';
import AdminLanguageToggle from '../components/AdminLanguageToggle';
import AdminLayout from '../components/AdminLayout';
import { systemApi, SystemStatus, ClosedDate } from '@/lib/api/system';

export default function SystemControl() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('ordering');
  const [isLoading, setIsLoading] = useState(true);
  const { language, toggleLanguage } = useTranslation('admin');
  const locale = language === 'DE' ? 'de-DE' : 'en-US';

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // System state
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [orderingDraft, setOrderingDraft] = useState({
    orderingPaused: false,
    pauseReason: '',
    pauseUntil: ''
  });
  const [isSavingOrdering, setIsSavingOrdering] = useState(false);
  const [orderingMessage, setOrderingMessage] = useState<string | null>(null);

  // Closed dates
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);

  // Capacity settings (draft)
  const [capacitySettings, setCapacitySettings] = useState({
    dailyLimit: 0,
    perHourLimit: 0,
    weekendMultiplier: 1,
    enableAutoPause: true
  });
  const [isSavingCapacity, setIsSavingCapacity] = useState(false);
  const [capacityMessage, setCapacityMessage] = useState<string | null>(null);

  const [newClosedDate, setNewClosedDate] = useState({
    date: '',
    reason: '',
    recurring: false
  });

  const copy = {
    EN: {
      nav: {
        dashboard: 'Dashboard',
        orders: 'Orders',
        menu: 'Menu Management',
        services: 'Services',
        accessories: 'Accessories',
        system: 'System Control',
        customers: 'Customers',
        reports: 'Reports',
      },
      admin: {
        user: 'Admin User',
        role: 'Administrator',
      },
      header: {
        title: 'System Control',
        sectionTitle: 'System Settings',
        subtitle: 'Manage ordering, business hours, and capacity limits',
      },
      tabs: {
        ordering: 'Ordering Control',
        dates: 'Closed Dates',
        capacity: 'Capacity Limits',
      },
      ordering: {
        statusTitle: 'Ordering System Status',
        paused: 'Ordering is currently PAUSED',
        active: 'Ordering is ACTIVE',
        reason: 'Reason',
        resume: 'Resume Ordering',
        pause: 'Pause Ordering',
        pauseSettings: 'Pause Settings',
        pauseReasonLabel: 'Reason for Pause (Optional)',
        resumeOn: 'Resume Ordering On',
        saving: 'Saving...',
        save: 'Save Ordering Settings',
        noticeTitle: 'Important Notice',
        noticeBody:
          "When ordering is paused, customers will see a maintenance message and won't be able to place new orders. Existing orders will remain active and can be fulfilled.",
        pausePlaceholder: 'E.g., Kitchen maintenance, Staff shortage...',
      },
      closedDates: {
        addTitle: 'Add Closed Date',
        date: 'Date',
        reason: 'Reason',
        reasonPlaceholder: 'E.g., Holiday, Private Event...',
        recurring: 'Recurring annually',
        add: 'Add Closed Date',
        upcoming: 'Upcoming Closed Dates',
        recurringBadge: 'Recurring',
        noneUpcoming: 'No upcoming closed dates',
        past: 'Past Closed Dates',
        invalidPast: 'Choose today or a future date',
        duplicate: 'This date is already closed',
      },
      capacity: {
        title: 'Capacity Settings',
        dailyLimit: 'Daily Order Limit',
        dailyHelp: 'Maximum orders per day',
        perHourLimit: 'Per Hour Limit',
        perHourHelp: 'Maximum orders per hour',
        weekendMultiplier: 'Weekend Capacity Multiplier',
        sameWeekday: 'Same as weekdays',
        increase25: '25% increase',
        increase50: '50% increase',
        increase100: '100% increase (double)',
        autoPauseLabel: 'Auto-pause when capacity reached',
        autoPauseHelp: 'Automatically pause ordering when daily limit is reached',
        save: 'Save Capacity Settings',
        saving: 'Saving...',
        currentCapacity: 'Current Capacity',
        todayUsage: "Today's Usage",
        remaining: 'orders remaining today',
        weekendCapacity: 'Weekend Capacity',
        orders: 'orders',
        weekendSame: 'Same as weekdays',
        weekendIncrease: 'increase on weekends',
      },
      messages: {
        capacitySaved: 'Capacity settings saved',
        capacitySaveFailed: 'Failed to save capacity settings',
        orderingSaved: 'Ordering settings saved',
        orderingSaveFailed: 'Failed to save ordering settings',
      },
    },
    DE: {
      nav: {
        dashboard: 'Übersicht',
        orders: 'Bestellungen',
        menu: 'Menüverwaltung',
        services: 'Dienstleistungen',
        accessories: 'Zubehör',
        system: 'Systemsteuerung',
        customers: 'Kunden',
        reports: 'Berichte',
      },
      admin: {
        user: 'Admin Benutzer',
        role: 'Administrator',
      },
      header: {
        title: 'Systemsteuerung',
        sectionTitle: 'Systemeinstellungen',
        subtitle: 'Bestellungen, Öffnungszeiten und Kapazitätsgrenzen verwalten',
      },
      tabs: {
        ordering: 'Bestellsteuerung',
        dates: 'Schließtage',
        capacity: 'Kapazitätsgrenzen',
      },
      ordering: {
        statusTitle: 'Status des Bestellsystems',
        paused: 'Bestellungen sind derzeit PAUSIERT',
        active: 'Bestellungen sind AKTIV',
        reason: 'Grund',
        resume: 'Bestellungen fortsetzen',
        pause: 'Bestellungen pausieren',
        pauseSettings: 'Pause Einstellungen',
        pauseReasonLabel: 'Grund für die Pause (optional)',
        resumeOn: 'Bestellungen fortsetzen am',
        saving: 'Speichert...',
        save: 'Bestelleinstellungen speichern',
        noticeTitle: 'Wichtiger Hinweis',
        noticeBody:
          'Wenn Bestellungen pausiert sind, sehen Kunden eine Wartungsmeldung und können keine neuen Bestellungen aufgeben. Bestehende Bestellungen bleiben aktiv und können erfüllt werden.',
        pausePlaceholder: 'z.B. Küchenwartung, Personalmangel...',
      },
      closedDates: {
        addTitle: 'Schließtag hinzufügen',
        date: 'Datum',
        reason: 'Grund',
        reasonPlaceholder: 'Z.B. Feiertag, Private Veranstaltung...',
        recurring: 'Jährlich wiederkehrend',
        add: 'Schließtag hinzufügen',
        upcoming: 'Bevorstehende Schließtage',
        recurringBadge: 'Wiederkehrend',
        noneUpcoming: 'Keine bevorstehenden Schließtage',
        past: 'Vergangene Schließtage',
        invalidPast: 'Wähle heute oder ein zukünftiges Datum',
        duplicate: 'Dieses Datum ist bereits gesperrt',
      },
      capacity: {
        title: 'Kapazitätseinstellungen',
        dailyLimit: 'Tägliches Bestelllimit',
        dailyHelp: 'Maximale Bestellungen pro Tag',
        perHourLimit: 'Limit pro Stunde',
        perHourHelp: 'Maximale Bestellungen pro Stunde',
        weekendMultiplier: 'Wochenend-Kapazitätsfaktor',
        sameWeekday: 'Wie an Werktagen',
        increase25: '25% Erhöhung',
        increase50: '50% Erhöhung',
        increase100: '100% Erhöhung (doppelt)',
        autoPauseLabel: 'Automatisch pausieren bei Kapazität',
        autoPauseHelp: 'Bestellungen automatisch pausieren, wenn das Tageslimit erreicht ist',
        save: 'Kapazitätseinstellungen speichern',
        saving: 'Speichert...',
        currentCapacity: 'Aktuelle Kapazität',
        todayUsage: 'Heutige Auslastung',
        remaining: 'Bestellungen heute verbleibend',
        weekendCapacity: 'Wochenend-Kapazität',
        orders: 'Bestellungen',
        weekendSame: 'Wie an Werktagen',
        weekendIncrease: 'Erhöhung am Wochenende',
      },
      messages: {
        capacitySaved: 'Kapazitätseinstellungen gespeichert',
        capacitySaveFailed: 'Kapazitätseinstellungen konnten nicht gespeichert werden',
        orderingSaved: 'Bestelleinstellungen gespeichert',
        orderingSaveFailed: 'Bestelleinstellungen konnten nicht gespeichert werden',
      },
    },
  } as const;
  const t = copy[language] ?? copy.EN;

  const navigation = [
    { id: 'dashboard', name: t.nav.dashboard, icon: TrendingUp, path: '/dashboard' },
    { id: 'orders', name: t.nav.orders, icon: Package, path: '/orders' },
    { id: 'menu', name: t.nav.menu, icon: Menu, path: '/menu_management' },
    { id: 'services', name: t.nav.services, icon: Briefcase, path: '/services_management' },
    { id: 'accessories', name: t.nav.accessories, icon: ShoppingBag, path: '/accessories' },
    { id: 'system', name: t.nav.system, icon: Clock, path: '/system_control' },
    { id: 'customers', name: t.nav.customers, icon: Users, path: '/customers' },
    { id: 'reports', name: t.nav.reports, icon: BarChart3, path: '/reports' }
  ];
  const status = systemStatus
    ? {
        ...systemStatus,
        pauseReason: systemStatus.pauseReason ?? '',
        pauseUntil: systemStatus.pauseUntil ?? ''
      }
    : {
        id: 0,
        orderingPaused: orderingDraft.orderingPaused,
        pauseReason: orderingDraft.pauseReason,
        pauseUntil: orderingDraft.pauseUntil,
        capacityLimit: 0,
        currentReservations: 0,
        dailyLimit: capacitySettings.dailyLimit,
        perHourLimit: capacitySettings.perHourLimit,
        weekendMultiplier: capacitySettings.weekendMultiplier,
        enableAutoPause: capacitySettings.enableAutoPause
      };

  useEffect(() => {
    const loadSystem = async () => {
      try {
        setIsLoading(true);
        const [status, dates] = await Promise.all([
          systemApi.getSystemStatus(),
          systemApi.getClosedDates()
        ]);
        setSystemStatus(status);
        setOrderingDraft({
          orderingPaused: status.orderingPaused,
          pauseReason: status.pauseReason ?? '',
          pauseUntil: status.pauseUntil ?? ''
        });
        setCapacitySettings({
          dailyLimit: status.dailyLimit,
          perHourLimit: status.perHourLimit,
          weekendMultiplier: status.weekendMultiplier,
          enableAutoPause: status.enableAutoPause
        });
        setClosedDates(dates);
      } catch (err) {
        console.error('Failed to load system status', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSystem();
  }, []);

  const toggleOrdering = async () => {
    if (!systemStatus) return;
    const nextStatus = {
      orderingPaused: !orderingDraft.orderingPaused,
      pauseReason: orderingDraft.pauseReason,
      pauseUntil: orderingDraft.pauseUntil || undefined
    };
    try {
      const updated = await systemApi.updateSystemStatus(nextStatus);
      setSystemStatus(updated);
      setOrderingDraft({
        orderingPaused: updated.orderingPaused,
        pauseReason: updated.pauseReason ?? '',
        pauseUntil: updated.pauseUntil ?? ''
      });
    } catch (err) {
      console.error('Failed to update ordering status', err);
    }
  };

  const addClosedDate = async () => {
    if (!newClosedDate.date || !newClosedDate.reason) return;
    if (!isClosedDateValid) return;
    try {
      const created = await systemApi.createClosedDate(newClosedDate);
      setClosedDates(prev => [...prev, created]);
      setNewClosedDate({ date: '', reason: '', recurring: false });
    } catch (err) {
      console.error('Failed to add closed date', err);
    }
  };

  const removeClosedDate = async (id: number) => {
    try {
      await systemApi.deleteClosedDate(id);
      setClosedDates(closedDates.filter(date => date.id !== id));
    } catch (err) {
      console.error('Failed to remove closed date', err);
    }
  };

  const updateCapacitySettings = async (updates: Partial<SystemStatus>) => {
    setCapacitySettings(prev => ({ ...prev, ...updates }));
  };

  const saveCapacitySettings = async () => {
    setIsSavingCapacity(true);
    setCapacityMessage(null);
    try {
      const updated = await systemApi.updateSystemStatus({
        dailyLimit: capacitySettings.dailyLimit,
        perHourLimit: capacitySettings.perHourLimit,
        weekendMultiplier: capacitySettings.weekendMultiplier,
        enableAutoPause: capacitySettings.enableAutoPause
      });
      setSystemStatus(updated);
      setCapacitySettings({
        dailyLimit: updated.dailyLimit,
        perHourLimit: updated.perHourLimit,
        weekendMultiplier: updated.weekendMultiplier,
        enableAutoPause: updated.enableAutoPause
      });
      setCapacityMessage(t.messages.capacitySaved);
    } catch (err) {
      console.error('Failed to save capacity settings', err);
      setCapacityMessage(t.messages.capacitySaveFailed);
    } finally {
      setIsSavingCapacity(false);
    }
  };

  const saveOrderingSettings = async () => {
    setIsSavingOrdering(true);
    setOrderingMessage(null);
    try {
      const updated = await systemApi.updateSystemStatus({
        orderingPaused: orderingDraft.orderingPaused,
        pauseReason: orderingDraft.pauseReason,
        pauseUntil: orderingDraft.pauseUntil || undefined
      });
      setSystemStatus(updated);
      setOrderingDraft({
        orderingPaused: updated.orderingPaused,
        pauseReason: updated.pauseReason ?? '',
        pauseUntil: updated.pauseUntil ?? ''
      });
      setOrderingMessage(t.messages.orderingSaved);
    } catch (err) {
      console.error('Failed to save ordering settings', err);
      setOrderingMessage(t.messages.orderingSaveFailed);
    } finally {
      setIsSavingOrdering(false);
    }
  };

  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateValue = (dateString: string) => {
    if (!dateString) return null;
    const [yearStr, monthStr, dayStr] = dateString.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number((dayStr || '').slice(0, 2));
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const normalizeDateValue = (dateString: string) => {
    const parsed = parseDateValue(dateString);
    return parsed ? toDateInputValue(parsed) : '';
  };

  const isDateInPast = (dateString: string) => {
    const date = parseDateValue(dateString);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  };

  const todayDateValue = toDateInputValue(new Date());
  const normalizedNewClosedDate = normalizeDateValue(newClosedDate.date);
  const isClosedDateDuplicate = !!normalizedNewClosedDate && closedDates.some((date) => (
    normalizeDateValue(date.date) === normalizedNewClosedDate
  ));
  const isClosedDateInPast = !!newClosedDate.date && isDateInPast(newClosedDate.date);
  const closedDateError = newClosedDate.date
    ? (isClosedDateInPast
        ? t.closedDates.invalidPast
        : isClosedDateDuplicate
          ? t.closedDates.duplicate
          : '')
    : '';
  const isClosedDateValid = !!newClosedDate.date && !isClosedDateInPast && !isClosedDateDuplicate;

  const upcomingClosedDates = closedDates.filter(date => !isDateInPast(date.date));
  const pastClosedDates = closedDates.filter(date => isDateInPast(date.date));

  return (
    <AdminLayout
      navigation={navigation}
      title={t.header.title}
      adminUserLabel={t.admin.user}
      adminRoleLabel={t.admin.role}
      languageToggle={<AdminLanguageToggle language={language} onToggle={toggleLanguage} />}
      locale={locale}
      openMenuLabel={language === 'DE' ? 'Menü öffnen' : 'Open menu'}
      closeMenuLabel={language === 'DE' ? 'Menü schließen' : 'Close menu'}
    >
      <style jsx global>{`
        .calendar-input {
          color-scheme: light;
          background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
        }

        .calendar-input::-webkit-calendar-picker-indicator {
          filter: invert(55%) sepia(47%) saturate(430%) hue-rotate(2deg) brightness(96%) contrast(90%);
          opacity: 0.85;
        }
      `}</style>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 font-elegant">{t.header.sectionTitle}</h2>
        <p className="text-gray-600">{t.header.subtitle}</p>
      </div>

          {/* Control Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 backdrop-blur-sm mb-6">
            <div className="flex border-b border-gray-100 overflow-x-auto whitespace-nowrap">
              <button
                onClick={() => setActiveTab('ordering')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'ordering'
                    ? 'text-amber-700 border-b-2 border-amber-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.tabs.ordering}
              </button>
              <button
                onClick={() => setActiveTab('dates')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'dates'
                    ? 'text-amber-700 border-b-2 border-amber-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.tabs.dates}
              </button>
              <button
                onClick={() => setActiveTab('capacity')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'capacity'
                    ? 'text-amber-700 border-b-2 border-amber-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.tabs.capacity}
              </button>
            </div>

            <div className="p-6">
              {/* Ordering Control Tab */}
              {activeTab === 'ordering' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t.ordering.statusTitle}
                      </h3>
                      <p className={`text-sm ${
                        status.orderingPaused ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {status.orderingPaused ? t.ordering.paused : t.ordering.active}
                      </p>
                      {orderingDraft.pauseReason && (
                        <p className="text-sm text-gray-600 mt-1">{t.ordering.reason}: {orderingDraft.pauseReason}</p>
                      )}
                    </div>
                    <button
                      onClick={toggleOrdering}
                      className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                        status.orderingPaused
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {status.orderingPaused ? <Play size={20} /> : <Pause size={20} />}
                      {status.orderingPaused ? t.ordering.resume : t.ordering.pause}
                    </button>
                  </div>

                  {status.orderingPaused && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">{t.ordering.pauseSettings}</h4>
                      <div className="grid gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.ordering.pauseReasonLabel}
                          </label>
                          <input
                            type="text"
                            value={orderingDraft.pauseReason}
                            onChange={(e) =>
                              setOrderingDraft(prev => ({ ...prev, pauseReason: e.target.value }))
                            }
                            placeholder={t.ordering.pausePlaceholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.ordering.resumeOn}
                          </label>
                          <input
                            type="date"
                            value={orderingDraft.pauseUntil}
                            onChange={(e) =>
                              setOrderingDraft(prev => ({ ...prev, pauseUntil: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <div className="flex items-center gap-3">
                          {orderingMessage && (
                            <span className="text-sm text-gray-700">{orderingMessage}</span>
                          )}
                          <button
                            onClick={saveOrderingSettings}
                            disabled={isSavingOrdering}
                            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Save size={18} />
                            {isSavingOrdering ? t.ordering.saving : t.ordering.save}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-2">{t.ordering.noticeTitle}</h4>
                        <p className="text-amber-800 text-sm">
                          {t.ordering.noticeBody}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Closed Dates Tab */}
              {activeTab === 'dates' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.closedDates.addTitle}</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.closedDates.date}</label>
                        <input
                          type="date"
                          value={newClosedDate.date}
                          onChange={(e) => setNewClosedDate(prev => ({ ...prev, date: e.target.value }))}
                          min={todayDateValue}
                          className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-amber-900 bg-amber-50 calendar-input"
                        />
                        {closedDateError && (
                          <p className="text-sm text-red-600 mt-2">{closedDateError}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.closedDates.reason}</label>
                        <input
                          type="text"
                          value={newClosedDate.reason}
                          onChange={(e) => setNewClosedDate(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder={t.closedDates.reasonPlaceholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-gray-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newClosedDate.recurring}
                          onChange={(e) => setNewClosedDate(prev => ({ ...prev, recurring: e.target.checked }))}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">{t.closedDates.recurring}</span>
                      </label>
                      <button
                        onClick={addClosedDate}
                        disabled={!newClosedDate.reason || !isClosedDateValid}
                        className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} />
                        {t.closedDates.add}
                      </button>
                    </div>
                  </div>

                  {/* Upcoming Closed Dates */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.closedDates.upcoming}</h3>
                    <div className="space-y-3">
                      {upcomingClosedDates.map((date) => (
                        <div key={date.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-4">
                            <CalendarIcon className="text-gray-400" size={20} />
                            <div>
                              <p className="font-medium text-gray-900">
                                {new Date(date.date).toLocaleDateString(locale, { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-sm text-gray-600">{date.reason}</p>
                            </div>
                            {date.recurring && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {t.closedDates.recurringBadge}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeClosedDate(date.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {upcomingClosedDates.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                          <p>{t.closedDates.noneUpcoming}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Past Closed Dates */}
                  {pastClosedDates.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.closedDates.past}</h3>
                      <div className="space-y-3">
                        {pastClosedDates.map((date) => (
                          <div key={date.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-60">
                            <div className="flex items-center gap-4">
                              <CalendarIcon className="text-gray-400" size={20} />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {new Date(date.date).toLocaleDateString(locale)}
                                </p>
                                <p className="text-sm text-gray-600">{date.reason}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeClosedDate(date.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Capacity Limits Tab */}
              {activeTab === 'capacity' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">{t.capacity.title}</h3>
                    
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t.capacity.dailyLimit}
                        </label>
                        <input
                          type="number"
                          value={capacitySettings.dailyLimit}
                          onChange={(e) => updateCapacitySettings({ dailyLimit: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        />
                        <p className="text-sm text-gray-600 mt-1">{t.capacity.dailyHelp}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t.capacity.perHourLimit}
                        </label>
                        <input
                          type="number"
                          value={capacitySettings.perHourLimit}
                          min={0}
                          onChange={(e) => updateCapacitySettings({ perHourLimit: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        />
                        <p className="text-sm text-gray-600 mt-1">{t.capacity.perHourHelp}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.capacity.weekendMultiplier}
                      </label>
                      <select
                        value={capacitySettings.weekendMultiplier}
                        onChange={(e) => updateCapacitySettings({ weekendMultiplier: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                      >
                        <option value="1">{t.capacity.sameWeekday}</option>
                        <option value="1.25">{t.capacity.increase25}</option>
                        <option value="1.5">{t.capacity.increase50}</option>
                        <option value="2">{t.capacity.increase100}</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={capacitySettings.enableAutoPause}
                        onChange={(e) => updateCapacitySettings({ enableAutoPause: e.target.checked })}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">{t.capacity.autoPauseLabel}</span>
                        <p className="text-sm text-gray-600">
                          {t.capacity.autoPauseHelp}
                        </p>
                      </div>
                    </label>

                    <div className="flex justify-end mt-6">
                      <div className="flex items-center gap-3">
                        {capacityMessage && (
                          <span className="text-sm text-gray-700">{capacityMessage}</span>
                        )}
                        <button
                          onClick={saveCapacitySettings}
                          disabled={isSavingCapacity}
                          className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save size={18} />
                          {isSavingCapacity ? t.capacity.saving : t.capacity.save}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Overview */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <UsersIcon className="text-amber-600" size={24} />
                        <h4 className="font-semibold text-amber-900">{t.capacity.currentCapacity}</h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-amber-800">{t.capacity.todayUsage}</span>
                            <span className="font-medium text-amber-900">
                              {status.currentReservations} / {capacitySettings.dailyLimit}
                            </span>
                          </div>
                          <div className="w-full bg-amber-200 rounded-full h-2">
                            <div 
                              className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(status.currentReservations / capacitySettings.dailyLimit) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        <p className="text-sm text-amber-700">
                          {capacitySettings.dailyLimit - status.currentReservations} {t.capacity.remaining}
                        </p>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Check className="text-green-600" size={24} />
                        <h4 className="font-semibold text-green-900">{t.capacity.weekendCapacity}</h4>
                      </div>
                      <p className="text-lg font-bold text-green-900 mb-2">
                        {Math.floor(capacitySettings.dailyLimit * capacitySettings.weekendMultiplier)} {t.capacity.orders}
                      </p>
                      <p className="text-sm text-green-700">
                        {capacitySettings.weekendMultiplier === 1
                          ? t.capacity.weekendSame
                          : `${((capacitySettings.weekendMultiplier - 1) * 100)}% ${t.capacity.weekendIncrease}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
    </AdminLayout>
  );
}
