"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Users, ShieldCheck, LogOut } from 'lucide-react';
import { useBodyScrollLock } from './useBodyScrollLock';
import { useAdminSession } from '@/lib/hooks/useAdminSession';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { L } from '@/lib/i18n/inline';

export type AdminNavItem = {
  id: string;
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type AdminLayoutProps = {
  navigation: AdminNavItem[];
  title: string;
  adminUserLabel: string;
  adminRoleLabel: string;
  languageToggle: React.ReactNode;
  locale?: string;
  headerMeta?: React.ReactNode;
  openMenuLabel?: string;
  closeMenuLabel?: string;
  children: React.ReactNode;
};

export default function AdminLayout({
  navigation,
  title,
  adminUserLabel,
  adminRoleLabel,
  languageToggle,
  locale = 'en-US',
  headerMeta,
  openMenuLabel = 'Open menu',
  closeMenuLabel = 'Close menu',
  children
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAdminSession();
  const { language } = useTranslation('admin');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');

  useBodyScrollLock(mobileSidebarOpen);

  function navigateTo(path: string) {
    router.push(path);
    setMobileSidebarOpen(false);
  }

  // Menu items follow the person's permissions; "Team" is added here so every admin page gets it
  const visibleNavigation = useMemo(() => {
    const resourceByPath: Record<string, string> = {
      '/orders': 'orders',
      '/customers': 'customers',
      '/menu_management': 'menus',
      '/services_management': 'services',
      '/accessories': 'accessories',
      '/system_control': 'system',
      '/reports': 'reports',
    };
    const items = navigation.filter((item) => {
      const resource = resourceByPath[item.path];
      return !resource || session.loading || session.can(`${resource}.view`);
    });
    if (!session.loading && session.can('team.view') && !items.some((item) => item.path === '/team')) {
      items.push({ id: 'team', name: L(language, 'Team', 'Team'), path: '/team', icon: ShieldCheck });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, session.loading, session.me, language]);

  const activeId = useMemo(() => {
    const match = visibleNavigation.find((item) => pathname?.startsWith(item.path));
    return match?.id || visibleNavigation[0]?.id || '';
  }, [visibleNavigation, pathname]);

  async function signOut() {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } finally {
      window.location.href = '/login';
    }
  }

  useEffect(() => {
    try {
      setFormattedDate(
        new Date().toLocaleDateString(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      );
    } catch {
      setFormattedDate(new Date().toDateString());
    }
  }, [locale]);

  // Read-only notice: the server refuses changes anyway; this explains why buttons fail
  const readOnlyResource = (() => {
    const map: Record<string, string> = {
      '/orders': 'orders', '/customers': 'customers', '/menu_management': 'menus', '/services_management': 'services',
      '/accessories': 'accessories', '/system_control': 'system',
    };
    const key = Object.keys(map).find((path) => pathname?.startsWith(path));
    if (!key || session.loading || !session.me) return null;
    const resource = map[key];
    return session.can(`${resource}.edit`) ? null : resource;
  })();

  const sidebarTransformClass = mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0';

  return (
    <div className="min-h-screen bg-[#f6f0e6] overflow-x-hidden text-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#17120e] text-white border-r border-white/10 transition-transform duration-300 ${sidebarTransformClass}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="text-2xl">
              <Image
                src="/images/logo-header-dark.png"
                alt="La Cannelle"
                width={1438}
                height={439}
                priority
                quality={100}
                className="h-auto max-w-[240px] w-auto object-contain"
              />
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-2 rounded-lg text-white hover:bg-white/10 lg:hidden"
              type="button"
              aria-label={closeMenuLabel}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {visibleNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent)] border border-[color:var(--accent)]/40'
                        : 'text-white/65 border border-transparent hover:bg-white/5 hover:text-white'
                    }`}
                    type="button"
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-10 h-10 bg-[color:var(--accent)]/20 rounded-full flex items-center justify-center">
                <Users className="text-[color:var(--accent)]" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{session.me?.name?.trim() || session.me?.email || adminUserLabel}</p>
                <p className="truncate text-sm text-white/60">{session.me?.roleName || adminRoleLabel}</p>
              </div>
              <button
                type="button"
                onClick={signOut}
                aria-label={L(language, 'Abmelden', 'Sign out')}
                title={L(language, 'Abmelden', 'Sign out')}
                className="shrink-0 rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="min-w-0 transition-all duration-300 ml-0 lg:ml-72">
        <header className="bg-[#faf6ef]/85 backdrop-blur-lg border-b border-black/10 sticky top-0 z-30">
          <div className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
                type="button"
                aria-label={openMenuLabel}
              >
                <Menu size={20} />
              </button>
              <h1 className="min-w-0 text-xl sm:text-2xl font-bold text-gray-900 font-elegant truncate">
                {title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
              {headerMeta ?? <div className="hidden md:block text-sm text-gray-600">{formattedDate}</div>}
              {languageToggle}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 min-w-0">
          {readOnlyResource && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              {L(language, 'Sie haben hier nur Lesezugriff. Änderungen werden vom Server abgelehnt.', 'You have read-only access here. Changes are refused by the server.')}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
