"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type LuxurySelectOption = {
  value: string;
  label: string;
};

type LuxurySelectProps = {
  value: string;
  placeholder: string;
  options: LuxurySelectOption[];
  onChange: (value: string) => void;
  className?: string;
};

export function LuxurySelect({ value, placeholder, options, onChange, className }: LuxurySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value]
  );

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

  return (
    <div className={["relative", className || ""].join(" ")} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3 text-left text-base border border-[#A6A6A6] rounded-xl focus:ring-2 focus:ring-[color:#A69256] focus:border-[color:#A69256] transition-all duration-300 bg-[#F9F9F9] text-[#404040] shadow-sm flex items-center justify-between gap-3 dark:bg-[#2A2A2A]/70 dark:text-[#EDEDED] dark:border-white/10"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selected ? "text-[#404040] dark:text-[#EDEDED]" : "text-[#A6A6A6] dark:text-[#B0B0B0]"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={[
            "shrink-0 transition-transform duration-200 text-[#A69256]",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-[#A6A6A6]/60 bg-white/90 backdrop-blur-md shadow-[0_18px_48px_rgba(0,0,0,0.18)] overflow-hidden dark:bg-[#1C1C1C]/90 dark:border-white/10">
          <div className="max-h-64 overflow-auto py-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={[
                    "w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-3 transition-colors",
                    isSelected
                      ? "bg-[#A69256]/12 text-[#404040] dark:bg-white/10 dark:text-[#EDEDED]"
                      : "text-[#404040]/90 hover:bg-[#A69256]/10 hover:text-[#404040] dark:text-[#EDEDED] dark:hover:bg-white/10",
                  ].join(" ")}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check size={16} className="text-[#A69256]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

