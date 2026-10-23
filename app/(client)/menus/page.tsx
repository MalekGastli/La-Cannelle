"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, Mail, MapPin, Check, ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { menusApi, type Menu as ApiMenu } from '@/lib/api/menus';
import { productsApi, type Product as ApiProduct } from '@/lib/api/products';
import { commonTranslations } from '@/lib/translations/common';
import { menusTranslations } from '@/lib/translations/menus';
import { useTranslation } from '@/lib/hooks/useTranslation';
import LoadingSpinner from '@/components/LoadingSpinner';
import SiteHeader from '@/components/site/SiteHeader';
import { INSTAGRAM_PROFILE_URL } from '@/lib/config/social';

function BodyPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

type MenuHighlightItem = {
  id: number;
  name: string;
  description?: string;
  image?: string;
};

type MenuHighlight = ApiMenu & {
  items: MenuHighlightItem[];
  coverImage: string;
};

export default function MenusPage() {
  const { language, toggleLanguage } = useTranslation('menus');
  const [isVisible, setIsVisible] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuHighlight | null>(null);
  const [isMenuModalClosing, setIsMenuModalClosing] = useState(false);
  const [menus, setMenus] = useState<ApiMenu[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const commonNav = commonTranslations[language].nav;
  const commonFooter = commonTranslations[language].footer;
  const commonA11y = commonTranslations[language].accessibility;
  const t = menusTranslations[language];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const router = useRouter();
  const pathname = usePathname();

  const handleOrderClick = () => {
    router.push('/order');
  };

  useEffect(() => {
    if (!selectedMenu) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedMenu]);

  const fallbackMenuItems = [
    {
      id: 1,
      name: 'Truffle-infused Wild Mushroom Risotto',
      category: 'corporate',
      description: 'Arborio rice with seasonal wild mushrooms, white truffle oil, and Parmigiano-Reggiano',
      price: 24,
      organic: true,
      preparation: '25 min',
      image: '/images/risotto.jpg',
      popularity: 95,
      dietary: ['Vegetarian', 'Gluten-Free'],
      chefNote: 'Our signature dish featuring imported Italian truffles'
    },
    {
      id: 2,
      name: 'Herb-crusted Rack of Lamb',
      category: 'wedding',
      description: 'New Zealand lamb with rosemary crust, mint jus, and roasted root vegetables',
      price: 38,
      preparation: '35 min',
      image: '/images/lamb.jpg',
      popularity: 88,
      dietary: ['Gluten-Free'],
      chefNote: 'Premium New Zealand lamb with fresh garden herbs'
    },
    {
      id: 3,
      name: 'Seared Scallops with Citrus Beurre Blanc',
      category: 'cocktail',
      description: 'Day boat scallops with orange reduction, micro greens, and crispy prosciutto',
      price: 28,
      organic: true,
      preparation: '20 min',
      image: '/images/scallops.jpg',
      popularity: 92,
      dietary: ['Gluten-Free'],
      chefNote: 'Fresh Atlantic scallops with citrus emulsion'
    },
    {
      id: 4,
      name: 'Heirloom Tomato Burrata Salad',
      category: 'seasonal',
      description: 'Colorful heirloom tomatoes with fresh burrata, basil oil, and balsamic reduction',
      price: 18,
      organic: true,
      preparation: '15 min',
      image: '/images/salad.jpg',
      popularity: 85,
      dietary: ['Vegetarian', 'Gluten-Free'],
      chefNote: 'Farm-fresh heirloom tomatoes with Italian burrata'
    },
    {
      id: 5,
      name: 'Beef Wellington Canapés',
      category: 'premium',
      description: 'Mini beef wellington with mushroom duxelles and puff pastry',
      price: 22,
      preparation: '30 min',
      image: '/images/beef-wellington.jpg',
      popularity: 90,
      dietary: [],
      chefNote: 'Elegant bite-sized version of the classic'
    },
    {
      id: 6,
      name: 'Chocolate Fondant with Raspberry Coulis',
      category: 'wedding',
      description: 'Warm chocolate cake with liquid center and fresh raspberry sauce',
      price: 16,
      preparation: '18 min',
      image: '/images/fondant.jpg',
      popularity: 94,
      dietary: ['Vegetarian'],
      chefNote: 'Decadent chocolate dessert with seasonal berries'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        setFetchError(null);
        const [menusResult, productsResult] = await Promise.allSettled([
          menusApi.getMenus({ includeImages: true }),
          productsApi.getProducts({ available: true }),
        ]);

        let nextMenus: ApiMenu[] = [];
        let nextProducts: ApiProduct[] = [];
        const hasMenuError = menusResult.status === 'rejected';
        const hasProductsError = productsResult.status === 'rejected';

        if (menusResult.status === 'fulfilled') {
          nextMenus = (menusResult.value || []).map((menu) => ({
            ...menu,
            products: menu?.menuProducts ? menu.menuProducts.map((mp) => mp.productId) : menu?.products || [],
          }));
        }

        if (productsResult.status === 'fulfilled') {
          nextProducts = productsResult.value || [];
        }

        if (hasMenuError && hasProductsError) {
          setFetchError(t.labels.menusLoadFailed);
        }

        setMenus(nextMenus);
        setProducts(nextProducts);
      } catch {
        setFetchError(t.labels.menusLoadFailed);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [language]);

  const openMenuDetails = (menu: MenuHighlight) => {
    setSelectedMenu(menu);
    setIsMenuModalClosing(false);
  };

  const closeMenuDetails = () => {
    if (!selectedMenu) return;
    setIsMenuModalClosing(true);
    setTimeout(() => {
      setSelectedMenu(null);
      setIsMenuModalClosing(false);
    }, 200);
  };

  const menuHighlights = useMemo(() => {
    const toHighlightItem = (
      item: { id: number; name: string; description?: string; image?: string } | null | undefined
    ): MenuHighlightItem | null => {
      if (!item || item.id == null || !item.name) {
        return null;
      }
      const name = item.name;
      const description = item.description;
      return {
        id: item.id,
        name,
        description,
        image: item.image,
      };
    };

    if (menus.length) {
      const productMap = new Map(products.map((product) => [product.id, product]));
      return (menus || []).map((menu) => {
        const localizedName = menu.name;
        const localizedDescription = menu.description;
        let items: MenuHighlightItem[] = [];
        if (menu.menuProducts && menu.menuProducts.length) {
          items = menu.menuProducts
            .map((menuProduct: any) => toHighlightItem(menuProduct.product || productMap.get(menuProduct.productId)))
            .filter(Boolean) as MenuHighlightItem[];
        } else if (menu.products && menu.products.length) {
          items = menu.products
            .map((id) => toHighlightItem(productMap.get(id)))
            .filter(Boolean) as MenuHighlightItem[];
        }
        const coverImage = menu.image
          || items.find((item) => item.image)?.image
          || '/images/home_image.jpeg';
        return {
          ...menu,
          name: localizedName,
          description: localizedDescription,
          items,
          coverImage
        };
      });
    }

    const sourceItems = products.length
      ? products.map((product) => {
          const rawCategory = (product.category || '').toString().toLowerCase().replace(/[^a-z]/g, '');
          const categoryMap: Record<string, string> = {
            starter: 'starters',
            starters: 'starters',
            main: 'mains',
            mains: 'mains',
            side: 'sides',
            sides: 'sides',
            dessert: 'desserts',
            desserts: 'desserts',
            beverage: 'drinks',
            beverages: 'drinks',
            drink: 'drinks',
            drinks: 'drinks',
          };
          return {
            ...product,
            category: categoryMap[rawCategory] || 'general',
          };
        })
      : fallbackMenuItems;

    const groupedItems = sourceItems.reduce((acc, item) => {
      const category = item.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, Array<{ id: number; name: string; description?: string; image?: string; category?: string }>>);

    return Object.entries(groupedItems).map(([category, items], index) => {
      const coverImage = items.find((item) => item.image)?.image || '/images/home_image.jpeg';
      const description = items.length
        ? items.slice(0, 3).map((item: any) => (
          item.name
        )).join(', ')
        : '';
      return {
        id: -(index + 1),
        name: t.categories[category] || category,
        description,
        category,
        type: category,
        isActive: true,
        items: items
          .map((item) => toHighlightItem(item))
          .filter(Boolean) as MenuHighlightItem[],
        coverImage
      };
    });
  }, [menus, products, language]);

  const MenuHighlightCard = ({ menu }: { menu: MenuHighlight }) => {
    const priceLabel = typeof menu.price === 'number' ? menu.price.toFixed(2) : '';
    const steps = Array.isArray(menu.steps) ? menu.steps : [];
    const dishesAvailable = Array.isArray(menu.items)
      ? menu.items.length
      : Array.isArray(menu.products)
      ? menu.products.length
      : Array.isArray(menu.menuProducts)
      ? menu.menuProducts.length
      : 0;

    const normalizeCategoryValue = (value?: string) => (
      value ? value.toLowerCase().replace(/[^a-z]/g, '') : ''
    );

    const normalizeMenuStepKey = (label?: string) => {
      if (!label) return '';
      const normalized = normalizeCategoryValue(label);
      const aliases: Record<string, string> = {
        starter: 'starter',
        starters: 'starter',
        main: 'main',
        mains: 'main',
        entree: 'main',
        side: 'side',
        sides: 'side',
        dessert: 'dessert',
        desserts: 'dessert',
        drink: 'beverage',
        drinks: 'beverage',
        beverage: 'beverage',
        beverages: 'beverage'
      };
      return aliases[normalized] || normalized;
    };

    const stepLabelFor = (label?: string) => {
      const key = normalizeMenuStepKey(label);
      if (!key) return label || '';
      const labels = language === 'DE'
        ? {
            fingerfood: 'Fingerfood',
            starter: 'Vorspeisen',
            main: 'Hauptgänge',
            side: 'Beilagen',
            dessert: 'Desserts',
            beverage: 'Getränke',
            canape: 'Canape',
            appetizer: 'Vorspeise',
            salad: 'Salat',
            soup: 'Suppe',
            pasta: 'Pasta',
            seafood: 'Meeresfrüchte',
            meat: 'Fleisch',
            vegetarian: 'Vegetarisch',
            vegan: 'Vegan',
            glutenfree: 'Glutenfrei',
            dairyfree: 'Laktosefrei',
            spicy: 'Scharf',
            signature: 'Signature',
            seasonal: 'Saisonal',
            kidfriendly: 'Kinderfreundlich',
            chefspecial: 'Chef-Special',
            tapas: 'Tapas',
            bbq: 'BBQ',
            breakfast: 'Frühstück',
            brunch: 'Brunch'
          }
        : {
            fingerfood: 'Finger Food',
            starter: 'Starters',
            main: 'Mains',
            side: 'Sides',
            dessert: 'Desserts',
            beverage: 'Drinks',
            canape: 'Canape',
            appetizer: 'Appetizer',
            salad: 'Salad',
            soup: 'Soup',
            pasta: 'Pasta',
            seafood: 'Seafood',
            meat: 'Meat',
            vegetarian: 'Vegetarian',
            vegan: 'Vegan',
            glutenfree: 'Gluten-Free',
            dairyfree: 'Dairy-Free',
            spicy: 'Spicy',
            signature: 'Signature',
            seasonal: 'Seasonal',
            kidfriendly: 'Kid-Friendly',
            chefspecial: 'Chef-Special',
            tapas: 'Tapas',
            bbq: 'BBQ',
            breakfast: 'Breakfast',
            brunch: 'Brunch'
          };
      return (labels as any)[key] || (label || '');
    };

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => openMenuDetails(menu)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openMenuDetails(menu);
          }
        }}
        aria-label={`${t.menuHighlights.viewDetails}: ${menu.name}`}
        className="group relative h-full min-h-[420px] overflow-hidden rounded-2xl bg-black text-left shadow-[0_20px_60px_rgba(0,0,0,0.22)] ring-1 ring-black/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(0,0,0,0.32)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] cursor-pointer"
      >
        <div className="relative h-[420px] bg-black overflow-hidden">
          <img 
            src={menu.coverImage} 
            alt={menu.name} 
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10"></div>
          <div className="absolute inset-x-0 bottom-0 p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
              {language === 'DE' ? 'MENÜ' : 'MENU'}
            </p>
            <h3 className="mt-2 text-3xl font-semibold text-white font-display leading-tight">
              {menu.name}
            </h3>

            <div className="mt-4 max-h-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:max-h-72">
              <p className="text-sm leading-relaxed text-white/80 line-clamp-3">{menu.description || ''}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {steps.slice(0, 2).map((step: any, index: number) => (
                  <span
                    key={`${menu.id}-step-chip-${index}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85"
                  >
                    <Check size={14} className="text-white/70" />
                    {step.included} {stepLabelFor(step.label)}
                  </span>
                ))}
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                  <Check size={14} className="text-white/70" />
                  {dishesAvailable} {t.labels.dishesAvailable}
                </span>
              </div>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  {priceLabel && <div className="text-2xl font-semibold text-white">€{priceLabel}</div>}
                  {priceLabel && <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/60">{t.labels.exclVat}</div>}
                  {menu.minPeople && <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/70">{t.labels.minPeople(menu.minPeople)}</div>}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-white/10 transition-colors">
                  {t.labels.selectFood}
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hidden flex-1 flex-col p-8">
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-2xl font-medium font-display text-gray-900 mb-2">{menu.name}</h3>
              <p className="line-clamp-2 text-sm text-gray-600 leading-relaxed">{menu.description || ''}</p>
            </div>
            
            <div className="space-y-3 text-sm text-gray-700">
              {steps.map((step: any, index: number) => (
                <div key={`${menu.id}-step-${index}`} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-green-600" />
                  </div>
                  <span className="font-medium">{step.included} {stepLabelFor(step.label)}</span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#A69256]/15 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-[#A69256]" />
                </div>
                <span className="font-medium">
                  {dishesAvailable} {t.labels.dishesAvailable}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-6 border-t border-gray-200 space-y-3">
            {priceLabel && (
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  €{priceLabel}
                </div>
                <div className="text-xs text-gray-500 mt-1">{t.labels.exclVat}</div>
              </div>
            )}
            {menu.minPeople && (
              <div className="text-sm text-gray-700">
                {t.labels.minPeople(menu.minPeople)}
              </div>
            )}
            
            <button className="w-full rounded-xl bg-[#A69256] hover:bg-[#0D0D0D] px-6 py-3 text-center text-sm font-semibold text-[#F2F2F2] transition-colors duration-300 group-hover:shadow-md">
              {t.labels.selectFood}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MenuDetailsModal = () => {
    const isOpen = !!selectedMenu;
    const items = selectedMenu?.items ?? [];
    const priceLabel = selectedMenu && typeof selectedMenu.price === 'number'
      ? selectedMenu.price.toFixed(2)
      : '';

    return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/45 supports-[backdrop-filter]:bg-black/35 backdrop-blur-md transition-opacity duration-300 ${isOpen && !isMenuModalClosing ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeMenuDetails}
        />
        <div
          className={`relative bg-gradient-to-b from-white/85 via-white/80 to-white/75 supports-[backdrop-filter]:bg-white/70 backdrop-blur-xl border border-[#A69256]/25 ring-1 ring-black/5 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.20),0_10px_30px_rgba(166,146,86,0.12)] transition-all duration-300 transform ${isOpen && !isMenuModalClosing ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        >
          <div
            className="relative h-80 bg-cover bg-center"
            style={{ backgroundImage: `url('${selectedMenu?.coverImage || '/images/home_image.jpeg'}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                closeMenuDetails();
              }}
              className="absolute top-6 right-6 z-10 bg-white/60 backdrop-blur-sm text-[#404040]/70 border border-black/10 hover:bg-white/80 hover:text-[#404040] hover:border-[#A69256]/25 rounded-full p-3 shadow-lg transition-all duration-200"
              aria-label="Close menu details"
            >
              <X size={20} />
            </button>
            <div className="relative h-full flex flex-col justify-end p-8 text-white">
              <h3 className="text-4xl lg:text-5xl font-light font-display mb-3">
                {selectedMenu?.name}
              </h3>
              {priceLabel && (
                <p className="text-lg font-medium text-[#A69256]">
                  {t.menuHighlights.priceLabel} €{priceLabel}
                </p>
              )}
            </div>
          </div>
          
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-320px)]">
            {selectedMenu?.description && (
              <p className="text-gray-700 leading-relaxed mb-8 text-lg">
                {selectedMenu.description}
              </p>
            )}
            
            <div>
              <h4 className="text-xl font-medium text-gray-900 mb-6 font-display">{t.menuHighlights.includes}</h4>
              {items.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-white/60 backdrop-blur-sm border border-black/5 rounded-2xl p-4 hover:border-[#A69256]/25 transition-colors">
                      <img
                        src={item.image || '/images/home_image.jpeg'}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">{t.menuHighlights.noItems}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Open+Sans:wght@300;400;500;600;700&display=swap');
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
        .animate-fade-in-down { animation: fadeInDown 0.8s ease-out; }
        .animate-scale-in { animation: scaleIn 0.6s ease-out; }
        
        body {
          font-family: 'Open Sans', Lora, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: 0.01em;
          line-height: 1.75;
        }
        
        .font-display {
          font-family: 'Playfair Display', Georgia, serif;
          letter-spacing: 0.03em;
        }
        
        .font-elegant {
          font-family: 'Playfair Display', Georgia, serif;
        }
        
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        
        html {
          scroll-behavior: smooth;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <BodyPortal>
        <MenuDetailsModal />
      </BodyPortal>

      <SiteHeader
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

      {/* Hero Section - Premium */}
      <section className="pt-40 pb-24 px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#A69256]/12 via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <p className="text-xs uppercase tracking-[0.3em] text-[#A69256] font-semibold mb-4">Curated Selections</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-6 font-display leading-tight">
              {t.hero.title}
            </h1>
          </div>
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content - Premium Grid */}
      <section className="py-24 px-6 lg:px-8 bg-white lux-reveal" data-lux-delay="40">
        <div className="max-w-7xl mx-auto">
          {fetchError && menuHighlights.length === 0 && (
            <p className="text-center text-red-600 mb-8">{fetchError}</p>
          )}
          {isLoadingData && menuHighlights.length === 0 && (
            <LoadingSpinner className="mb-8" label={t.labels.loadingMenus} />
          )}
          
          <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="text-center mb-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-black/60 mb-3">
                {t.menuHighlights.title}
              </p>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 font-display mb-4">
                {t.menuHighlights.subtitle}
              </h2>
            </div>
            
            {menuHighlights.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">{t.labels.noMenusAvailable}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                {menuHighlights.map((menu) => (
                  <MenuHighlightCard key={menu.id} menu={menu} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-black text-[#F2F2F2] py-20 px-6 lg:px-8 lux-reveal" data-lux-delay="80">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-left' : 'opacity-0'}`}>
              <h3 className="text-2xl font-light mb-4 font-display">La Cannelle</h3>
              <p className="text-[#F2F2F2]/70 text-sm">{commonFooter.brandTagline}</p>
            </div>
            
            <div className={`transition-all duration-1000 delay-100 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <h4 className="font-medium mb-4 text-sm uppercase tracking-wider">{commonFooter.quickLinks}</h4>
              <div className="flex flex-col gap-3">
                <a href="/home" className="text-white hover:text-[#A69256] transition-colors">{t.nav.home}</a>
                <a href="/services" className="text-white hover:text-[#A69256] transition-colors">{t.nav.services}</a>
                <a href="/menus" className="text-white font-semibold">{t.nav.menus}</a>
                <a href="/contact" className="text-white hover:text-[#A69256] transition-colors">{t.nav.contact}</a>
              </div>
            </div>
            
            <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <h4 className="font-medium mb-4 text-sm uppercase tracking-wider">{commonFooter.contact}</h4>
              <div className="flex flex-col gap-3 text-[#F2F2F2]/70">
                <div className="flex items-center gap-3">
                  <Phone size={16} />
                  <span className="text-sm">{commonFooter.contactPhone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} />
                  <span className="text-sm">{commonFooter.contactEmail}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} />
                  <span className="text-sm">{commonFooter.contactAddress}</span>
                </div>
              </div>
            </div>
            
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'animate-fade-in-right' : 'opacity-0'}`}>
              <h4 className="font-medium mb-4 text-sm uppercase tracking-wider">{commonFooter.followUs}</h4>
              <div className="flex flex-col gap-2 text-[#F2F2F2]/70">
                <a href={INSTAGRAM_PROFILE_URL} className="hover:text-[#A69256] transition-colors text-sm">{commonFooter.social.instagram}</a>
                <a href="https://www.tiktok.com/@lacannellecatering" className="hover:text-[#A69256] transition-colors text-sm">{commonFooter.social.tiktok}</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 text-center text-[#F2F2F2]/60 text-sm">
            <p>{commonFooter.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
