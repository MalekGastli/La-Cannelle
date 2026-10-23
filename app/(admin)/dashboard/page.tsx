"use client";

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/hooks/useTranslation';
import AdminLanguageToggle from '../components/AdminLanguageToggle';
import AdminLayout from '../components/AdminLayout';

import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Package, Calendar, DollarSign, 
  Users, TrendingUp, Clock, CheckCircle, AlertCircle,
  Plus, MoreVertical, Edit, Archive,
  Settings,
  LayoutGrid,
  Tag,
  Award,
  CreditCard,
  Mail,
  FileText,
  Calculator,
  User,
  Building,
  Bell,
  Zap,
  LogOut,
  BarChart3,
  ShoppingBag,
  Briefcase,
  ListChecks,
  Trash2
} from 'lucide-react';
import { dashboardApi, DashboardStats } from '@/lib/api/dashboard';
import { todosApi, Todo } from '@/lib/api/todos';

export default function AdminDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
        title: 'Dashboard',
      },
      stats: {
        totalOrders: 'Total Orders',
        pending: 'Pending',
        confirmed: 'Confirmed',
        completed: 'Completed',
        todayRevenue: "Today's Revenue",
        weeklyRevenue: 'Weekly Revenue',
        monthlyRevenue: 'Monthly Revenue',
        growthLabel: 'from yesterday',
      },
      sections: {
        todos: 'Todo list',
        recentOrders: 'Recent Orders',
      },
      labels: {
        guests: 'guests',
        viewAllOrders: 'View All Orders',
        addTodoPlaceholder: 'Add a todo...',
        addTodo: 'Add',
        emptyTodos: 'No todos yet.',
        deleteTodo: 'Delete todo',
        emptyRecentOrders: 'No recent orders yet.',
      },
      messages: {
        loading: 'Loading dashboard data...',
        noData: 'No dashboard data available yet.',
      },
      status: {
        confirmed: 'Confirmed',
        pending: 'Pending',
        completed: 'Completed',
        cancelled: 'Cancelled',
        preparation: 'In Preparation',
        delivery: 'Out for Delivery',
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
        title: 'Übersicht',
      },
      stats: {
        totalOrders: 'Gesamtbestellungen',
        pending: 'Ausstehend',
        confirmed: 'Bestätigt',
        completed: 'Abgeschlossen',
        todayRevenue: 'Heutiger Umsatz',
        weeklyRevenue: 'Wochenumsatz',
        monthlyRevenue: 'Monatsumsatz',
        growthLabel: 'seit gestern',
      },
      sections: {
        todos: 'To-do Liste',
        recentOrders: 'Letzte Bestellungen',
      },
      labels: {
        guests: 'Gäste',
        viewAllOrders: 'Alle Bestellungen ansehen',
        addTodoPlaceholder: 'Neues To-do...',
        addTodo: 'Hinzufügen',
        emptyTodos: 'Noch keine To-dos.',
        deleteTodo: 'To-do löschen',
        emptyRecentOrders: 'Noch keine Bestellungen.',
      },
      messages: {
        loading: 'Dashboard-Daten werden geladen...',
        noData: 'Noch keine Dashboard-Daten verfügbar.',
      },
      status: {
        confirmed: 'Bestätigt',
        pending: 'Ausstehend',
        completed: 'Abgeschlossen',
        cancelled: 'Storniert',
        preparation: 'In Vorbereitung',
        delivery: 'In Lieferung',
      },
    },
  } as const;
  const t = copy[language] ?? copy.EN;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [todosError, setTodosError] = useState<string | null>(null);
  const [newTodoText, setNewTodoText] = useState('');

  useEffect(() => {
    const loadTodos = async () => {
      try {
        setTodosLoading(true);
        setTodosError(null);
        const items = await todosApi.getTodos();
        setTodos(items);
      } catch (err) {
        console.error('Failed to load todos', err);
        setTodosError(language === 'DE' ? 'To-dos konnten nicht geladen werden.' : 'Unable to load todos right now.');
      } finally {
        setTodosLoading(false);
      }
    };
    loadTodos();
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await dashboardApi.getDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
        setLoadError(language === 'DE' ? 'Dashboard-Daten konnten nicht geladen werden.' : 'Unable to load dashboard data right now.');
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
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
  const data = dashboardData;
  const formatNumber = (value?: number) => (
    typeof value === 'number' ? value.toLocaleString(locale) : '--'
  );
  const recentOrders = data?.recentOrders ?? [];
  const incompleteTodos = todos.filter(item => !item.completed).length;

  const addTodo = async () => {
    const text = newTodoText.trim();
    if (!text) return;
    try {
      const created = await todosApi.createTodo({ text });
      setTodos(prev => [created, ...prev]);
      setNewTodoText('');
    } catch (err) {
      console.error('Failed to create todo', err);
      setTodosError(language === 'DE' ? 'To-do konnte nicht gespeichert werden.' : 'Unable to save todo.');
    }
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      const updated = await todosApi.updateTodo(todo.id, { completed: !todo.completed });
      setTodos(prev => prev.map(item => (item.id === updated.id ? updated : item)));
    } catch (err) {
      console.error('Failed to update todo', err);
      setTodosError(language === 'DE' ? 'To-do konnte nicht aktualisiert werden.' : 'Unable to update todo.');
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await todosApi.deleteTodo(id);
      setTodos(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete todo', err);
      setTodosError(language === 'DE' ? 'To-do konnte nicht gelöscht werden.' : 'Unable to delete todo.');
    }
  };

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
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
        
        .animate-fade-in-left {
          animation: fadeInLeft 0.8s ease-out;
        }
      `}</style>

          {loadError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          )}
          {isLoading && !loadError && (
            <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
              {t.messages.loading}
            </div>
          )}
          {!isLoading && !loadError && !data && (
            <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
              {t.messages.noData}
            </div>
          )}
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Orders */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm border border-stone-100 backdrop-blur-sm ${
              isVisible ? 'animate-fade-in-up' : 'opacity-0'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t.stats.totalOrders}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(data?.orders.total)}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Package className="text-amber-700" size={24} />
                </div>
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                <span className="text-blue-600">{t.stats.pending}: {formatNumber(data?.orders.pending)}</span>
                <span className="text-green-600">{t.stats.confirmed}: {formatNumber(data?.orders.confirmed)}</span>
                <span className="text-gray-600">{t.stats.completed}: {formatNumber(data?.orders.completed)}</span>
              </div>
            </div>

            {/* Today's Revenue */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm border border-stone-100 backdrop-blur-sm ${
              isVisible ? 'animate-fade-in-up' : 'opacity-0'
            }`} style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t.stats.todayRevenue}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">€{formatNumber(data?.revenue.today)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="text-green-700" size={24} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-sm text-green-600">
                <TrendingUp size={16} />
                <span>
                  {typeof data?.revenue.growth === 'number'
                    ? `+${data.revenue.growth}% ${t.stats.growthLabel}`
                    : '--'}
                </span>
              </div>
            </div>

            {/* Weekly Revenue */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm border border-stone-100 backdrop-blur-sm ${
              isVisible ? 'animate-fade-in-up' : 'opacity-0'
            }`} style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t.stats.weeklyRevenue}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">€{formatNumber(data?.revenue.week)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-blue-700" size={24} />
                </div>
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm border border-stone-100 backdrop-blur-sm ${
              isVisible ? 'animate-fade-in-up' : 'opacity-0'
            }`} style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t.stats.monthlyRevenue}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">€{formatNumber(data?.revenue.month)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="text-purple-700" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Todo list */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm border border-stone-100 backdrop-blur-sm ${
              isVisible ? 'animate-fade-in-up' : 'opacity-0'
            }`} style={{ animationDelay: '400ms' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-elegant">{t.sections.todos}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {incompleteTodos} {language === 'DE' ? 'offen' : 'open'}
                  </p>
                </div>
                <ListChecks className="text-gray-400" size={20} />
              </div>
               
              <div className="flex gap-3 mb-4">
                <input
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder={t.labels.addTodoPlaceholder}
                  className="flex-1 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/60 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTodo();
                  }}
                />
                <button
                  type="button"
                  onClick={addTodo}
                  disabled={!newTodoText.trim()}
                  className="px-5 py-3 rounded-xl bg-gray-900 text-white hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.labels.addTodo}
                </button>
              </div>

              {todosError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {todosError}
                </div>
              )}

              <div className="space-y-3">
                {todosLoading ? (
                  <p className="text-sm text-gray-500">{language === 'DE' ? 'To-dos werden geladen...' : 'Loading todos...'}</p>
                ) : todos.length === 0 ? (
                  <p className="text-sm text-gray-500">{t.labels.emptyTodos}</p>
                ) : (
                  todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between gap-3 p-4 bg-stone-50 rounded-xl hover:bg-amber-50 transition-colors"
                    >
                      <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo)}
                          className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className={`text-sm font-semibold truncate ${todo.completed ? 'text-gray-900 line-through' : 'text-gray-900'}`}>
                          {todo.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label={t.labels.deleteTodo}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm border border-stone-100 backdrop-blur-sm ${
              isVisible ? 'animate-fade-in-up' : 'opacity-0'
            }`} style={{ animationDelay: '500ms' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 font-elegant">{t.sections.recentOrders}</h2>
                <Package className="text-gray-400" size={20} />
              </div>
              
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-gray-500">{t.labels.emptyRecentOrders}</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-amber-50 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-600">{order.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">€{formatNumber(order.amount)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status[order.status as keyof typeof t.status] ?? order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <button
                onClick={() => router.push('/orders')}
                className="w-full mt-6 py-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                {t.labels.viewAllOrders}
              </button>
            </div>
          </div>

    </AdminLayout>
  );
}
