"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X, ArrowUpRight, ChevronDown, Phone, Mail, MapPin, PlayCircle } from "lucide-react";
import { useMemo, useState } from "react";
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
};

const isActiveHref = (pathname: string, href: string) => {
  if (href === "/home") return pathname === "/" || pathname === "/home";
  return pathname === href;
};

export default function SiteHeader({ language, toggleLanguage, pathname, nav, a11y, onOrderClick }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const [mobileHomeOpen, setMobileHomeOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileMenusOpen, setMobileMenusOpen] = useState(false);

  const common = commonTranslations[language];
  const phone = common.footer.contactPhone;
  const email = common.footer.contactEmail;
  const address = common.footer.contactAddress;
  const telHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const mailHref = `mailto:${email}`;

  const homeDropdown = useMemo(
    () => ({
      title: nav.home,
      description:
        language === "DE"
          ? "Schnellzugriff auf die Highlights der Startseite."
          : "Quick links to the highlights on our home page.",
      items: [
        {
          href: "/home#menu-snapshots",
          title: language === "DE" ? "Menu Snapshots" : "Menu snapshots",
          description: language === "DE" ? "Kuratiert & inspirierend" : "Curated and inspiring",
        },
        {
          href: "/home#lookbook",
          title: language === "DE" ? "Lookbook" : "Lookbook",
          description: language === "DE" ? "Galerie & Reels" : "Gallery and reels",
        },
        {
          href: "/home#collections",
          title: language === "DE" ? "Kollektionen" : "Collections",
          description: language === "DE" ? "Beliebte Kategorien" : "Popular categories",
        },
        {
          href: "/home#service-formats",
          title: language === "DE" ? "Services" : "Services",
          description: language === "DE" ? "Formate & Angebote" : "Formats and offerings",
        },
        {
          href: "/home#testimonials",
          title: language === "DE" ? "Feedback" : "Feedback",
          description: language === "DE" ? "Was Kunden sagen" : "What clients say",
        },
      ],
    }),
    [language, nav.home]
  );

  const servicesDropdown = useMemo(
    () => ({
      title: nav.services,
      description:
        language === "DE"
          ? "Entdecken Sie unsere Catering-Formate – flexibel, elegant, zuverlässig."
          : "Explore our catering formats — flexible, elegant, reliable.",
      items: [
        {
          href: "/services#office-catering",
          title: language === "DE" ? "Office Catering" : "Office catering",
          description: language === "DE" ? "Meetings, Lunch & Empfang" : "Meetings, lunch & receptions",
        },
        {
          href: "/services#weddings",
          title: language === "DE" ? "Hochzeiten" : "Weddings",
          description: language === "DE" ? "Feierlich, stressfrei, perfekt" : "Elegant, seamless, unforgettable",
        },
        {
          href: "/services#corporate-events",
          title: language === "DE" ? "Corporate Events" : "Corporate events",
          description: language === "DE" ? "Professionell & hochwertig" : "Premium and polished",
        },
      ],
    }),
    [language, nav.services]
  );

  const menusDropdown = useMemo(
    () => ({
      title: nav.menus,
      description:
        language === "DE"
          ? "Kuratiert, saisonal und bereit zu bestellen."
          : "Curated, seasonal, and ready to order.",
      items: [
        {
          href: "/menus",
          title: language === "DE" ? "Menus entdecken" : "Browse menus",
          description: language === "DE" ? "Alle Highlights ansehen" : "Explore all highlights",
        },
        {
          href: "/home#menu-snapshots",
          title: language === "DE" ? "Menu Snapshots" : "Menu snapshots",
          description: language === "DE" ? "Schneller Überblick" : "Quick curated peek",
        },
        {
          href: "/order",
          title: language === "DE" ? "Direkt bestellen" : "Order now",
          description: language === "DE" ? "In wenigen Schritten" : "In a few steps",
        },
      ],
    }),
    [language, nav.menus]
  );

  const links = useMemo(
    () => [
      { href: "/home", label: nav.home },
      { href: "/services", label: nav.services },
      { href: "/menus", label: nav.menus },
      { href: "/contact", label: nav.contact },
    ],
    [nav]
  );

  const orderHandler = onOrderClick ?? (() => {});

  const desktopLinkClass = (href: string) =>
    `text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors ${
      isActiveHref(pathname, href) ? "text-white" : "text-white/70 hover:text-white"
    } hover:text-[color:var(--accent)]`;

  const mobileLinkClass = (href: string) =>
    `text-sm font-semibold uppercase tracking-[0.18em] transition-colors ${
      isActiveHref(pathname, href) ? "text-white" : "text-white/80 hover:text-white"
    } hover:text-[color:var(--accent)]`;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="bg-black/95 backdrop-blur-xl border-b border-white/10">
        <Container className="h-[34px]">
          <div className="flex h-[34px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              <a href={telHref} className="inline-flex items-center gap-2 hover:text-white transition-colors">
                <Phone size={14} className="text-white/60" />
                <span className="hidden sm:inline">{phone}</span>
              </a>
              <a href={mailHref} className="hidden md:inline-flex items-center gap-2 hover:text-white transition-colors">
                <Mail size={14} className="text-white/60" />
                <span className="normal-case tracking-normal text-white/70">{email}</span>
              </a>
              <span className="hidden lg:inline-flex items-center gap-2">
                <MapPin size={14} className="text-white/60" />
                <span className="truncate normal-case tracking-normal text-white/70">{address}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/0 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 hover:bg-white/5 hover:text-white transition-colors"
              >
                <PlayCircle size={16} className="text-white/70" />
                {language === "DE" ? "Reels" : "Reels"}
                <ArrowUpRight size={14} className="text-white/60" />
              </a>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 hover:bg-white/10 transition-colors"
              >
                {language === "DE" ? "Angebot anfragen" : "Request a quote"}
                <ArrowUpRight size={14} className="text-white/70" />
              </Link>
            </div>
          </div>
        </Container>
      </div>

      <div className="bg-black border-b border-white/10">
        <Container className="h-[92px] sm:h-[96px] md:h-[104px]">
          <div className="flex h-[92px] sm:h-[96px] md:h-[104px] items-center justify-between gap-4">
            <Link href="/home" className="flex items-center gap-3 min-w-0">
              <Image
                src="/images/logo-header-dark.png"
                alt="La Cannelle"
                width={1438}
                height={439}
                priority
                quality={100}
                sizes="(max-width: 640px) 78vw, (max-width: 1024px) 520px, 640px"
                className="w-auto object-contain h-[clamp(70px,14vw,96px)] max-w-[min(78vw,640px)]"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <div className="relative group">
                <Link href="/home" className={desktopLinkClass("/home")}>
                  {nav.home}
                </Link>
                <div className="pointer-events-none absolute left-1/2 top-full z-50 w-[640px] -translate-x-1/2 pt-4 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  <div className="rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
                    <div className="grid grid-cols-12 gap-8 p-8">
                      <div className="col-span-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                          {homeDropdown.title}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-white/80">{homeDropdown.description}</p>
                      </div>
                      <div className="col-span-7 space-y-2">
                        {homeDropdown.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group/item block rounded-xl border border-white/10 bg-white/0 p-4 transition-colors hover:bg-white/5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/60">{item.description}</p>
                              </div>
                              <ArrowUpRight
                                size={18}
                                className="text-white/60 transition-transform group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5"
                              />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <Link href="/services" className={desktopLinkClass("/services")}>
                  {nav.services}
                </Link>
                <div className="pointer-events-none absolute left-1/2 top-full z-50 w-[640px] -translate-x-1/2 pt-4 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  <div className="rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
                    <div className="grid grid-cols-12 gap-8 p-8">
                      <div className="col-span-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                          {servicesDropdown.title}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-white/80">{servicesDropdown.description}</p>
                      </div>
                      <div className="col-span-7 space-y-2">
                        {servicesDropdown.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group/item block rounded-xl border border-white/10 bg-white/0 p-4 transition-colors hover:bg-white/5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/60">{item.description}</p>
                              </div>
                              <ArrowUpRight
                                size={18}
                                className="text-white/60 transition-transform group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5"
                              />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <Link href="/menus" className={desktopLinkClass("/menus")}>
                  {nav.menus}
                </Link>
                <div className="pointer-events-none absolute left-1/2 top-full z-50 w-[640px] -translate-x-1/2 pt-4 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  <div className="rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
                    <div className="grid grid-cols-12 gap-8 p-8">
                      <div className="col-span-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">{menusDropdown.title}</p>
                        <p className="mt-3 text-sm leading-relaxed text-white/80">{menusDropdown.description}</p>
                      </div>
                      <div className="col-span-7 space-y-2">
                        {menusDropdown.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group/item block rounded-xl border border-white/10 bg-white/0 p-4 transition-colors hover:bg-white/5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/60">{item.description}</p>
                              </div>
                              <ArrowUpRight
                                size={18}
                                className="text-white/60 transition-transform group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5"
                              />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/contact" className={desktopLinkClass("/contact")}>
                {nav.contact}
              </Link>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label={language === "EN" ? a11y.switchToGerman : a11y.switchToEnglish}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 hover:bg-white/10 transition-colors"
              >
                <Image
                  src={
                    language === "EN"
                      ? "/images/language/Flag_of_United_Kingdom-4096x2048.png"
                      : "/images/language/Flag_of_Germany-4096x2453.png"
                  }
                  alt={language === "EN" ? a11y.englishFlagAlt : a11y.germanFlagAlt}
                  width={18}
                  height={18}
                  className="h-[18px] w-auto rounded-sm"
                />
                <span>{language === "EN" ? "EN" : "DE"}</span>
              </button>

              <button
                type="button"
                onClick={orderHandler}
                className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black hover:brightness-95 transition-all"
              >
                {nav.order}
                <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </div>

            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-2 text-white hover:bg-white/10 transition-colors"
              onClick={() =>
                setOpen((v) => {
                  const next = !v;
                  if (next) {
                    setMobileHomeOpen(false);
                    setMobileServicesOpen(false);
                    setMobileMenusOpen(false);
                  }
                  return next;
                })
              }
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </Container>
      </div>

      {open && (
        <div className="md:hidden border-b border-white/10 bg-black">
          <Container className="py-5">
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => setMobileHomeOpen((v) => !v)}
                  aria-expanded={mobileHomeOpen}
                >
                  <span className={mobileLinkClass("/home")}>{nav.home}</span>
                  <ChevronDown size={18} className={`text-white/70 transition-transform ${mobileHomeOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileHomeOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {homeDropdown.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => setMobileServicesOpen((v) => !v)}
                  aria-expanded={mobileServicesOpen}
                >
                  <span className={mobileLinkClass("/services")}>{nav.services}</span>
                  <ChevronDown
                    size={18}
                    className={`text-white/70 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileServicesOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {servicesDropdown.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => setMobileMenusOpen((v) => !v)}
                  aria-expanded={mobileMenusOpen}
                >
                  <span className={mobileLinkClass("/menus")}>{nav.menus}</span>
                  <ChevronDown size={18} className={`text-white/70 transition-transform ${mobileMenusOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileMenusOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {menusDropdown.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/contact" className={mobileLinkClass("/contact")} onClick={() => setOpen(false)}>
                {nav.contact}
              </Link>

              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleLanguage}
                  aria-label={language === "EN" ? a11y.switchToGerman : a11y.switchToEnglish}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 hover:bg-white/10 transition-colors"
                >
                  <Image
                    src={
                      language === "EN"
                        ? "/images/language/Flag_of_United_Kingdom-4096x2048.png"
                        : "/images/language/Flag_of_Germany-4096x2453.png"
                    }
                    alt={language === "EN" ? a11y.englishFlagAlt : a11y.germanFlagAlt}
                    width={18}
                    height={18}
                  className="h-[18px] w-auto rounded-sm"
                />
                  <span>{language === "EN" ? "English" : "Deutsch"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    orderHandler();
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[color:var(--accent)] px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black hover:brightness-95 transition-all"
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

