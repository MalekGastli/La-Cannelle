"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { menusApi, type Menu as ApiMenu } from '@/lib/api/menus';
import { useTranslation } from '@/lib/hooks/useTranslation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { commonTranslations } from '@/lib/translations/common';
import { homeTranslations } from '@/lib/translations/home';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import { INSTAGRAM_PROFILE_URL } from '@/lib/config/social';

const BRAND_LOGOS = [
  { name: 'Montblanc', src: '/images/logos/banner/montblanc.png' },
  { name: 'Omnicom Media Group', src: '/images/logos/banner/omnicom-media-group.png' },
  { name: 'OMG', src: '/images/logos/banner/omg.png' },
  { name: 'DoiT International', src: '/images/logos/banner/doit.png' },
  { name: 'BBDO', src: '/images/logos/banner/bbdo.png' },
  { name: 'IWC Schaffhausen', src: '/images/logos/banner/iwc.png' },
  { name: 'Ruby Hotels', src: '/images/logos/ruby-hotels.svg' },
  { name: 'RIMOWA', src: '/images/logos/banner/rimowa.png' },
  { name: 'Ralph Lauren', src: '/images/logos/banner/ralph-lauren.png' },
  { name: 'Samsonite', src: '/images/logos/banner/samsonite.png' },
  { name: 'SABIC', src: '/images/logos/banner/sabic.png' },
];

// Photography used whenever a menu has no image of its own (or the API is unreachable).
const FALLBACK_PHOTOS = [
  '/images/risotto.jpg',
  '/images/lamb.jpg',
  '/images/scallops.jpg',
  '/images/beef-wellington.jpg',
  '/images/salad.jpg',
  '/images/truffle-arancini.jpg',
];

type IndexRow = {
  key: string;
  name: string;
  description: string;
  price?: string;
  image: string;
  productIds?: number[];
};

export default function CateringHomepage() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, toggleLanguage } = useTranslation('home');
  const t = homeTranslations[language];
  const de = language === 'DE';

  const commonNav = commonTranslations[language].nav;
  const commonA11y = commonTranslations[language].accessibility;

  const [menus, setMenus] = useState<ApiMenu[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [menusFailed, setMenusFailed] = useState(false);
  const [activeRow, setActiveRow] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await menusApi.getMenus({ isActive: true, includeImages: true });
        if (cancelled) return;
        setMenus(
          (result || []).map((menu) => ({
            ...menu,
            products: menu?.menuProducts ? menu.menuProducts.map((mp) => mp.productId) : menu?.products || [],
          }))
        );
      } catch (error) {
        console.error('Failed to load menus', error);
        if (!cancelled) setMenusFailed(true);
      } finally {
        if (!cancelled) setLoadingMenus(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goOrder = (productIds?: number[]) => {
    const query = productIds?.length ? `?products=${productIds.join(',')}` : '';
    router.push(`/order${query}`);
  };

  const rows = useMemo<IndexRow[]>(() => {
    if (menus.length) {
      return menus.slice(0, 6).map((menu, index) => ({
        key: `menu-${menu.id}`,
        name: menu.name,
        description: menu.description || '',
        price: menu.price !== undefined ? `${menu.price.toFixed(2)} €` : undefined,
        image: menu.image || FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length],
        productIds: menu.products,
      }));
    }
    return t.menuShowcase.items.slice(0, 6).map((item, index) => ({
      key: `static-${index}`,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image || FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length],
    }));
  }, [menus, t]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#efebe4] text-[#14110e]">
      <SiteHeader
        transparentOnTop
        language={language}
        toggleLanguage={toggleLanguage}
        pathname={pathname}
        nav={{
          home: t.nav.home || commonNav.home,
          services: t.nav.services || commonNav.services,
          menus: t.nav.menus || commonNav.menus,
          contact: t.nav.contact || commonNav.contact,
          order: t.nav.order || commonNav.order,
        }}
        a11y={commonA11y}
        onOrderClick={() => goOrder()}
      />

      {/* Hero: photograph first, headline anchored bottom-left */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#261811]">
        <Image
          src="/images/home_image.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="lux-hero-image object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(26,16,10,0.92)_0%,rgba(26,16,10,0.55)_45%,rgba(26,16,10,0.25)_100%)]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-40 sm:px-6 sm:pb-20 lg:px-8">
          <h1 className="font-display max-w-4xl animate-fade-in-up text-[clamp(2.75rem,7.5vw,6.5rem)] font-normal leading-[1.02] tracking-tight text-white">
            {t.hero.title}
          </h1>
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-lg text-lg leading-relaxed text-white/80">{t.hero.subtitle}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => router.push('/contact')} className="btn-accent">
                {t.hero.cta}
              </button>
              <button type="button" onClick={() => goOrder()} className="btn-outline-light">
                {commonNav.order}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Clients */}
      <section className="border-b border-black/10 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-8 max-w-md text-sm text-black/60">{t.brandBanner.title}</p>
          <div className="lux-marquee" style={{ ['--lux-marquee-duration' as string]: '34s' }} aria-label={t.brandBanner.title}>
            <div className="lux-marquee-track">
              {BRAND_LOGOS.map((logo) => (
                <div key={logo.name} className="lux-marquee-item">
                  <img src={logo.src} alt={`${logo.name} logo`} loading="lazy" decoding="async" />
                </div>
              ))}
              {BRAND_LOGOS.map((logo) => (
                <div key={`${logo.name}-dup`} className="lux-marquee-item" aria-hidden="true">
                  <img src={logo.src} alt="" loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Menus: a typographic menu card with a photo that follows the hovered course */}
      <section id="menu-snapshots" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-40">
              <h2 className="font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl">{t.menus.title}</h2>
              <p className="mt-5 max-w-sm leading-relaxed text-black/65">{t.menus.description}</p>

              <div className="relative mt-10 hidden aspect-[4/5] overflow-hidden bg-[#261811] lg:block">
                {rows.map((row, index) => (
                  <Image
                    key={row.key}
                    src={row.image}
                    alt={index === activeRow ? row.name : ''}
                    fill
                    sizes="(min-width: 1024px) 40vw, 0px"
                    className={`object-cover transition-opacity duration-500 ${index === activeRow ? 'opacity-100' : 'opacity-0'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {menusFailed && !menus.length && <p className="mb-6 text-sm text-black/60">{t.errors.menusLoadFailed}</p>}
            {loadingMenus && !rows.length && <LoadingSpinner className="mb-8" label="Loading menus..." />}

            <ul className="border-t border-black/15">
              {rows.map((row, index) => (
                <li key={row.key} className="border-b border-black/15">
                  <button
                    type="button"
                    onClick={() => goOrder(row.productIds)}
                    onMouseEnter={() => setActiveRow(index)}
                    onFocus={() => setActiveRow(index)}
                    className="group grid w-full grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 py-7 text-left"
                  >
                    <span className="font-display text-2xl tracking-tight transition-colors group-hover:text-[#7a6a32] sm:text-3xl">
                      {row.name}
                    </span>
                    <span className="flex items-center gap-3 text-lg tabular-nums">
                      {row.price}
                      <ArrowUpRight
                        size={20}
                        className="text-black/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#7a6a32]"
                      />
                    </span>
                    <span className="col-span-2 max-w-xl text-[15px] leading-relaxed text-black/60">{row.description}</span>
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => router.push('/menus')}
              className="mt-10 inline-flex items-center gap-2 border-b border-black pb-1 font-semibold transition-colors hover:border-[#7a6a32] hover:text-[#7a6a32]"
            >
              {t.menus.cta}
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="service-formats" className="bg-[#261811] py-24 text-[#f1ece4] sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl">{t.services.title}</h2>
              <p className="mt-5 max-w-sm leading-relaxed text-white/65">{t.services.subtitle}</p>
            </div>
            <ul className="border-t border-white/15 lg:col-span-7">
              {t.services.items.map((service) => (
                <li key={service.title} className="border-b border-white/15 py-9">
                  <h3 className="font-display text-2xl tracking-tight sm:text-3xl">{service.title}</h3>
                  <p className="mt-3 max-w-xl leading-relaxed text-white/65">{service.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Lookbook */}
      <section id="lookbook" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display max-w-xl text-4xl leading-[1.1] tracking-tight sm:text-5xl">
            {de ? 'Aus unserer Küche und von unseren Events' : 'From our kitchen and our events'}
          </h2>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border-b border-black pb-1 font-semibold transition-colors hover:border-[#7a6a32] hover:text-[#7a6a32]"
          >
            {de ? 'Auf Instagram folgen' : 'Follow on Instagram'}
            <ArrowUpRight size={18} />
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-12 sm:gap-4">
          {[
            { src: '/images/exclusive-dining.jpg', className: 'sm:col-span-7 aspect-[4/3]', caption: de ? 'Private Dining' : 'Private dining' },
            { src: '/images/community-feast.jpg', className: 'sm:col-span-5 aspect-[4/3] sm:aspect-auto', caption: de ? 'Feiern' : 'Celebrations' },
            { src: '/images/restaurant-interior.jpg', className: 'sm:col-span-5 aspect-[4/3]', caption: de ? 'Firmenevents' : 'Brand events' },
            { src: '/images/chocolate-sphere.jpg', className: 'sm:col-span-7 aspect-[4/3] sm:aspect-auto', caption: 'Dessert' },
          ].map((tile) => (
            <a
              key={tile.src}
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className={`group relative block overflow-hidden bg-[#261811] ${tile.className}`}
            >
              <Image
                src={tile.src}
                alt={tile.caption}
                fill
                sizes="(min-width: 640px) 58vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <span className="absolute bottom-0 left-0 bg-[#efebe4] px-4 py-2 text-sm font-semibold">{tile.caption}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Closing call to action over photography */}
      <section className="relative overflow-hidden bg-[#261811] text-white">
        <Image src="/images/exclusive-service.jpg" alt="" fill sizes="100vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-[#261811]/70" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <h2 className="font-display max-w-3xl text-4xl leading-[1.08] tracking-tight sm:text-6xl">
            {de ? 'Erzählen Sie uns von Ihrem Anlass.' : 'Tell us about your event.'}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
            {de
              ? 'Sie bekommen innerhalb von 24 Stunden ein persönliches Angebot mit Menü, Ablauf und Kosten.'
              : 'You get a personal proposal within 24 hours, with menu, schedule and costs.'}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => router.push('/contact')} className="btn-accent">
              {de ? 'Angebot anfragen' : 'Request a quote'}
            </button>
            <button type="button" onClick={() => goOrder()} className="btn-outline-light">
              {de ? 'Direkt bestellen' : 'Order online'}
            </button>
          </div>
        </div>
      </section>

      <SiteFooter footer={commonTranslations[language].footer} nav={commonNav} />
    </div>
  );
}
