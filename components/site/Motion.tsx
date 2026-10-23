"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * Small, dependency-free motion primitives for the marketing pages.
 * Every effect is disabled when the visitor prefers reduced motion.
 */

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const finePointer = () =>
  typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

/** True once the element has scrolled into view (fires once). */
function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, seen] as const;
}

/** Headline that fades, unblurs and rises word by word. */
export function SplitText({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  step = 70,
  immediate = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  step?: number;
  /** Animate on mount instead of on scroll (use above the fold). */
  immediate?: boolean;
}) {
  const [ref, seen] = useInView<HTMLElement>(0.3);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const on = immediate ? mounted : seen;
  const words = text.split(" ");

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          aria-hidden="true"
          className={`motion-word ${on ? "motion-word-in" : ""}`}
          style={{ transitionDelay: `${delay + index * step}ms` }}
        >
          {word}
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}

/** Card with a soft light that follows the pointer and a lit border. */
export function Spotlight({
  children,
  className,
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !finePointer() || prefersReducedMotion()) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={`motion-spotlight ${tone === "dark" ? "motion-spotlight-dark" : ""} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/** Subtle 3D tilt that follows the pointer. */
export function Tilt({
  children,
  className,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !finePointer() || prefersReducedMotion()) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateZ(0)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={`motion-tilt ${className ?? ""}`}>
      {children}
    </div>
  );
}

/** Wipes an image in from one side when it scrolls into view. */
export function ImageReveal({
  children,
  className,
  from = "left",
}: {
  children: ReactNode;
  className?: string;
  from?: "left" | "right" | "bottom";
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  return (
    // The observed element stays unclipped; clipping the target itself would give it zero visible area.
    <div ref={ref} className={`motion-wipe ${seen ? "motion-wipe-in" : ""} ${className ?? ""}`}>
      <div className={`motion-wipe-inner motion-wipe-${from}`}>{children}</div>
    </div>
  );
}

/** Moves its content a little against the scroll direction. */
export function Parallax({
  children,
  className,
  speed = 0.08,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`will-change-transform ${className ?? ""}`}>
      {children}
    </div>
  );
}

/** Button that is gently pulled toward the pointer. */
export function Magnetic({ children, className, strength = 0.25 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);

  const onMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el || !finePointer() || prefersReducedMotion()) return;
    const rect = el.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`motion-magnetic inline-block ${className ?? ""}`}
      style={{ ["--ease" as string]: "cubic-bezier(0.22,1,0.36,1)" } as CSSProperties}
    >
      {children}
    </span>
  );
}

/** Slowly drifting gradient blobs, used behind dark call-to-action sections. */
export function Aurora({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`motion-aurora pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <span className="motion-aurora-blob motion-aurora-a" />
      <span className="motion-aurora-blob motion-aurora-b" />
      <span className="motion-aurora-blob motion-aurora-c" />
    </div>
  );
}

/** Thin gold bar at the top of the page that fills while scrolling. */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
      <div ref={barRef} className="h-full origin-left scale-x-0 bg-[color:var(--accent)]" />
    </div>
  );
}
