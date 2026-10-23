"use client";

import React, { useState, useEffect, useRef } from 'react';
import { L, localeOf, weekdaysOf } from '@/lib/i18n/inline';
import { ChevronRight, Phone, Mail, MapPin, Clock, Send, MessageCircle, Calendar, ArrowUpRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useTranslation, pick } from '@/lib/hooks/useTranslation';
import { commonTranslations } from '@/lib/translations/common';
import { contactTranslations } from '@/lib/translations/contact';
import { LuxurySelect } from '@/components/site/LuxurySelect';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import { ConsentGate } from '@/components/site/ConsentProvider';
import { SplitText } from '@/components/site/Motion';
import { INSTAGRAM_HANDLE_DISPLAY, INSTAGRAM_PROFILE_URL } from '@/lib/config/social';

const normalizeInstagramPermalink = (url: string) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

export default function ContactPage() {
  const { t: rawT, language, toggleLanguage } = useTranslation('contact');

  const t = rawT as typeof contactTranslations.EN;
  const commonNav = pick(commonTranslations, language).nav;
  const commonFooter = pick(commonTranslations, language).footer;
  const commonA11y = pick(commonTranslations, language).accessibility;
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  const instagramPostUrls = (process.env.NEXT_PUBLIC_INSTAGRAM_POST_URLS || '')
    .split(',')
    .map((value) => normalizeInstagramPermalink(value))
    .filter(Boolean);

  const instagramPosts: Array<{
    id: string;
    permalink: string;
    caption?: string;
    media_url?: string;
    timestamp?: number;
  }> = instagramPostUrls.map((permalink, index) => ({
    id: `ig-${index}`,
    permalink,
    caption: '',
    media_url: '',
    timestamp: undefined
  }));
  const hasInstagramPosts = instagramPosts.length > 0;
  const loadingInstagram = false;
  const firstInstagramPost = instagramPosts[0];
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerContainerRef = useRef<HTMLDivElement>(null);
  const eventDateInputRef = useRef<HTMLInputElement>(null);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonthIndex, setCalendarMonthIndex] = useState(() => new Date().getMonth());

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    guests: '',
    message: ''
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const updateFormValue = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    updateFormValue(e.target.name, e.target.value);
  };

  useEffect(() => {
    if (!isDatePickerOpen) return;

    const nextDate = parseDateInputValue(formData.eventDate) || new Date();
    setCalendarYear(nextDate.getFullYear());
    setCalendarMonthIndex(nextDate.getMonth());
  }, [isDatePickerOpen, formData.eventDate]);

  useEffect(() => {
    if (!isDatePickerOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const container = datePickerContainerRef.current;
      if (!container) return;
      if (!container.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsDatePickerOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDatePickerOpen]);

  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateInputValue = (value: string) => {
    if (!value) return null;
    const [yearStr, monthStr, dayStr] = value.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number((dayStr || '').slice(0, 2));
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const isDateInPast = (value: string) => {
    const parsed = parseDateInputValue(value);
    if (!parsed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsed.getTime() < today.getTime();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValue = formData.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      alert(t.alerts.invalidEmail);
      return;
    }
    if (!formData.eventType.trim()) {
      alert(L(language, 'Bitte Veranstaltungstyp wählen.', 'Please select an event type.'));
      return;
    }
    const phoneValue = formData.phone.trim();
    if (phoneValue && !/^\+?[0-9\s-]{7,15}$/.test(phoneValue)) {
      alert(t.alerts.invalidPhone);
      return;
    }
    if (formData.eventDate && isDateInPast(formData.eventDate)) {
      alert(t.contactForm.invalidEventDate);
      return;
    }

    const response = await apiClient.post('/contact', {
      ...formData,
      language
    });
    if (response.error) {
      alert(t.alerts.failedToSend);
      return;
    }
    setFormData({
      name: '',
      email: '',
      phone: '',
      eventType: '',
      eventDate: '',
      guests: '',
      message: ''
    });
    alert(t.success.message);
  };

  const todayDateValue = toDateInputValue(new Date());
  const minSelectableDateValue = todayDateValue;

  const getDaysInMonth = (year: number, monthIndex: number) =>
    new Date(year, monthIndex + 1, 0).getDate();

  const getMondayStartOffset = (year: number, monthIndex: number) => {
    const dayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Sun
    return (dayOfWeek + 6) % 7; // 0 = Mon
  };

  const getMonthLabel = (year: number, monthIndex: number) => {
    const locale = localeOf(language);
    return new Date(year, monthIndex, 1).toLocaleString(locale, { month: 'long', year: 'numeric' });
  };

  const isBeforeMinDate = (value: string) => value < minSelectableDateValue;

  const applyEventDateValue = (nextValue: string) => {
    if (nextValue && isBeforeMinDate(nextValue)) return;
    updateFormValue('eventDate', nextValue);
  };

  const goToPrevMonth = () => {
    setCalendarMonthIndex((prev) => {
      if (prev === 0) {
        setCalendarYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setCalendarMonthIndex((prev) => {
      if (prev === 11) {
        setCalendarYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const monthLabel = getMonthLabel(calendarYear, calendarMonthIndex);
  const datePickerUi = {
    prevMonth: L(language, 'Vorheriger Monat', 'Previous month'),
    nextMonth: L(language, 'Naechster Monat', 'Next month'),
    clear: L(language, 'Löschen', 'Clear'),
    today: L(language, 'Heute', 'Today'),
    weekdayLabels: weekdaysOf(language),
  };
  const eventDateError = formData.eventDate && isDateInPast(formData.eventDate)
    ? t.contactForm.invalidEventDate
    : '';

  const router = useRouter();

  const handleOrderClick = () => {
    router.push('/order');
  };

  return (
    <div className="min-h-screen bg-[#faf6ef] overflow-x-hidden">
      <SiteHeader
        language={language}
        toggleLanguage={toggleLanguage}
        pathname={pathname}
        nav={{
          home: commonNav.home,
          services: commonNav.services,
          menus: commonNav.menus,
          contact: commonNav.contact,
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
            <p className="eyebrow mb-4">{L(language, 'Kontakt aufnehmen', 'Get In Touch')}</p>
            <SplitText as="h1" immediate delay={100} className="block text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-6 font-display leading-tight" text={t.hero.title} />
          </div>
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content - Premium Layout */}
      <section className="py-24 px-6 lg:px-8 bg-white lux-reveal" data-lux-delay="40">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form - Premium Design */}
            <div className="lg:col-span-2">
              <div className={`bg-white rounded-3xl shadow-sm p-10 border border-gray-200 ${
                isVisible ? 'animate-fade-in-left' : 'opacity-0'
              }`}>
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-[#A69256]/15 rounded-2xl flex items-center justify-center">
                    <MessageCircle className="text-[#A69256]" size={24} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-3xl font-light text-[#404040] font-display">
                    {t.contactForm.title}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#404040] mb-2">
                        {t.contactForm.name} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-[#A6A6A6] rounded-xl focus:ring-2 focus:ring-[color:#A69256] focus:border-[color:#A69256] transition-all duration-300 text-[#404040] bg-[#F9F9F9] placeholder:text-[#A6A6A6]"
                        placeholder={t.placeholders.name}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#404040] mb-2">
                        {t.contactForm.email} *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-[#A6A6A6] rounded-xl focus:ring-2 focus:ring-[color:#A69256] focus:border-[color:#A69256] transition-all duration-300 text-[#404040] bg-[#F9F9F9] placeholder:text-[#A6A6A6]"
                        placeholder={t.placeholders.email}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#404040] mb-2">
                        {t.contactForm.phone}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/[^0-9+\s-]/g, '');
                          updateFormValue('phone', sanitized);
                        }}
                        inputMode="tel"
                        pattern="^\\+?[0-9\\s-]{7,15}$"
                        className="w-full px-4 py-3 border border-[#A6A6A6] rounded-xl focus:ring-2 focus:ring-[color:#A69256] focus:border-[color:#A69256] transition-all duration-300 text-[#404040] bg-[#F9F9F9] placeholder:text-[#A6A6A6]"
                        placeholder={t.placeholders.phone}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#404040] mb-2">
                        {t.contactForm.eventType} *
                      </label>
                      <LuxurySelect
                        value={formData.eventType}
                        placeholder={t.contactForm.eventTypePlaceholder}
                        options={t.contactForm.eventTypes.map((type) => ({ value: type, label: type }))}
                        onChange={(value) => updateFormValue('eventType', value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#404040] mb-2">
                        {t.contactForm.eventDate}
                      </label>
                      <div className="relative" ref={datePickerContainerRef}>
                        <input
                          ref={eventDateInputRef}
                          type="text"
                          readOnly
                          name="eventDate"
                          value={formData.eventDate}
                          onClick={() => setIsDatePickerOpen(true)}
                          onFocus={() => setIsDatePickerOpen(true)}
                          className="w-full cursor-pointer px-4 pr-14 py-3 border border-[#A6A6A6] rounded-xl focus:ring-2 focus:ring-[color:#A69256] focus:border-[color:#A69256] transition-all duration-300 text-[#404040] bg-[#F9F9F9] contact-date-input placeholder:text-[#A6A6A6]"
                          placeholder="YYYY-MM-DD"
                          role="combobox"
                          aria-haspopup="dialog"
                          aria-expanded={isDatePickerOpen}
                        />
                        <button
                          type="button"
                          aria-label={t.contactForm.eventDate}
                          onClick={() => {
                            setIsDatePickerOpen((prev) => !prev);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#A6A6A6] bg-white/70 text-[#A69256] shadow-sm hover:bg-white hover:border-[#A69256] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A69256]/40"
                        >
                          <Calendar size={18} />
                        </button>

                        {isDatePickerOpen && (
                          <div className="absolute left-0 top-full z-50 mt-2 w-full max-w-[360px] overflow-hidden rounded-2xl border border-[#A6A6A6]/70 bg-white/80 supports-[backdrop-filter]:bg-white/65 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
                              <button
                                type="button"
                                onClick={goToPrevMonth}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#A6A6A6]/70 bg-white/70 text-[#404040] hover:border-[#A69256] hover:text-[#A69256] transition-colors"
                                aria-label={datePickerUi.prevMonth}
                              >
                                <ChevronRight size={16} className="rotate-180" />
                              </button>
                              <div className="text-sm font-semibold tracking-wide text-[#404040] font-display">
                                {monthLabel}
                              </div>
                              <button
                                type="button"
                                onClick={goToNextMonth}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#A6A6A6]/70 bg-white/70 text-[#404040] hover:border-[#A69256] hover:text-[#A69256] transition-colors"
                                aria-label={datePickerUi.nextMonth}
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>

                            <div className="px-4 py-3">
                              <div className="grid grid-cols-7 gap-1 text-[11px] uppercase tracking-[0.22em] text-[#404040]/70 mb-2">
                                {datePickerUi.weekdayLabels.map((label) => (
                                  <div key={label} className="text-center">{label}</div>
                                ))}
                              </div>

                              <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: getMondayStartOffset(calendarYear, calendarMonthIndex) }).map((_, index) => (
                                  <div key={`blank-${index}`} className="h-10" />
                                ))}

                                {Array.from({ length: getDaysInMonth(calendarYear, calendarMonthIndex) }).map((_, index) => {
                                  const day = index + 1;
                                  const value = toDateInputValue(new Date(calendarYear, calendarMonthIndex, day));
                                  const disabled = isBeforeMinDate(value);
                                  const selected = formData.eventDate === value;

                                  return (
                                    <button
                                      key={value}
                                      type="button"
                                      disabled={disabled}
                                      onClick={() => {
                                        applyEventDateValue(value);
                                        setIsDatePickerOpen(false);
                                      }}
                                      className={`h-10 rounded-xl text-sm font-medium transition-all ${
                                        disabled
                                          ? 'text-[#A6A6A6] cursor-not-allowed'
                                          : selected
                                            ? 'bg-[#7a6a32] text-white shadow-sm'
                                            : 'text-[#404040] hover:bg-[#A69256]/12 hover:text-[#A69256]'
                                      }`}
                                      aria-label={value}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-2 border-t border-black/10 pt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    applyEventDateValue('');
                                    setIsDatePickerOpen(false);
                                  }}
                                  className="px-3 py-2 text-xs font-semibold text-[#404040] rounded-lg hover:bg-black/5 transition-colors"
                                >
                                  {datePickerUi.clear}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    applyEventDateValue(minSelectableDateValue);
                                    setIsDatePickerOpen(false);
                                  }}
                                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#A69256] text-white hover:bg-[#0D0D0D] transition-colors"
                                >
                                  {datePickerUi.today}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {eventDateError && (
                        <p className="mt-2 text-sm text-red-600">{eventDateError}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#404040] mb-2">
                        {t.contactForm.guests}
                      </label>
                      <input
                        type="text"
                        name="guests"
                        value={formData.guests}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/[^0-9]/g, '');
                          updateFormValue('guests', sanitized);
                        }}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full px-4 py-3 border border-[#A6A6A6] rounded-xl focus:ring-2 focus:ring-[color:#A69256] focus:border-[color:#A69256] transition-all duration-300 text-[#404040] bg-[#F9F9F9] placeholder:text-[#A6A6A6]"
                        placeholder={t.placeholders.guests}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#404040] mb-2">
                      {t.contactForm.message} *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-[#A6A6A6] rounded-xl focus:ring-2 focus:ring-[color:#A69256] focus:border-[color:#A69256] transition-all duration-300 resize-none text-[#404040] bg-[#F9F9F9] placeholder:text-[#A6A6A6]"
                      placeholder={t.placeholders.message}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#A69256] text-[#120d0a] py-4 px-8 rounded-xl font-semibold hover:bg-[#0D0D0D] transition-all duration-300 hover:shadow-lg inline-flex items-center justify-center gap-2 group"
                  >
                    <Send size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    {t.contactForm.button}
                  </button>
                  <p className="text-xs leading-relaxed text-gray-600">
                    {L(language, 'Wir verwenden Ihre Angaben ausschließlich, um Ihre Anfrage zu beantworten. Mehr dazu in unserer ', 'We only use your details to answer your enquiry. More in our ')}
                    <a href="/datenschutz" className="underline underline-offset-4 hover:text-[#7a6a32]">
                      {L(language, 'Datenschutzerklärung', 'privacy policy')}
                    </a>
                    .
                  </p>
                </form>
              </div>
            </div>

            {/* Sidebar - Premium Cards */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className={`bg-[#f3ece1] rounded-3xl p-8 border border-gray-200 ${
                isVisible ? 'animate-fade-in-right' : 'opacity-0'
              }`}>
                <h3 className="text-2xl font-light text-gray-900 mb-6 font-display">
                  {t.contactInfo.title}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl hover:shadow-sm transition-all group">
                    <div className="w-10 h-10 bg-[#A69256]/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="text-[#A69256]" size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t.contactInfo.phone}</p>
                      <p className="text-sm text-gray-600">{t.contactInfo.mobile}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl hover:shadow-sm transition-all group">
                    <div className="w-10 h-10 bg-[#A69256]/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="text-[#A69256]" size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{t.contactInfo.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-white rounded-2xl hover:shadow-sm transition-all group">
                    <div className="w-10 h-10 bg-[#A69256]/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="text-[#A69256]" size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t.contactInfo.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-white rounded-2xl hover:shadow-sm transition-all group">
                    <div className="w-10 h-10 bg-[#A69256]/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="text-[#A69256]" size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">{t.contactInfo.hours.title}</p>
                      <p className="text-sm text-gray-600">{t.contactInfo.hours.weekdays}</p>
                      <p className="text-sm text-gray-600">{t.contactInfo.hours.saturday}</p>
                      <p className="text-sm text-gray-600">{t.contactInfo.hours.sunday}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Order CTA */}
              <div className={`bg-gradient-to-br from-[#17120e] to-[#241a13] rounded-3xl p-8 text-white relative overflow-hidden ${
                isVisible ? 'animate-scale-in' : 'opacity-0'
              }`} style={{ animationDelay: '200ms' }}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#A69256] via-transparent to-transparent"></div>
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-light mb-3 font-display">
                    {t.quickOrder.title}
                  </h3>
                  <p className="text-gray-300 mb-6 font-light">
                    {t.quickOrder.subtitle}
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/order')}
                    className="w-full bg-[#A69256] text-[#120d0a] py-3 px-6 rounded-xl font-semibold hover:bg-[#0D0D0D] transition-all duration-300 hover:shadow-lg inline-flex items-center justify-center gap-2 group"
                  >
                    {t.quickOrder.button}
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Instagram: real photography and a plain link, no invented follower stats */}
              <div className="rounded-3xl border border-gray-200 bg-white p-8">
                <h3 className="font-display text-xl font-light text-gray-900">{t.social.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{INSTAGRAM_HANDLE_DISPLAY}</p>

                {hasInstagramPosts && firstInstagramPost ? (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-[#f3ece1]">
                    <ConsentGate service="Instagram" provider="Meta"><iframe
                      title={`Instagram post ${firstInstagramPost.permalink}`}
                      src={`${firstInstagramPost.permalink}embed`}
                      className="w-full"
                      style={{ height: 540 }}
                      loading="lazy"
                      allow="encrypted-media; picture-in-picture"
                    /></ConsentGate>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {[
                      { src: '/images/fondant.jpg', alt: 'Fondant dessert' },
                      { src: '/images/mediterranean-buffet.jpg', alt: 'Mediterranean buffet' },
                      { src: '/images/chef-passion.jpg', alt: 'Our chef at work' },
                    ].map((photo) => (
                      <a
                        key={photo.src}
                        href={INSTAGRAM_PROFILE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block aspect-square overflow-hidden rounded-xl bg-[#17120e]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </a>
                    ))}
                  </div>
                )}

                <a
                  href={INSTAGRAM_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17120e] px-6 py-3 font-medium text-white transition-colors hover:bg-[#A69256] hover:text-[#120d0a]"
                >
                  {t.social.instagram}
                  <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Map Section - Premium */}
      <section className="py-24 px-6 lg:px-8 bg-[#f3ece1] lux-reveal" data-lux-delay="40">
        <div className="max-w-7xl mx-auto">
          <div className={`bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-200 ${
            isVisible ? 'animate-fade-in-up' : 'opacity-0'
          }`} style={{ animationDelay: '600ms' }}>
            <div className="p-8 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#A69256]/15 rounded-2xl flex items-center justify-center">
                  <MapPin className="text-[#A69256]" size={20} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-light text-gray-900 font-display">
                  {t.location.title}
                </h3>
              </div>
            </div>
            <div className="h-96 bg-gradient-to-br from-[#F2F2F2] to-[#A6A6A6]/25 relative">
              <ConsentGate service="Google Maps" provider="Google" className="absolute inset-0">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2498.8334217314505!2d6.776975276284795!3d51.22214423150265!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b8cb10fedecbc9%3A0xa3a5e988315ddb33!2sLa%20Cannelle!5e0!3m2!1sfr!2stn!4v1763137870611!5m2!1sfr!2stn" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
                title="Google Maps location"
              ></iframe></ConsentGate>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <SiteFooter footer={pick(commonTranslations, language).footer} nav={commonNav} />
    </div>
  );
}
