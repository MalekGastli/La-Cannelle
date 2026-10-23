"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "lacannelle-theme";

const getSystemTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
};

const readStoredTheme = (): ThemeMode | null => {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "dark" || value === "light" ? value : null;
};

const applyTheme = (theme: ThemeMode) => {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
};

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const initial = readStoredTheme() ?? getSystemTheme();
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={[
        "inline-flex items-center gap-2 rounded-lg border border-[#404040]/25 bg-white/60 px-3 py-2 text-sm font-medium text-[#404040] shadow-sm transition-colors hover:border-[#A69256] hover:bg-[#A69256]/10 hover:text-[#A69256] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A69256]/40 dark:border-white/15 dark:bg-[#2C2C2C]/60 dark:text-[#F2F2F2] dark:hover:border-[#A69256] dark:hover:bg-white/10 dark:hover:text-[#A69256]",
        className || "",
      ].join(" ")}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="hidden lg:inline">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
