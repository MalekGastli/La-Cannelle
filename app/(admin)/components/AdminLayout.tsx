"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Users } from 'lucide-react';
import { useBodyScrollLock } from './useBodyScrollLock';

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');

  useBodyScrollLock(mobileSidebarOpen);

  function navigateTo(path: string) {
    router.push(path);
    setMobileSidebarOpen(false);
  }

  const activeId = useMemo(() => {
    const match = navigation.find((item) => pathname?.startsWith(item.path));
    return match?.id || navigation[0]?.id || '';
  }, [navigation, pathname]);

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

  const sidebarTransformClass = mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0';

  return (
    <div className="min-h-screen bg-[#efebe4] overflow-x-hidden text-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#261811] text-white border-r border-white/10 transition-transform duration-300 ${sidebarTransformClass}`}
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
              {navigation.map((item) => {
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
              <div className="flex-1">
                <p className="font-semibold text-white">{adminUserLabel}</p>
                <p className="text-sm text-white/60">{adminRoleLabel}</p>
              </div>
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
        <header className="bg-[#efebe4]/85 backdrop-blur-lg border-b border-black/10 sticky top-0 z-30">
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

        <main className="p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
