"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  Package,
  Menu,
  Briefcase,
  Clock,
  Users,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Tags
} from 'lucide-react';

import { useTranslation } from '@/lib/hooks/useTranslation';
import AdminLanguageToggle from '../components/AdminLanguageToggle';
import AdminLayout from '../components/AdminLayout';
import { reportsApi, type CustomerAnalytics, type PopularItem, type RevenueReport } from '@/lib/api/reports';

export default function AdminReports() {
  const { language, toggleLanguage } = useTranslation('admin');
  const locale = language === 'DE' ? 'de-DE' : 'en-US';
  const isDE = language === 'DE';

  const t = useMemo(() => {
    return {
      title: isDE ? 'Berichte' : 'Reports',
      subtitle: isDE ? 'Umsatz, Bestellungen und Top-Produkte' : 'Revenue, orders, and top products',
      refresh: isDE ? 'Aktualisieren' : 'Refresh',
      loading: isDE ? 'Lade Berichtsdaten…' : 'Loading report data…',
      error: isDE ? 'Berichtsdaten konnten nicht geladen werden.' : 'Unable to load reports right now.',
      cards: {
        totalRevenue: isDE ? 'Gesamtumsatz' : 'Total Revenue',
        totalOrders: isDE ? 'Bestellungen gesamt' : 'Total Orders',
        avgOrder: isDE ? 'Ø Bestellwert' : 'Avg Order Value',
        returning: isDE ? 'Wiederkehrend' : 'Returning Customers',
        newCustomers: isDE ? 'Neu' : 'New Customers',
        retention: isDE ? 'Bindung' : 'Retention',
        avgCustomer: isDE ? 'Ø Kundenwert' : 'Avg Customer Value'
      },
      sections: {
        daily: isDE ? 'Täglicher Umsatz' : 'Daily Revenue',
        popular: isDE ? 'Top Produkte' : 'Top Products',
        byCategory: isDE ? 'Umsatz nach Kategorie' : 'Revenue by Category'
      }
    };
  }, [isDE]);

  const navigation = useMemo(() => {
    return [
      { id: 'dashboard', name: isDE ? 'Übersicht' : 'Dashboard', icon: TrendingUp, path: '/dashboard' },
      { id: 'orders', name: isDE ? 'Bestellungen' : 'Orders', icon: Package, path: '/orders' },
      { id: 'menu', name: isDE ? 'Menüverwaltung' : 'Menu Management', icon: Menu, path: '/menu_management' },
      { id: 'services', name: isDE ? 'Services' : 'Services', icon: Briefcase, path: '/services_management' },
      { id: 'accessories', name: isDE ? 'Zubehör' : 'Accessories', icon: ShoppingBag, path: '/accessories' },
      { id: 'system', name: isDE ? 'Systemsteuerung' : 'System Control', icon: Clock, path: '/system_control' },
      { id: 'customers', name: isDE ? 'Kunden' : 'Customers', icon: Users, path: '/customers' },
      { id: 'reports', name: isDE ? 'Berichte' : 'Reports', icon: BarChart3, path: '/reports' }
    ];
  }, [isDE]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [customers, setCustomers] = useState<CustomerAnalytics | null>(null);

  const formatMoney = (value?: number) =>
    typeof value === 'number'
      ? value.toLocaleString(locale, { style: 'currency', currency: 'EUR' })
      : '--';

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const [revenueReport, popular, customerStats] = await Promise.all([
        reportsApi.getRevenueReport(),
        reportsApi.getPopularItems(),
        reportsApi.getCustomerAnalytics()
      ]);
      setRevenue(revenueReport);
      setPopularItems(popular);
      setCustomers(customerStats);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const topDaily = (revenue?.dailyRevenue || []).slice(-14);
  const topCategories = (revenue?.byCategory || []).slice(0, 6);
  const topPopular = (popularItems || []).slice(0, 10);

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
        <button
          onClick={loadReports}
          className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          type="button"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">{t.refresh}</span>
        </button>
      }
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 font-elegant">{t.subtitle}</h2>
        <p className="text-gray-600 text-sm">
          {isDE
            ? 'Diese Seite nutzt die Backend-Endpoints /api/reports/*.'
            : 'This page uses the backend endpoints /api/reports/*.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          {t.loading}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.cards.totalRevenue}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatMoney(revenue?.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <DollarSign className="text-amber-700" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.cards.totalOrders}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {typeof revenue?.totalOrders === 'number' ? revenue.totalOrders.toLocaleString(locale) : '--'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="text-blue-700" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.cards.avgOrder}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatMoney(revenue?.averageOrderValue)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-purple-700" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Customer analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <p className="text-sm font-medium text-gray-600">{t.cards.returning}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {typeof customers?.returningCustomers === 'number'
              ? customers.returningCustomers.toLocaleString(locale)
              : '--'}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <p className="text-sm font-medium text-gray-600">{t.cards.newCustomers}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {typeof customers?.newCustomers === 'number' ? customers.newCustomers.toLocaleString(locale) : '--'}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <p className="text-sm font-medium text-gray-600">{t.cards.retention}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {typeof customers?.retentionRate === 'number' ? `${customers.retentionRate.toFixed(1)}%` : '--'}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <p className="text-sm font-medium text-gray-600">{t.cards.avgCustomer}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatMoney(customers?.avgCustomerValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily revenue */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 font-elegant">{t.sections.daily}</h3>
            <TrendingUp className="text-gray-400" size={18} />
          </div>
          {topDaily.length === 0 ? (
            <p className="text-sm text-gray-500">--</p>
          ) : (
            <div className="space-y-2">
              {topDaily.map((d) => (
                <div key={d.date} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{new Date(d.date).toLocaleDateString(locale)}</span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(d.revenue)} <span className="text-gray-500 font-normal">({d.orders})</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular items */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 font-elegant">{t.sections.popular}</h3>
            <Tags className="text-gray-400" size={18} />
          </div>
          {topPopular.length === 0 ? (
            <p className="text-sm text-gray-500">--</p>
          ) : (
            <div className="space-y-3">
              {topPopular.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.category} • {item.orders} {isDE ? 'Stk' : 'qty'}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{formatMoney(item.revenue)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* By category */}
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 font-elegant">{t.sections.byCategory}</h3>
          <DollarSign className="text-gray-400" size={18} />
        </div>
        {topCategories.length === 0 ? (
          <p className="text-sm text-gray-500">--</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topCategories.map((c) => (
              <div key={c.category} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{c.category}</p>
                  <p className="text-sm font-bold text-gray-900">{formatMoney(c.revenue)}</p>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {c.percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
