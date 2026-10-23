"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import mobileExamples from "libphonenumber-js/examples.mobile.json";

type PhoneCountryMeta = {
  country: CountryCode;
  countryName: string;
  callingCode: string;
  flagEmoji: string;
  flagPng: string;
  placeholder: string;
};

export type PhoneNumberInputMeta = {
  country?: string;
  countryName?: string;
  callingCode?: string;
  flagEmoji?: string;
  flagPng?: string;
  isValid?: boolean;
  error?: string;
};

type PhoneNumberInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  defaultCountry?: CountryCode;
  language?: "DE" | "EN";
  onMetaChange?: (meta: PhoneNumberInputMeta) => void;
  inputClassName?: string;
};

const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");

const toFlagEmoji = (country: string) => {
  const normalized = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "";
  const [a, b] = normalized;
  return String.fromCodePoint(127397 + a.charCodeAt(0), 127397 + b.charCodeAt(0));
};

const buildPlaceholder = (country: CountryCode, callingCode: string) => {
  const exampleNational = (mobileExamples as Record<string, string | undefined>)[country];
  if (!exampleNational) return `+${callingCode} ...`;
  return new AsYouType(country).input(`+${callingCode}${exampleNational}`);
};

const formatForCountry = (raw: string, country: CountryCode) => {
  const trimmed = raw.trimStart();
  if (!trimmed) return "";

  if (trimmed.startsWith("+")) {
    return new AsYouType().input(trimmed);
  }

  const callingCode = getCountryCallingCode(country);
  return new AsYouType(country).input(`+${callingCode}${digitsOnly(trimmed)}`);
};

export function PhoneNumberInput({
  value,
  onChange,
  onBlur,
  required,
  defaultCountry = "DE",
  language = "EN",
  onMetaChange,
  inputClassName,
}: PhoneNumberInputProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(defaultCountry);
  const [error, setError] = useState("");
  const [brokenFlags, setBrokenFlags] = useState<Record<string, boolean>>({});

  const countryDisplayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([language === "DE" ? "de" : "en"], { type: "region" });
    } catch {
      return null;
    }
  }, [language]);

  const allCountries = useMemo(() => {
    return (getCountries() as CountryCode[]).map((country) => {
      const callingCode = getCountryCallingCode(country);
      return {
        country,
        callingCode,
        countryName: (countryDisplayNames?.of(country) || country).toString(),
        flagEmoji: toFlagEmoji(country),
        flagPng: `https://flagcdn.com/w40/${country.toLowerCase()}.png`,
        placeholder: buildPlaceholder(country, callingCode),
      } satisfies PhoneCountryMeta;
    });
  }, [countryDisplayNames]);

  const selectedMeta = useMemo(() => {
    return allCountries.find((item) => item.country === selectedCountry) || null;
  }, [allCountries, selectedCountry]);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCountries;
    return allCountries.filter((item) => {
      return (
        item.country.toLowerCase().includes(q)
        || item.countryName.toLowerCase().includes(q)
        || `+${item.callingCode}`.includes(q.replace(/\s/g, ""))
      );
    });
  }, [allCountries, search]);

  const validate = (phone: string, country: CountryCode) => {
    const trimmed = phone.trim();
    if (!trimmed) {
      return required ? (language === "DE" ? "Telefonnummer ist erforderlich." : "Phone number is required.") : "";
    }

    const parsed = trimmed.startsWith("+")
      ? parsePhoneNumberFromString(trimmed)
      : parsePhoneNumberFromString(trimmed, country);

    if (!parsed || !parsed.isValid()) {
      return language === "DE" ? "Bitte eine gueltige Telefonnummer eingeben." : "Please enter a valid phone number.";
    }

    return "";
  };

  const emitMeta = (phone: string, country: CountryCode) => {
    if (!onMetaChange) return;
    const meta = allCountries.find((item) => item.country === country);
    const nextError = validate(phone, country);

    onMetaChange({
      country,
      countryName: meta?.countryName || country,
      callingCode: meta?.callingCode || getCountryCallingCode(country),
      flagEmoji: meta?.flagEmoji || toFlagEmoji(country),
      flagPng: meta?.flagPng,
      isValid: nextError === "",
      error: nextError,
    });
  };

  const markFlagBroken = (country: string) => {
    setBrokenFlags((prev) => (prev[country] ? prev : { ...prev, [country]: true }));
  };

  const applyCountry = (country: CountryCode, currentValue: string) => {
    const parsed = parsePhoneNumberFromString(currentValue.trim());
    const nationalDigits = parsed?.nationalNumber ? String(parsed.nationalNumber) : digitsOnly(currentValue);
    const nextValue = nationalDigits
      ? new AsYouType(country).input(`+${getCountryCallingCode(country)}${nationalDigits}`)
      : `+${getCountryCallingCode(country)} `;

    setSelectedCountry(country);
    setIsOpen(false);
    setSearch("");
    onChange(nextValue);

    const nextError = validate(nextValue, country);
    setError(nextError);
    emitMeta(nextValue, country);
  };

  const handleInputChange = (raw: string) => {
    const nextValue = formatForCountry(raw, selectedCountry);
    onChange(nextValue);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    searchInputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const phone = value || "";
    const detector = new AsYouType();
    detector.input(phone);
    const detectedCountry = detector.getCountry() as CountryCode | undefined;
    const nextCountry = detectedCountry || selectedCountry;

    if (detectedCountry && detectedCountry !== selectedCountry) {
      setSelectedCountry(detectedCountry);
    }

    const nextError = validate(phone, nextCountry);
    setError(nextError);
    emitMeta(phone, nextCountry);
  }, [value, selectedCountry, language]);

  const selectedLabel = selectedMeta
    ? `${selectedMeta.countryName} (+${selectedMeta.callingCode})`
    : language === "DE"
      ? "Land waehlen"
      : "Select country";

  return (
    <div ref={wrapperRef} className="relative">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "108px minmax(0, 1fr)",
          gap: "12px",
          alignItems: "stretch",
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          style={{ minHeight: "52px" }}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          title={selectedLabel}
        >
          {selectedMeta && !brokenFlags[selectedMeta.country] ? (
            <img
              src={selectedMeta.flagPng}
              alt=""
              width={18}
              height={12}
              className="shrink-0 rounded-[2px]"
              loading="lazy"
              decoding="async"
              onError={() => markFlagBroken(selectedMeta.country)}
            />
          ) : (
            <span className="shrink-0 text-base leading-none" aria-hidden="true">
              {selectedMeta?.flagEmoji || "O"}
            </span>
          )}
          <span className="shrink-0 text-xs font-bold">
            {selectedMeta ? `+${selectedMeta.callingCode}` : ""}
          </span>
          <ChevronDown size={14} className={["shrink-0 transition-transform", isOpen ? "rotate-180" : ""].join(" ")} />
        </button>

        <input
          type="tel"
          value={value}
          onChange={(event) => handleInputChange(event.target.value)}
          onBlur={onBlur}
          onFocus={() => {
            if (!value.trim() && selectedMeta) {
              onChange(`+${selectedMeta.callingCode} `);
            }
          }}
          inputMode="tel"
          className={[
            "w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500",
            inputClassName || "",
          ].join(" ").trim()}
          style={{ minHeight: "52px" }}
          placeholder={selectedMeta?.placeholder || "+49 1512 3456789"}
          required={required}
          aria-invalid={Boolean(error)}
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
          <div className="border-b border-gray-200 p-3">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                placeholder={language === "DE" ? "Suchen..." : "Search..."}
              />
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                  aria-label={language === "DE" ? "Suche loeschen" : "Clear search"}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-auto py-1">
            {filteredCountries.map((item) => {
              const isSelected = item.country === selectedCountry;
              return (
                <button
                  key={item.country}
                  type="button"
                  onClick={() => applyCountry(item.country, value)}
                  className={[
                    "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                    isSelected ? "bg-amber-50 text-gray-900" : "text-gray-900 hover:bg-amber-50/60",
                  ].join(" ")}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {!brokenFlags[item.country] ? (
                      <img
                        src={item.flagPng}
                        alt=""
                        width={20}
                        height={14}
                        className="shrink-0 rounded-[2px]"
                        loading="lazy"
                        decoding="async"
                        onError={() => markFlagBroken(item.country)}
                      />
                    ) : (
                      <span className="shrink-0 text-base leading-none" aria-hidden="true">
                        {item.flagEmoji}
                      </span>
                    )}
                    <span className="truncate">{item.countryName}</span>
                    <span className="shrink-0 text-gray-500">+{item.callingCode}</span>
                  </span>
                  {isSelected && <Check size={16} className="shrink-0 text-amber-600" />}
                </button>
              );
            })}

            {filteredCountries.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-500">
                {language === "DE" ? "Keine Ergebnisse." : "No results."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
