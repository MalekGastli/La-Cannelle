"use client";

import { useEffect, useState } from "react";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [avoidNextFab, setAvoidNextFab] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 520);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const update = () => {
      setAvoidNextFab(
        Boolean(document.querySelector("[data-order-next-fab], [data-order-back-fab], [data-order-summary-dock]"))
      );
    };

    update();
    const observer = new MutationObserver(() => update());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className={`lux-scrolltop animate-fade-in-up fixed right-6 ${avoidNextFab ? "bottom-24" : "bottom-6"} z-50 inline-flex items-center justify-center h-12 w-12 rounded-full border border-[#A69256]/35 bg-white/85 supports-[backdrop-filter]:bg-white/65 backdrop-blur-md text-[#404040] shadow-[0_12px_40px_rgba(0,0,0,0.16)] hover:border-[#A69256]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A69256]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-[#1C1C1C]/80 dark:supports-[backdrop-filter]:bg-[#1C1C1C]/65 dark:text-[#EDEDED] dark:ring-offset-[#121212]`}
    >
      <span className="text-lg leading-none" aria-hidden>
        ↑
      </span>
    </button>
  );
}
