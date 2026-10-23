"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X, ArrowUpRight, ChevronDown, Phone, Mail, MapPin, PlayCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Language } from "@/lib/hooks/useTranslation";
import { commonTranslations } from "@/lib/translations/common";
import Container from "./Container";
import { INSTAGRAM_PROFILE_URL } from "@/lib/config/social";

type NavLabels = {
  home: string;
  services: string;
  menus: string;
  contact: string;
  order: string;
};

type A11yLabels = {
  switchToGerman: string;
  switchToEnglish: string;
  englishFlagAlt: string;
  germanFlagAlt: string;
};

type SiteHeaderProps = {
  language: Language;
  toggleLanguage: () => void;
  pathname: string;
  nav: NavLabels;
  a11y: A11yLabels;
  onOrderClick?: () => void;
  /** Let the hero show through until the page is scrolled (home page). */
  transparentOnTop?: boolean;
};

type DropdownItem = { href: string; title: string; description: string };
type NavEntry = {
  href: string;
  label: string;
  description?: string;
  items?: DropdownItem[];
};

const isActiveHref = (pathname: string, href: string) => {
  if (href === "/home") return pathname === "/" || pathname === "/home";
  return pathname === href;
};

const FLAGS = {
  EN: "/images/language/Flag_of_United_Kingdom-4096x2048.png",
  DE: "/images/language/Flag_of_Germany-4096x2453.png",
} as const;

export default function SiteHeader({
  language,
  toggleLanguage,
  pathname,
  nav,
  a11y,
  onOrderClick,
  transparentOnTop = false,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparentOnTop) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparentOnTop]);

  const de = language === "DE";
  const common = commonTranslations[language];
  const phone = common.footer.contactPhone;
  const email = common.footer.contactEmail;
  const address = common.footer.contactAddress;
  const telHref = `tel:${phone.replace(/[^\d+]/g, "")}`;

  const entries = useMemo<NavEntry[]>(
    () => [
      {
        href: "/home",
        label: nav.home,
        description: de ? "Schnellzugriff auf die Highlights der Startseite." : "Quick links to the highlights on our home page.",
        items: [
          { href: "/home#menu-snapshots", title: de ? "Menu Snapshots" : "Menu snapshots", description: de ? "Kuratiert & inspirierend" : "Curated and inspiring" },
          { href: "/home#lookbook", title: "Lookbook", description: de ? "Galerie & Reels" : "Gallery and reels" },
          { href: "/home#collections", title: de ? "Kollektionen" : "Collections", description: de ? "Beliebte Kategorien" : "Popular categories" },
          { href: "/home#service-formats", title: "Services", description: de ? "Formate & Angebote" : "Formats and offerings" },
          { href: "/home#testimonials", title: "Feedback", description: de ? "Was Kunden sagen" : "What clients say" },
        ],
      },
      {
        href: "/services",
        label: nav.services,
        description: de
          ? "Entdecken Sie unsere Catering-Formate – flexibel, elegant, zuverlässig."
          : "Explore our catering formats — flexible, elegant, reliable.",
        items: [
          { href: "/services#office-catering", title: "Office Catering", description: de ? "Meetings, Lunch & Empfang" : "Meetings, lunch & receptions" },
          { href: "/services#weddings", title: de ? "Hochzeiten" : "Weddings", description: de ? "Feierlich, stressfrei, perfekt" : "Elegant, seamless, unforgettable" },
          { href: "/services#corporate-events", title: "Corporate Events", description: de ? "Professionell & hochwertig" : "Premium and polished" },
        ],
      },
      {
        href: "/menus",
        label: nav.menus,
        description: de ? "Kuratiert, saisonal und bereit zu bestellen." : "Curated, seasonal, and ready to order.",
        items: [
          { href: "/menus", title: de ? "Menus entdecken" : "Browse menus", description: de ? "Alle Highlights ansehen" : "Explore all highlights" },
          { href: "/home#menu-snapshots", title: de ? "Menu Snapshots" : "Menu snapshots", description: de ? "Schneller Überblick" : "Quick curated peek" },
          { href: "/order", title: de ? "Direkt bestellen" : "Order now", description: de ? "In wenigen Schritten" : "In a few steps" },
        ],
      },
      { href: "/contact", label: nav.contact },
    ],
    [de, nav]
  );

  const orderHandler = onOrderClick ?? (() => {});
  const solid = !transparentOnTop || scrolled || open;

  const desktopLinkClass = (href: string) =>
    `relative py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-[color:var(--accent)] after:transition-transform after:duration-300 ${
      isActiveHref(pathname, href)
        ? "text-white after:scale-x-100"
        : "text-white/70 hover:text-white after:scale-x-0 hover:after:scale-x-100"
    }`;

  const langButton = (className: string, label: string) => (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={language === "EN" ? a11y.switchToGerman : a11y.switchToEnglish}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 transition-colors hover:border-white/40 hover:bg-white/10 ${className}`}
    >
      <Image
        src={FLAGS[language]}
        alt={language === "EN" ? a11y.englishFlagAlt : a11y.germanFlagAlt}
        width={18}
        height={18}
        className="h-[18px] w-auto rounded-sm"
      />
      <span>{label}</span>
    </button>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`overflow-hidden border-b border-white/10 bg-[#120d0a] transition-all duration-300 ${
          transparentOnTop && !solid ? "h-0 border-transparent opacity-0" : "h-[34px] opacity-100"
        }`}
      >
        <Container className="h-[34px]">
          <div className="flex h-[34px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-5 text-[11px] font-medium tracking-[0.08em] text-white/70">
              <a href={telHref} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                <Phone size={13} className="text-[color:var(--accent)]" />
                <span className="hidden sm:inline">{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="hidden items-center gap-2 transition-colors hover:text-white md:inline-flex">
                <Mail size={13} className="text-[color:var(--accent)]" />
                <span>{email}</span>
              </a>
              <span className="hidden items-center gap-2 lg:inline-flex">
                <MapPin size={13} className="text-[color:var(--accent)]" />
                <span className="truncate">{address}</span>
              </span>
            </div>

            <div className="flex items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.18em]">
              <a
                href={INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 text-white/70 transition-colors hover:text-white sm:inline-flex"
              >
                <PlayCircle size={14} />
                Reels
              </a>
              <Link href="/contact" className="inline-flex items-center gap-1.5 text-[color:var(--accent)] transition-colors hover:text-white">
                {de ? "Angebot anfragen" : "Request a quote"}
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </Container>
      </div>

      <div
        className={`border-b transition-all duration-300 ${
          solid
            ? "border-white/10 bg-[#17120e]/95 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl"
            : "border-transparent bg-gradient-to-b from-black/60 to-transparent"
        }`}
      >
        <Container>
          <div className="flex h-[84px] items-center justify-between gap-4">
            <Link href="/home" className="flex min-w-0 items-center">
              <Image
                src="/images/logo-header-dark.png"
                alt="La Cannelle"
                width={1438}
                height={439}
                priority
                quality={100}
                sizes="(max-width: 640px) 60vw, 320px"
                className="h-[clamp(52px,10vw,72px)] w-auto max-w-[min(60vw,320px)] object-contain"
              />
            </Link>

            <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
              {entries.map((entry) => (
                <div key={entry.href} className="group relative">
                  <Link href={entry.href} className={desktopLinkClass(entry.href)}>
                    {entry.label}
                  </Link>
                  {entry.items && (
                    <div className="pointer-events-none absolute left-1/2 top-full z-50 w-[600px] -translate-x-1/2 pt-5 opacity-0 transition-opacity duration-200 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
                      <div className="grid grid-cols-12 gap-8 rounded-2xl border border-white/10 bg-[#17120e]/98 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                        <div className="col-span-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                            {entry.label}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-white/75">{entry.description}</p>
                        </div>
                        <div className="col-span-7 space-y-1">
                          {entry.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="group/item flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-white/5"
                            >
                              <div>
                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                <p className="mt-0.5 text-xs text-white/55">{item.description}</p>
                              </div>
                              <ArrowUpRight
                                size={16}
                                className="shrink-0 text-white/40 transition-all group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5 group-hover/item:text-[color:var(--accent)]"
                              />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              {langButton("", language)}
              <button
                type="button"
                onClick={() => orderHandler()}
                className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black transition-all hover:brightness-110"
              >
                {nav.order}
                <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-white/20 p-2.5 text-white transition-colors hover:bg-white/10 md:hidden"
              onClick={() => {
                setOpen((v) => !v);
                setMobileSection(null);
              }}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </Container>
      </div>

      {open && (
        <div className="max-h-[calc(100svh-118px)] overflow-y-auto border-b border-white/10 bg-[#17120e] md:hidden">
          <Container className="py-5">
            <div className="flex flex-col">
              {entries.map((entry) => {
                const active = isActiveHref(pathname, entry.href);
                const linkClass = `text-sm font-semibold uppercase tracking-[0.18em] ${active ? "text-[color:var(--accent)]" : "text-white/85"}`;
                if (!entry.items) {
                  return (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      onClick={() => setOpen(false)}
                      className={`border-b border-white/10 py-4 ${linkClass}`}
                    >
                      {entry.label}
                    </Link>
                  );
                }
                const expanded = mobileSection === entry.href;
                return (
                  <div key={entry.href} className="border-b border-white/10">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 py-4 text-left"
                      onClick={() => setMobileSection(expanded ? null : entry.href)}
                      aria-expanded={expanded}
                    >
                      <span className={linkClass}>{entry.label}</span>
                      <ChevronDown size={18} className={`text-white/60 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    {expanded && (
                      <div className="space-y-1 pb-4">
                        {entry.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                          >
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-0.5 text-xs text-white/55">{item.description}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="mt-5 flex items-center gap-3">
                {langButton("flex-1 py-3", language === "EN" ? "English" : "Deutsch")}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    orderHandler();
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[color:var(--accent)] px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black transition-all hover:brightness-110"
                >
                  {nav.order}
                </button>
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
