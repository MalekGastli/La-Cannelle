"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LANGUAGES, useTranslation, type Language } from "@/lib/hooks/useTranslation";

const NAMES: Record<Language, string> = { TR: "Türkçe", EN: "English", FR: "Français", DE: "Deutsch" };

/** Compact 4-language dropdown (TR / EN / FR / DE) used in the site and order headers. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) return e.key === "Escape" ? setOpen(false) : undefined;
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${NAMES[language]}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/25 px-3 text-xs font-semibold tracking-wider text-white transition-colors hover:border-[#A69256] hover:bg-white/10"
      >
        {language}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 z-[80] mt-2 min-w-[150px] overflow-hidden rounded-md border border-[#A69256]/30 bg-[#17120e] py-1 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
        >
          {LANGUAGES.map((code) => (
            <li key={code} role="option" aria-selected={code === language}>
              <button
                type="button"
                onClick={() => {
                  setLanguage(code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-4 px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                  code === language ? "text-[#d6c27d]" : "text-white/85"
                }`}
              >
                <span>{NAMES[code]}</span>
                <span className="text-[11px] tracking-widest text-white/45">{code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
