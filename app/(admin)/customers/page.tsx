"use client";

import React, { useState, useEffect } from 'react';
import {
  Menu, X, ChevronRight, Package, Calendar, DollarSign,
  Users, TrendingUp, Clock, Plus, Edit, Archive, Trash2,
  Search, Filter, Save, XCircle, CheckCircle, AlertCircle,
  Utensils, Wine, Coffee, Dessert, Mail, Phone, MapPin,
  Star, Crown, Eye, MessageCircle,
  User, // Added User icon
  ShoppingBag,
  BarChart3,
  Briefcase
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/hooks/useTranslation';
import AdminLanguageToggle from '../components/AdminLanguageToggle';
import AdminLayout from '../components/AdminLayout';
import { customersApi, CustomerSummary } from '@/lib/api/customers';
import { ordersApi, Order } from '@/lib/api/orders';
import { useBodyScrollLock } from '../components/useBodyScrollLock';

type Customer = CustomerSummary & {
  avatar?: string;
  preferences?: string[] | null;
  allergies?: string[] | null;
  notes?: string | null;
  status?: string | null;
  tier?: string | null;
  location?: string | null;
};

export default function Customers() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useBodyScrollLock(Boolean(selectedCustomer));

  const router = useRouter();
  const { language, toggleLanguage } = useTranslation('admin');
  const locale = language === 'DE' ? 'de-DE' : 'en-US';

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
        title: 'Customer Management',
        sectionTitle: 'Customers',
        subtitle: 'Manage customer profiles and view order history',
      },
      tabs: {
        list: 'Customer List',
        history: 'Order History',
      },
      filters: {
        searchPlaceholder: 'Search customers...',
        allStatus: 'All Status',
        active: 'Active',
        inactive: 'Inactive',
        found: 'customers found',
      },
      tiers: {
        regular: 'Regular',
        premium: 'Premium',
        vip: 'VIP',
        unassigned: 'Unassigned',
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
        completed: 'Completed',
        pending: 'Pending',
      },
      labels: {
        orders: 'Orders',
        total: 'Total',
        lastOrder: 'Last Order',
        view: 'View',
        contact: 'Contact',
        noCustomers: 'No customers found matching your criteria',
        recentOrders: 'Recent Orders',
        orderNumber: 'Order',
        orderTypeFallback: 'Order',
        noItems: 'No items',
        noOrders: 'No orders found',
        viewProfile: 'View Profile',
        customerAvatar: 'Customer avatar',
      },
      modal: {
        contactInfo: 'Contact Information',
        memberSince: 'Member since',
        totalSpent: 'total spent',
        preferencesNotes: 'Preferences & Notes',
        dietaryPreferences: 'Dietary Preferences',
        allergies: 'Allergies',
        additionalNotes: 'Additional Notes',
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
        title: 'Kundenverwaltung',
        sectionTitle: 'Kunden',
        subtitle: 'Kundenprofile verwalten und Bestellhistorie ansehen',
      },
      tabs: {
        list: 'Kundenliste',
        history: 'Bestellhistorie',
      },
      filters: {
        searchPlaceholder: 'Kunden suchen...',
        allStatus: 'Alle Status',
        active: 'Aktiv',
        inactive: 'Inaktiv',
        found: 'Kunden gefunden',
      },
      tiers: {
        regular: 'Standard',
        premium: 'Premium',
        vip: 'VIP',
        unassigned: 'Nicht zugeordnet',
      },
      status: {
        active: 'Aktiv',
        inactive: 'Inaktiv',
        completed: 'Abgeschlossen',
        pending: 'Ausstehend',
      },
      labels: {
        orders: 'Bestellungen',
        total: 'Gesamt',
        lastOrder: 'Letzte Bestellung',
        view: 'Ansehen',
        contact: 'Kontakt',
        noCustomers: 'Keine Kunden gefunden, die den Kriterien entsprechen',
        recentOrders: 'Letzte Bestellungen',
        orderNumber: 'Bestellung',
        orderTypeFallback: 'Bestellung',
        noItems: 'Keine Artikel',
        noOrders: 'Keine Bestellungen gefunden',
        viewProfile: 'Profil ansehen',
        customerAvatar: 'Kundenavatar',
      },
      modal: {
        contactInfo: 'Kontaktinformationen',
        memberSince: 'Mitglied seit',
        totalSpent: 'Gesamtumsatz',
        preferencesNotes: 'Präferenzen & Notizen',
        dietaryPreferences: 'Ernährungspräferenzen',
        allergies: 'Allergien',
        additionalNotes: 'Zusätzliche Notizen',
      },
    },
  } as const;
  const t = copy[language] ?? copy.EN;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [customerData, orderData] = await Promise.all([
          customersApi.getCustomers(),
          ordersApi.getOrders()
        ]);
        setCustomers(
          customerData.map((c) => ({
            ...c,
            avatar: (c as any).avatar ?? undefined
          }))
        );
        setOrders(orderData);
      } catch (err) {
        console.error('Failed to load customers or orders', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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

  const fallbackAvatar =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  const getAvatarSrc = (avatar?: string): string => avatar ?? fallbackAvatar;

  const tiers: Record<'regular' | 'premium' | 'vip', { label: string; color: string }> = {
    regular: { label: t.tiers.regular, color: 'text-gray-600 bg-gray-100' },
    premium: { label: t.tiers.premium, color: 'text-amber-700 bg-amber-100' },
    vip: { label: t.tiers.vip, color: 'text-purple-700 bg-purple-100' }
  };

  const getTierMeta = (tier?: string | null) => {
    if (!tier) return { label: t.tiers.unassigned, color: 'text-gray-500 bg-gray-100' };
    const key = tier.toLowerCase() as keyof typeof tiers;
    return tiers[key] ?? { label: tier, color: 'text-gray-500 bg-gray-100' };
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCustomerOrders = (customerId: number) => {
    return orders.filter(order => {
      const oid = (order as any).customerId ?? order.userId;
      return oid === customerId;
    });
  };

  const getTierIcon = (tier: string = '') => {
    const normalized = tier.toLowerCase();
    switch (normalized) {
      case 'vip':
        return <Crown size={16} />;
      case 'premium':
        return <Star size={16} />;
      default:
        return null;
    }
  };

  const CustomerDetailModal = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar Image */}
              <div className="relative">
                <img 
                  src={getAvatarSrc(customer.avatar)} 
                  alt={customer.name || t.labels.customerAvatar}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackAvatar;
                  }}
                />
                {/* Tier Badge */}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${
                  customer.tier === 'vip' ? 'bg-purple-500' :
                  customer.tier === 'premium' ? 'bg-amber-500' :
                  'bg-gray-500'
                }`}>
                  {customer.tier === 'vip' ? (
                    <Crown size={10} className="text-white" />
                  ) : customer.tier === 'premium' ? (
                    <Star size={10} className="text-white" />
                  ) : null}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-elegant">{customer.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierMeta(customer.tier).color} flex items-center gap-1`}>
                    {getTierIcon(customer.tier)}
                    {getTierMeta(customer.tier).label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    customer.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {t.status[customer.status as keyof typeof t.status] ?? customer.status}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Customer Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.modal.contactInfo}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail size={16} className="text-gray-600" />
                    <span className="text-gray-900">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone size={16} className="text-gray-600" />
                    <span className="text-gray-900">{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin size={16} className="text-gray-600" />
                    <span className="text-gray-900">{customer.location}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar size={16} className="text-gray-600" />
                    <div>
                      <span className="text-gray-900">{t.modal.memberSince} {new Date(customer.joinDate).toLocaleDateString(locale)}</span>
                      <p className="text-xs text-gray-600 mt-1">{customer.totalOrders} {t.labels.orders} ?? ?'?{customer.totalSpent} {t.modal.totalSpent}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.modal.preferencesNotes}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">{t.modal.dietaryPreferences}</p>
                    <div className="flex flex-wrap gap-1">
                      {customer.preferences.map((pref, index) => (
                        <span key={index} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                  {customer.allergies.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{t.modal.allergies}</p>
                      <div className="flex flex-wrap gap-1">
                        {customer.allergies.map((allergy, index) => (
                          <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {customer.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{t.modal.additionalNotes}</p>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">{customer.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order History */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.labels.recentOrders}</h3>
              <div className="space-y-3">
                {getCustomerOrders(customer.id).map((order) => (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                    <p className="font-medium text-gray-900">{t.labels.orderNumber} #{order.id}</p>
                    <p className="text-sm text-gray-600">
                      {order.createdAt || order.eventDate
                        ? new Date(order.createdAt || order.eventDate).toLocaleDateString(locale)
                        : '—'}
                    </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {t.status[order.status as keyof typeof t.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {order.items?.map(item => item.name).join(', ') || t.labels.noItems}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">
                        {order.serviceType || order.eventType || order.status || t.labels.orderNumber.toLowerCase()}
                      </span>
                      <span className="font-semibold text-gray-900">€{order.total}</span>
                    </div>
                  </div>
                ))}
                {getCustomerOrders(customer.id).length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <Package size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">{t.labels.noOrders}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-elegant">{t.header.sectionTitle}</h2>
              <p className="text-gray-600">{t.header.subtitle}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 backdrop-blur-sm mb-6">
            <div className="flex border-b border-gray-100 overflow-x-auto whitespace-nowrap">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'text-amber-700 border-b-2 border-amber-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.tabs.list}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'text-amber-700 border-b-2 border-amber-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.tabs.history}
              </button>
            </div>

            <div className="p-6">
              {/* Customer List Tab */}
              {activeTab === 'list' && (
                <div className="space-y-6">
                  {/* Filters and Search */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder={t.filters.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                    >
                      <option value="all">{t.filters.allStatus}</option>
                      <option value="active">{t.filters.active}</option>
                      <option value="inactive">{t.filters.inactive}</option>
                    </select>

                    <div className="text-sm text-gray-600 flex items-center justify-center">
                      {filteredCustomers.length} {t.filters.found}
                    </div>
                  </div>

                  {/* Customers Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`bg-white rounded-2xl shadow-sm border border-stone-100 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-md ${
                          isVisible ? 'animate-fade-in-up' : 'opacity-0'
                        }`}
                      >
                        <div className="p-6">
                          {/* Customer Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img 
                                  src={getAvatarSrc(customer.avatar)} 
                                  alt={customer.name || t.labels.customerAvatar}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-200"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = fallbackAvatar;
                                  }}
                                />
                                {/* Tier Badge */}
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white ${
                                  customer.tier === 'vip' ? 'bg-purple-500' :
                                  customer.tier === 'premium' ? 'bg-amber-500' :
                                  'bg-gray-500'
                                }`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierMeta(customer.tier).color} flex items-center gap-1`}>
                                    {getTierIcon(customer.tier)}
                                    {getTierMeta(customer.tier).label}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    customer.status === 'active' 
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {t.status[customer.status as keyof typeof t.status] ?? customer.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedCustomer(customer)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                          </div>

                          {/* Customer Details */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail size={14} />
                              <span className="truncate">{customer.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} />
                              <span>{customer.phone}</span>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                              <div className="text-center">
                                <p className="text-lg font-bold text-gray-900">{customer.totalOrders}</p>
                                <p className="text-xs text-gray-600">{t.labels.orders}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-gray-900">€{customer.totalSpent}</p>
                                <p className="text-xs text-gray-600">{t.labels.total}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold text-gray-900">
                                  {customer.lastOrder
                                    ? new Date(customer.lastOrder).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
                                    : '—'}
                                </p>
                                <p className="text-xs text-gray-600">{t.labels.lastOrder}</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100">
                            <button
                              onClick={() => setSelectedCustomer(customer)}
                              className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                            >
                              <Eye size={14} />
                              {t.labels.view}
                            </button>
                            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-1">
                              <MessageCircle size={14} />
                              {t.labels.contact}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredCustomers.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl">
                      <Users size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg">{t.labels.noCustomers}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Order History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.labels.recentOrders}</h3>
                  <div className="space-y-3">
                    {orders.map((order) => {
                      const customerId = 'customerId' in (order as any)
                        ? (order as any).customerId
                        : order.userId;
                      const customer = customers.find(c => c.id === customerId);
                      return (
                        <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <img 
                                  src={getAvatarSrc(customer?.avatar)} 
                                  alt={customer?.name || t.labels.customerAvatar}
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = fallbackAvatar;
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{customer?.name}</p>
                                <p className="text-sm text-gray-600">{t.labels.orderNumber} #{order.id}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">€{order.total}</p>
                              <p className="text-sm text-gray-600">
                                {order.createdAt || order.eventDate
                                  ? new Date(order.createdAt || order.eventDate).toLocaleDateString(locale)
                                  : '—'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-700 mb-1">
                                {order.items?.map(item => item.name).join(', ') || t.labels.noItems}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  order.status === 'completed' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {t.status[order.status as keyof typeof t.status] ?? order.status}
                                </span>
                                <span className="text-xs text-gray-600 capitalize">
                                  {order.serviceType || order.eventType || order.status || t.labels.orderTypeFallback}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => customer && setSelectedCustomer(customer)}
                              className="px-3 py-1 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm font-medium"
                            >
                              {t.labels.viewProfile}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

      {/* Modals */}
      {selectedCustomer && (
        <CustomerDetailModal 
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </AdminLayout>
  );
}
