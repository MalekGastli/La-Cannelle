"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, Phone, Mail, MapPin, Briefcase, Users, Heart, Building2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { servicesTranslations } from '@/lib/translations/services';
import { commonTranslations } from '@/lib/translations/common';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';

export default function ServicesPage() {
  const translation = useTranslation('services');
  const t = translation.t as typeof servicesTranslations.EN;
  const { language, toggleLanguage } = translation;
  const commonNav = commonTranslations[language].nav;
  const commonA11y = commonTranslations[language].accessibility;
  const [isVisible, setIsVisible] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const handleOrderClick = () => {
    router.push('/order');
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf6ef] overflow-x-hidden">
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
      <section className="pt-40 pb-24 px-6 lg:px-8 bg-[#faf6ef] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#A69256]/12 via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <p className="eyebrow mb-4">{t.hero.title}</p>
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

      {/* Office Catering - Premium Layout */}
      <section id="office-catering" className="py-24 px-6 lg:px-8 bg-white lux-reveal" data-lux-delay="40">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-left' : 'opacity-0'}`}>
              <div className="w-16 h-16 bg-[#A69256]/15 rounded-2xl flex items-center justify-center mb-6">
                <Briefcase className="text-[#7a6a32]" size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4 font-display">{t.officeCatering.title}</h2>
              <p className="text-lg text-[#7a6a32] font-medium mb-6">{t.officeCatering.subtitle}</p>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">{t.officeCatering.description}</p>
              
              {/* Image */}
              <div className="rounded-3xl overflow-hidden shadow-lg">
                <img
                  src="/images/services/office.jpg"
                  alt={t.officeCatering.title}
                  className="w-full h-80 object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            
            <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'animate-fade-in-right' : 'opacity-0'}`}>
              <div className="bg-[#f3ece1] p-10 rounded-3xl border border-gray-200">
                <h3 className="text-xl font-medium text-gray-900 mb-6 font-display">{t.labels.whatWeOffer}</h3>
                <ul className="space-y-4">
                  {t.officeCatering.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-4 group">
                      <div className="w-6 h-6 rounded-full bg-[#A69256]/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#A69256]/25 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-[#A69256]"></div>
                      </div>
                      <span className="text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Catering - Premium Layout */}
      <section id="event-catering" className="py-24 px-6 lg:px-8 bg-[#f3ece1] lux-reveal" data-lux-delay="40">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`order-2 lg:order-1 transition-all duration-1000 ${isVisible ? 'animate-fade-in-left' : 'opacity-0'}`}>
              <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-medium text-gray-900 mb-6 font-display">{t.labels.whatWeOffer}</h3>
                <ul className="space-y-4">
                  {t.eventCatering.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-4 group">
                      <div className="w-6 h-6 rounded-full bg-[#A69256]/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#A69256]/25 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-[#A69256]"></div>
                      </div>
                      <span className="text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className={`order-1 lg:order-2 transition-all duration-1000 delay-200 ${isVisible ? 'animate-fade-in-right' : 'opacity-0'}`}>
              <div className="w-16 h-16 bg-[#A69256]/15 rounded-2xl flex items-center justify-center mb-6">
                <Users className="text-[#7a6a32]" size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4 font-display">{t.eventCatering.title}</h2>
              <p className="text-lg text-[#7a6a32] font-medium mb-6">{t.eventCatering.subtitle}</p>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">{t.eventCatering.description}</p>
              
              {/* Image */}
              <div className="rounded-3xl overflow-hidden shadow-lg">
                <img
                  src="/images/services/event.jpg"
                  alt={t.eventCatering.title}
                  className="w-full h-80 object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Weddings - Premium Layout */}
      <section id="weddings" className="py-24 px-6 lg:px-8 bg-white lux-reveal" data-lux-delay="40">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-left' : 'opacity-0'}`}>
              <div className="w-16 h-16 bg-[#A69256]/15 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="text-[#7a6a32]" size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4 font-display">{t.weddings.title}</h2>
              <p className="text-lg text-[#7a6a32] font-medium mb-6">{t.weddings.subtitle}</p>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">{t.weddings.description}</p>
              
              {/* Image */}
              <div className="rounded-3xl overflow-hidden shadow-lg">
                <img
                  src="/images/services/weddings.jpg"
                  alt={t.weddings.title}
                  className="w-full h-80 object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            
            <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'animate-fade-in-right' : 'opacity-0'}`}>
              <div className="bg-gradient-to-br from-[#F2F2F2] to-[#A69256]/10 p-10 rounded-3xl border border-[#A6A6A6]/40">
                <h3 className="text-xl font-medium text-gray-900 mb-6 font-display">{t.labels.whatWeOffer}</h3>
                <ul className="space-y-4">
                  {t.weddings.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-4 group">
                      <div className="w-6 h-6 rounded-full bg-[#A69256]/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#A69256]/15 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-[#A69256]"></div>
                      </div>
                      <span className="text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Events - Premium Layout */}
      <section id="corporate-events" className="py-24 px-6 lg:px-8 bg-[#faf6ef] lux-reveal" data-lux-delay="40">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`order-2 lg:order-1 transition-all duration-1000 ${isVisible ? 'animate-fade-in-left' : 'opacity-0'}`}>
              <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-medium text-gray-900 mb-6 font-display">{t.labels.whatWeOffer}</h3>
                <ul className="space-y-4">
                  {t.corporateEvents.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-4 group">
                      <div className="w-6 h-6 rounded-full bg-[#A69256]/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#A69256]/25 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-[#A69256]"></div>
                      </div>
                      <span className="text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className={`order-1 lg:order-2 transition-all duration-1000 delay-200 ${isVisible ? 'animate-fade-in-right' : 'opacity-0'}`}>
              <div className="w-16 h-16 bg-[#A69256]/15 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="text-[#7a6a32]" size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4 font-display">{t.corporateEvents.title}</h2>
              <p className="text-lg text-[#7a6a32] font-medium mb-6">{t.corporateEvents.subtitle}</p>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">{t.corporateEvents.description}</p>
              
              {/* Image */}
              <div className="rounded-3xl overflow-hidden shadow-lg">
                <img
                  src="/images/services/corporate.jpg"
                  alt={t.corporateEvents.title}
                  className="w-full h-80 object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Premium */}
      <section className="py-32 px-6 lg:px-8 bg-gradient-to-br from-[#17120e] to-[#241a13] relative overflow-hidden lux-reveal" data-lux-delay="40">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#A69256] via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl lg:text-5xl font-light text-white mb-6 font-display">{t.cta.title}</h2>
            <p className="text-xl text-gray-300 mb-10 font-light">{t.cta.subtitle}</p>
            <button
              onClick={() => handleOrderClick()}
              className="group inline-flex items-center gap-3 px-10 py-4 bg-[#A69256] text-[#120d0a] rounded-full text-base font-semibold transition-all duration-500 hover:bg-[#0D0D0D] hover:shadow-2xl hover:scale-105"
            >
              {t.cta.button}
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <SiteFooter footer={commonTranslations[language].footer} nav={commonNav} />
    </div>
  );
}
