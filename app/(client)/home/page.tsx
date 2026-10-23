"use client";

import React, { useState, useEffect } from 'react';
import { L } from '@/lib/i18n/inline';
import { ChevronRight, Phone, Mail, MapPin, Users, Award, Eye, Target, Building, Flag, Globe, Zap, ArrowUpRight, PlayCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Star, Crown, Shield, Heart } from 'lucide-react';
import { menusApi, type Menu as ApiMenu } from '@/lib/api/menus';
import { productsApi, type Product } from '@/lib/api/products';
import { useTranslation, pick } from '@/lib/hooks/useTranslation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRef } from 'react';
import { commonTranslations } from '@/lib/translations/common';
import type { Language } from '@/lib/hooks/useTranslation';
import { Clock, ChefHat, Flame } from 'lucide-react';
import { useMemo } from 'react';
import { Check } from 'lucide-react';
import MenuShowcaseHorizontal from '../components/page';
import { homeTranslations } from '@/lib/translations/home';
import SiteHeader from '@/components/site/SiteHeader';
import { SplitText, Spotlight, ImageReveal, Magnetic, Aurora } from '@/components/site/Motion';
import GlassFolder, { type FolderFile } from '@/components/ui/glass-folder-cards';
import SiteFooter from '@/components/site/SiteFooter';
import { INSTAGRAM_PROFILE_URL } from '@/lib/config/social';


// Each service is a folder: its photographs sit inside and fan out when the folder is opened.
const SNAPSHOT_IMAGES = ['/images/services/corporate.jpg', '/images/truffle-arancini.jpg', '/images/community-feast.jpg'];

const SERVICE_FOLDERS: { cover: string; files: { image: string; de: string; en: string }[] }[] = [
  {
    cover: '/images/home_image.jpeg',
    files: [
      { image: '/images/chef-passion.jpg', de: 'Aus der Küche', en: 'From the kitchen' },
      { image: '/images/mediterranean-buffet.jpg', de: 'Fingerfood-Buffet', en: 'Finger food buffet' },
      { image: '/images/home_image.jpeg', de: 'Abendbuffet', en: 'Evening buffet' },
    ],
  },
  {
    cover: '/images/services/office.jpg',
    files: [
      { image: '/images/services/office.jpg', de: 'Kaffeepause im Büro', en: 'Office coffee break' },
      { image: '/images/salad.jpg', de: 'Frisch geliefert', en: 'Delivered fresh' },
      { image: '/images/services/corporate.jpg', de: 'Frühstücksbuffet', en: 'Breakfast buffet' },
    ],
  },
  {
    cover: '/images/restaurant-interior.jpg',
    files: [
      { image: '/images/accessories/table-setting.jpg', de: 'Gläser und Tafel', en: 'Glassware and table' },
      { image: '/images/restaurant-interior.jpg', de: 'Grazing-Tisch', en: 'Grazing table' },
      { image: '/images/exclusive-service.jpg', de: 'Empfang', en: 'Reception' },
    ],
  },
];

// Partner logos shown in the banner below the hero. Only keep brands that have given permission.
const BRAND_LOGOS = [
  { name: 'Montblanc', src: '/images/logos/banner/montblanc.png' },
  { name: 'Omnicom Media Group', src: '/images/logos/banner/omnicom-media-group.png' },
  { name: 'OMG', src: '/images/logos/banner/omg.png' },
  { name: 'DoiT International', src: '/images/logos/banner/doit.png' },
  { name: 'BBDO', src: '/images/logos/banner/bbdo.png' },
  { name: 'IWC Schaffhausen', src: '/images/logos/banner/iwc.png' },
  { name: 'RIMOWA', src: '/images/logos/banner/rimowa.png' },
  { name: 'Ralph Lauren', src: '/images/logos/banner/ralph-lauren.png' },
  { name: 'Samsonite', src: '/images/logos/banner/samsonite.png' },
  { name: 'SABIC', src: '/images/logos/banner/sabic.png' },
];

export default function CateringHomepage() {
  const scrollContainer = useRef<HTMLDivElement>(null);
  const { language, toggleLanguage } = useTranslation('home');
  const t = pick(homeTranslations, language);
  
  const [isVisible, setIsVisible] = useState(false);
  const [menus, setMenus] = useState<ApiMenu[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const commonNav = pick(commonTranslations, language).nav;
  const commonA11y = pick(commonTranslations, language).accessibility;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const loadMenus = async () => {
      try {
        setIsLoadingData(true);
        setFetchError(null);
        const menusResult = await menusApi.getMenus({ includeImages: true });
        const nextMenus = (menusResult || []).map((menu) => ({
          ...menu,
          products: menu?.menuProducts ? menu.menuProducts.map((mp) => mp.productId) : menu?.products || [],
        }));
        setMenus(nextMenus);
      } catch (error) {
        console.error('Error loading menus:', error);
        setFetchError(t.errors.menusLoadFailed);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadMenus();
  }, []);

  const router = useRouter();
  const pathname = usePathname();

  const handleOrderClick = (selectedProducts?: number[]) => {
    const query = selectedProducts?.length ? `?products=${selectedProducts.join(',')}` : '';
    router.push(`/order${query}`);
  };
  
  const handlePlanClick = () => {
    router.push('/contact');
  };

  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setIsLoadingData(true);
        setFetchError(null);
        const [fetchedMenus, fetchedProducts] = await Promise.all([
          menusApi.getMenus({ isActive: true, includeImages: true }),
          productsApi.getProducts({ available: true }),
        ]);
        const normalizedMenus = (fetchedMenus || []).map((menu) => ({
          ...menu,
          products: menu?.menuProducts ? menu.menuProducts.map((mp) => mp.productId) : menu?.products || [],
        }));
        setMenus(normalizedMenus);
        setProducts(fetchedProducts || []);
      } catch (error) {
        console.error('Failed to fetch menus/products', error);
        setFetchError(t.errors.menusLoadFailed);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadMenuData();
  }, []);

    const quickMenuIcons = [Star, Heart, Shield, Crown];
  const quickMenuCategoryMeta = [
    { gradient: 'from-[#A69256]/25 via-white to-[#F2F2F2]', countEn: '12 dishes', countDe: '12 Gerichte' },
    { gradient: 'from-[#404040]/15 via-white to-[#F2F2F2]', countEn: '8 menus', countDe: '8 Menus' },
    { gradient: 'from-[#A6A6A6]/18 via-white to-[#F2F2F2]', countEn: '15 options', countDe: '15 Optionen' },
    { gradient: 'from-[#A69256]/15 via-white to-[#F2F2F2]', countEn: '10 highlights', countDe: '10 Highlights' },
  ];

  const companyValues = [
    { icon: Target, ...t.company.values.mission },
    { icon: Eye, ...t.company.values.vision },
    { icon: Award, ...t.company.values.excellence },
    { icon: Users, ...t.company.values.community },
  ];

  const journeyIcons = [Flag, Award, Globe, Zap];
  const journeyMilestones = t.journey.milestones.map((milestone, index) => ({
    ...milestone,
    icon: journeyIcons[index] ?? Flag,
  }));

  const showcaseItems = (products.length
      ? products.slice(0, 3).map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price !== undefined ? `${product.price.toFixed(2)} EUR` : undefined,
        description: product.description,
        image: product.image,
        popular: product.popularity ? product.popularity >= 80 : false,
        featured: product.popularity ? product.popularity >= 60 : false,
        productIds: [product.id],
      }))
    : t.menuShowcase.items.map((item) => ({
        name: item.name,
        category: item.category,
        price: item.price,
        description: item.description,
        image: item.image,
        popular: item.popular,
        featured: item.featured,
      }))) as Array<{
    id?: number;
    name: string;
    category?: string;
    price?: string;
    description?: string;
    image?: string;
    popular?: boolean;
    featured?: boolean;
    productIds?: number[];
  }>;

  const featuredMenus = (menus.length
    ? menus.slice(0, 3).map((menu) => ({
        id: menu.id,
        name: menu.name,
        desc: menu.description || '',
        price: menu.price !== undefined ? `${menu.price.toFixed(2)} EUR` : undefined,
        productIds: menu.products,
      }))
    : t.menus.items.map((item) => ({
        name: item.name,
        desc: item.desc,
      }))) as Array<{
    id?: number;
    name: string;
    desc?: string;
    price?: string;
    productIds?: number[];
  }>;

  return (
    <div className="min-h-screen bg-[#faf6ef] overflow-x-hidden">
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
        onOrderClick={handleOrderClick}
      />

      {/* Hero Section - Premium Design */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ minHeight: '100svh' }}>
        <div
          className="absolute inset-0 bg-cover bg-center lux-hero-image"
          style={{ backgroundImage: "url('/images/home_image.jpeg')" }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(18,13,10,0.88)_0%,rgba(18,13,10,0.55)_55%,rgba(18,13,10,0.35)_100%)]"></div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#120d0a]/80 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-40 pb-20 sm:pb-28 w-full">
          <div className="grid lg:grid-cols-12 items-center gap-12">
            <div className="lg:col-span-8 text-left">
              <p className={`eyebrow eyebrow-light mb-6 ${isVisible ? 'animate-fade-in-down lux-type lux-type-run lux-type-caret' : 'opacity-0'}`}>
                {L(language, 'Mehr als Geschmack', 'Beyond taste')}
              </p>

              <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                <SplitText
                  as="h1"
                  immediate
                  delay={150}
                  className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5rem] max-w-3xl font-normal text-white mb-7 leading-[1.05] tracking-tight font-display"
                  text={t.hero.title}
                />
              </div>

              <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                 <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-10 font-light max-w-xl leading-relaxed">
                   {t.hero.subtitle}
                 </p>
              </div>

              <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Magnetic>
                    <button
                      onClick={handlePlanClick}
                      className="group btn-accent btn-shimmer"
                    >
                      {t.hero.cta}
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </Magnetic>

                  <button
                    onClick={() => handleOrderClick()}
                    className="btn-outline-light"
                  >
                    {commonNav.order}
                  </button>
                </div>
              </div>

              <ul className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/15 pt-6 text-[11px] font-medium uppercase tracking-[0.22em] text-white/70">
                <li className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]"></span>
                  {L(language, 'Kuratierte Menus', 'Crafted menus')}
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]"></span>
                  {L(language, 'Nahtlose Lieferung', 'Seamless delivery')}
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]"></span>
                  {L(language, 'Premium-Service', 'Premium service')}
                </li>
              </ul>
            </div>
          </div>
        </div>

      </section>

      


      {/* Brand Banner */}
      <section className="border-b border-black/10 bg-[#faf6ef] py-14 sm:py-16 lux-reveal" data-lux-delay="60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-9 text-center text-[13px] font-medium tracking-[0.04em] text-black/55">
            {t.brandBanner.title}
          </p>

          <div className="lux-marquee" style={{ ['--lux-marquee-duration' as any]: '52s' }} aria-label={t.brandBanner.title}>
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


      <MenuShowcaseHorizontal 
        limit={6}
        showViewAll={true}
        title={t.menus?.title || "Our Featured Menus"}
        description={t.menus?.description || "Discover our carefully crafted culinary experiences"}
        language={language}
      />


      {/* Company Values Section (black/white) */}
    
      

      {/* Services Section */}
      <section id="service-formats" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 section-surface-espresso border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="eyebrow mb-4">{t.quickMenu.title}</p>
            <SplitText as="h2" className="block text-4xl lg:text-5xl font-medium tracking-tight text-white mb-4 font-display" text={t.services.title} />
            <p className="text-white/70 max-w-2xl mx-auto text-lg">{t.services.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 items-start justify-items-center gap-x-10 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
            {t.services.items.map((service, index) => {
              const folder = SERVICE_FOLDERS[index % SERVICE_FOLDERS.length];
              const files: FolderFile[] = folder.files.map((file) => ({
                name: language === 'DE' ? file.de : file.en,
                image: file.image,
              }));
              return (
                <div key={service.title} className="flex w-full max-w-[340px] flex-col items-center">
                  <GlassFolder
                    label={service.title}
                    meta={L(language, `${files.length} Fotos`, `${files.length} photos`)}
                    tone="dark"
                    image={folder.cover}
                    action="none"
                    files={files}
                    appearDelay={index * 140}
                  />
                  <p className="mt-8 text-center leading-relaxed text-white/70">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Menus Section */}
      <section id="menu-snapshots" className="relative overflow-hidden bg-[#17120e] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-[#A69256]/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-14 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="eyebrow mb-4 !text-[#d6c27d]">MENUS</p>
              <SplitText
                as="h2"
                className="block font-display text-4xl font-medium tracking-tight text-white lg:text-6xl"
                text={t.menus.title}
              />
            </div>
            <div className="lg:col-span-5">
              <p className="text-lg leading-relaxed text-white/70">{t.menus.description}</p>
              <a
                href="/menus"
                className="mt-6 inline-flex items-center gap-2 border-b border-[#A69256] pb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d6c27d] transition-all hover:gap-3"
              >
                {t.menus.cta}
                <ChevronRight size={16} />
              </a>
            </div>
          </div>

          {isLoadingData && !menus.length && (
            <LoadingSpinner className="mb-8" label={L(language, 'Menüs werden geladen...', 'Loading menus...')} />
          )}

          <div className="grid gap-6 md:grid-cols-3">
            {featuredMenus.map((menu, index) => {
              const image = SNAPSHOT_IMAGES[index % SNAPSHOT_IMAGES.length];
              return (
                <ImageReveal key={menu.id ?? index} from="bottom">
                  <button
                    type="button"
                    onClick={() => handleOrderClick(menu.productIds)}
                    className="group relative block h-[26rem] w-full overflow-hidden rounded-[22px] border border-white/10 text-left shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#A69256]/60"
                  >
                    <img
                      src={image}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-110"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#120d0a] via-[#120d0a]/55 to-[#120d0a]/5" />
                    <span className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#120d0a]/70 to-transparent" />
                    <span className="absolute left-6 top-5 font-display text-5xl text-white/60 transition-colors group-hover:text-[#d6c27d]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {menu.price && (
                      <span className="absolute right-5 top-6 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
                        {menu.price}
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 block p-7">
                      <span className="block font-display text-2xl text-white sm:text-[1.7rem]">{menu.name}</span>
                      <span className="mt-2 block text-sm leading-relaxed text-white/75">{menu.desc}</span>
                      <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d6c27d] transition-all group-hover:gap-3">
                        {t.menus.cta}
                        <ChevronRight size={16} />
                      </span>
                    </span>
                  </button>
                </ImageReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lookbook + Reels */}
      <section id="lookbook" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 section-surface-sand border-t border-black/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-12">
            <div className="max-w-2xl">
              <p className="eyebrow mb-4">
                {L(language, 'LOOKBOOK', 'LOOKBOOK')}
              </p>
              <h2 className="text-4xl lg:text-5xl font-medium tracking-tight text-black mb-4 font-display lux-reveal lux-type" data-lux-delay="60">
                {L(language, 'Signature Moments', 'Signature moments')}
              </h2>
              <p className="text-black/70 text-lg lux-reveal lux-type" data-lux-delay="120">
                {L(language, 'Ein Einblick in Private Dining, Brand Launches und unvergessliche Feiern.', 'A glimpse into private dining, brand launches, and unforgettable celebrations.')}
              </p>
            </div>

            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-black/90 transition-colors"
            >
              {L(language, 'Reels ansehen', 'Watch reels')}
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <ImageReveal className="lg:col-span-7" from="left">
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="group relative block overflow-hidden rounded-3xl border border-black/10 bg-black aspect-[16/10] shadow-[0_24px_70px_rgba(0,0,0,0.12)]"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 will-change-transform group-hover:scale-[1.04]"
                style={{ backgroundImage: "url('/images/exclusive-dining.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <div className="absolute left-6 bottom-6 right-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                  {L(language, 'Fingerfood', 'Finger food')}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white font-display">
                  {L(language, 'Kleine Bissen, groß inszeniert.', 'Small bites, staged with care.')}
                </h3>
              </div>
              <div className="absolute top-6 right-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                <PlayCircle size={16} />
                {L(language, 'Ansehen', 'View')}
              </div>
            </a>
            </ImageReveal>

            <div className="lg:col-span-5 grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
                {[
                {
                  image: '/images/restaurant-interior.jpg',
                  label: L(language, 'Grazing Tables', 'Grazing tables'),
                  title: L(language, 'Großzügig angerichtet, ohne Aufwand für Sie.', 'Generously laid out, effortless for you.'),
                },
                {
                  image: '/images/community-feast.jpg',
                  label: L(language, 'Desserts', 'Desserts'),
                  title: L(language, 'Süßer Abschluss für jedes Fest.', 'A sweet finish for every celebration.'),
                },
              ].map((card) => (
                <ImageReveal key={card.image} from="right">
                <a
                  href={INSTAGRAM_PROFILE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block overflow-hidden rounded-3xl border border-black/10 bg-black aspect-[16/12] shadow-[0_18px_55px_rgba(0,0,0,0.10)]"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 will-change-transform group-hover:scale-[1.04]"
                    style={{ backgroundImage: `url('${card.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                  <div className="absolute left-6 bottom-6 right-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">{card.label}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white font-display">{card.title}</h3>
                  </div>
                </a>
                </ImageReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Concierge CTA */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8 section-surface-espresso border-t border-white/10">
        <Aurora />
        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <p className="eyebrow mb-4">
              {L(language, 'CONCIERGE', 'CONCIERGE')}
            </p>
            <SplitText
              as="h2"
              className="block text-4xl lg:text-5xl font-medium tracking-tight text-white mb-5 font-display"
              text={L(language, 'Planung, perfekt umgesetzt.', 'Planning, perfected.')}
            />
            <p className="text-white/75 text-lg leading-relaxed lux-reveal lux-type" data-lux-delay="120">
              {L(language, 'Von der Menukuration bis zum Service vor Ort: Wir führen Ihr Event mit ruhiger Präzision — elegant, zuverlässig, diskret.', 'From menu curation to on-site service, we guide your event with calm precision — elegant, reliable, discreet.')}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Magnetic>
                <button
                  type="button"
                  onClick={() => router.push('/order')}
                  className="group btn-accent btn-shimmer"
                >
                  {L(language, 'Jetzt bestellen', 'Order now')}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </Magnetic>
              <button
                type="button"
                onClick={() => router.push('/contact')}
                className="btn-outline-light"
              >
                {L(language, 'Angebot anfragen', 'Request a quote')}
                <ArrowUpRight size={18} className="text-white/80" />
              </button>
            </div>

            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: L(language, 'Antwort in 24h', '24h response'),
                  desc: L(language, 'schnell, verbindlich, persönlich.', 'Fast, reliable, personal.'),
                },
                {
                  title: L(language, 'White Glove Service', 'White Glove Service'),
                  desc: L(language, 'Team, Setup, Ablauf — aus einer Hand.', 'Team, setup, flow — end to end.'),
                },
                {
                  title: L(language, 'Saisonale Menus', 'Seasonal menus'),
                  desc: L(language, 'modern, fein, mit Handschrift.', 'Modern, refined, signature-led.'),
                },
                {
                  title: L(language, 'Transparente Angebote', 'Clear proposals'),
                  desc: L(language, 'Details, Kosten, Timing — sauber erklärt.', 'Details, cost, timing — explained.'),
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-white/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div
                className="aspect-[4/5] bg-cover bg-center"
                style={{ backgroundImage: "url('/images/exclusive-dining.jpg')" }}
              />
              <div className="absolute left-8 bottom-8 right-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                  {L(language, 'Haute Catering', 'Haute catering')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white font-display">
                  {L(language, 'Moderne Technik, großzügige hospitality.', 'Modern technique, generous hospitality.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter footer={pick(commonTranslations, language).footer} nav={commonNav} />
    </div>
  );
}

