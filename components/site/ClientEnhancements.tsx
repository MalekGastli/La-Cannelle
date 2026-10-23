"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollToTopButton } from "./ScrollToTopButton";

function applyRevealStyles(element: HTMLElement) {
  const delay = element.getAttribute("data-lux-delay");
  if (delay && !Number.isNaN(Number(delay))) {
    element.style.setProperty("--lux-delay", `${Number(delay)}ms`);
  }
}

export function ClientEnhancements() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".lux-reveal"));

    if (reduceMotion) {
      const reveal = (element: HTMLElement) => {
        applyRevealStyles(element);
        element.classList.add("lux-in");
      };

      elements.forEach(reveal);

      const mutationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of Array.from(mutation.addedNodes)) {
            if (!(node instanceof HTMLElement)) continue;
            if (node.classList.contains("lux-reveal")) reveal(node);
            node.querySelectorAll<HTMLElement>(".lux-reveal").forEach(reveal);
          }
        }
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });

      return () => mutationObserver.disconnect();
    }

    const observeElement = (element: HTMLElement, observer: IntersectionObserver) => {
      if (element.classList.contains("lux-in")) return;
      applyRevealStyles(element);
      observer.observe(element);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          applyRevealStyles(element);
          element.classList.add("lux-in");
          observer.unobserve(element);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    for (const element of elements) observeElement(element, observer);

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.classList.contains("lux-reveal")) observeElement(node, observer);
          node.querySelectorAll<HTMLElement>(".lux-reveal").forEach((child) => observeElement(child, observer));
        }
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return <ScrollToTopButton />;
}
