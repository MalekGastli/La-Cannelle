"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Phone, Mail, MapPin, Clock, Send, MessageCircle, Calendar } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { commonTranslations } from '@/lib/translations/common';
import { contactTranslations } from '@/lib/translations/contact';
import { LuxurySelect } from '@/components/site/LuxurySelect';
import SiteHeader from '@/components/site/SiteHeader';
import { INSTAGRAM_HANDLE_DISPLAY, INSTAGRAM_PROFILE_URL } from '@/lib/config/social';

const normalizeInstagramPermalink = (url: string) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

export default function ContactPage() {
  const { t: rawT, language, toggleLanguage } = useTranslation('contact');

  const t = rawT as typeof contactTranslations.EN;
  const commonNav = commonTranslations[language].nav;
  const commonFooter = commonTranslations[language].footer;
  const commonA11y = commonTranslations[language].accessibility;
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
      alert(language === 'DE' ? 'Bitte Veranstaltungstyp wählen.' : 'Please select an event type.');
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
    const locale = language === 'DE' ? 'de-DE' : 'en-US';
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
    prevMonth: language === 'DE' ? 'Vorheriger Monat' : 'Previous month',
    nextMonth: language === 'DE' ? 'Naechster Monat' : 'Next month',
    clear: language === 'DE' ? 'Loeschen' : 'Clear',
    today: language === 'DE' ? 'Heute' : 'Today',
    weekdayLabels: language === 'DE'
      ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  };
  const eventDateError = formData.eventDate && isDateInPast(formData.eventDate)
    ? t.contactForm.invalidEventDate
    : '';

  const router = useRouter();

  const handleOrderClick = () => {
    router.push('/order');
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
        
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
        .animate-fade-in-down { animation: fadeInDown 0.8s ease-out; }
        .animate-fade-in-left { animation: fadeInLeft 0.8s ease-out; }
        .animate-fade-in-right { animation: fadeInRight 0.8s ease-out; }
        .animate-scale-in { animation: scaleIn 0.6s ease-out; }
        
        .animate-delay-100 { animation-delay: 0.1s; }
        .animate-delay-200 { animation-delay: 0.2s; }
        .animate-delay-300 { animation-delay: 0.3s; }
        
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

        .contact-date-input {
          color-scheme: light;
          accent-color: #A69256;
          appearance: none;
        }

        .contact-date-input::-webkit-calendar-picker-indicator {
          opacity: 0;
          cursor: pointer;
        }

        .contact-date-input::-webkit-datetime-edit {
          color: #404040;
        }
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>

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
      <section className="pt-40 pb-24 px-6 lg:px-8 bg-[#F2F2F2] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#A69256]/12 via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <p className="text-xs uppercase tracking-[0.3em] text-[#A69256] font-semibold mb-4">Get In Touch</p>
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
                                            ? 'bg-[#A69256] text-white shadow-sm'
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
                    className="w-full bg-[#A69256] text-[#F2F2F2] py-4 px-8 rounded-xl font-semibold hover:bg-[#0D0D0D] transition-all duration-300 hover:shadow-lg inline-flex items-center justify-center gap-2 group"
                  >
                    <Send size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    {t.contactForm.button}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar - Premium Cards */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className={`bg-gray-50 rounded-3xl p-8 border border-gray-200 ${
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
              <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden ${
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
                    className="w-full bg-[#A69256] text-[#F2F2F2] py-3 px-6 rounded-xl font-semibold hover:bg-[#0D0D0D] transition-all duration-300 hover:shadow-lg inline-flex items-center justify-center gap-2 group"
                  >
                    {t.quickOrder.button}
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Instagram Section - Premium */}
              <div className={`bg-white rounded-3xl p-8 border border-gray-200 ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`} style={{ animationDelay: '400ms' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ 
                    background: 'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)' 
                  }}>
                    <svg className="h-5 w-5" fill="white" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-light text-gray-900 font-display">
                    {t.social.title}
                  </h3>
                </div>
                
                <div className="space-y-6">
                  {/* Instagram Profile Preview */}
                  <div className="p-5 bg-gradient-to-br from-[#F2F2F2] to-[#A69256]/10 rounded-2xl border border-[#A6A6A6]/40">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-[#A69256] flex items-center justify-center">
                        <span className="text-white font-semibold text-base">LC</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{INSTAGRAM_HANDLE_DISPLAY}</h4>
                        <p className="text-sm text-gray-600">Premium Catering & Events</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-center">
                      <div>
                        <p className="font-semibold text-gray-900">125</p>
                        <p className="text-gray-600 text-xs">Posts</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">2.4K</p>
                        <p className="text-gray-600 text-xs">Followers</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">312</p>
                        <p className="text-gray-600 text-xs">Following</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Posts */}
                  {hasInstagramPosts && instagramPosts.length > 0 && firstInstagramPost && (
                    <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
                      <iframe
                        title={`Instagram post ${firstInstagramPost.permalink}`}
                        src={`${firstInstagramPost.permalink}embed`}
                        className="w-full"
                        style={{ height: 540 }}
                        loading="lazy"
                        allow="encrypted-media; picture-in-picture"
                      />
                    </div>
                  )}

                  {/* Follow Button */}
                  <a 
                    href={INSTAGRAM_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-white py-3 px-6 rounded-xl font-medium text-center hover:shadow-lg transition-all duration-300 inline-flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)' }}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.75 6a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 17.75 6z" />
                    </svg>
                    {t.social.instagram}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Map Section - Premium */}
      <section className="py-24 px-6 lg:px-8 bg-gray-50 lux-reveal" data-lux-delay="40">
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
              ></iframe>
            </div>
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
                <a href="/home" className="text-white hover:text-[#A69256] transition-colors">{commonNav.home}</a>
                <a href="/services" className="text-white hover:text-[#A69256] transition-colors">{commonNav.services}</a>
                <a href="/menus" className="text-white hover:text-[#A69256] transition-colors">{commonNav.menus}</a>
                <a href="/contact" className="text-white font-semibold">{commonNav.contact}</a>
              </div>
            </div>
            
            <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <h4 className="font-medium mb-4 text-sm uppercase tracking-wider">{commonFooter.contact}</h4>
              <div className="flex flex-col gap-3 text-[#F2F2F2]/70">
                <div className="flex items-center gap-3">
                  <Phone size={16} />
                  <span className="text-sm">{t.contactInfo.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} />
                  <span className="text-sm">{t.contactInfo.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} />
                  <span className="text-sm">{t.contactInfo.address}</span>
                </div>
              </div>
            </div>
            
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'animate-fade-in-right' : 'opacity-0'}`}>
              <h4 className="font-medium mb-4 text-sm uppercase tracking-wider">{commonFooter.followUs}</h4>
              <div className="flex flex-col gap-2 text-[#F2F2F2]/70">
                <a href={INSTAGRAM_PROFILE_URL} className="hover:text-[#A69256] transition-colors inline-flex items-center gap-2 text-sm">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.75 6a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 17.75 6z" />
                  </svg>
                  {commonFooter.social.instagram}
                </a>
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
