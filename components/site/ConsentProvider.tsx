"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";

/**
 * Consent for content loaded from third parties (Google Maps, Instagram embeds, Cloudflare Turnstile).
 * Nothing external is requested until the visitor opts in; "only necessary" is as easy to choose as "allow".
 * The choice itself is stored in this browser's localStorage and is never sent to a server.
 */

const STORAGE_KEY = "lacannelle_consent_v1";

type ConsentState = {
  /** null until the visitor has decided */
  external: boolean | null;
  bannerOpen: boolean;
  allowExternal: () => void;
  rejectExternal: () => void;
  openSettings: () => void;
};

const ConsentContext = createContext<ConsentState>({
  external: null,
  bannerOpen: false,
  allowExternal: () => {},
  rejectExternal: () => {},
  openSettings: () => {},
});

export const useConsent = () => useContext(ConsentContext);

const readStored = (): boolean | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { external?: unknown };
    return typeof parsed.external === "boolean" ? parsed.external : null;
  } catch {
    return null;
  }
};

const writeStored = (external: boolean) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ external, at: new Date().toISOString() }));
  } catch {
    // storage unavailable: the choice then only lasts for this page view
  }
};

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [external, setExternal] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setExternal(readStored());
    setReady(true);
  }, []);

  const choose = useCallback((value: boolean) => {
    setExternal(value);
    writeStored(value);
    setSettingsOpen(false);
  }, []);

  const value = useMemo<ConsentState>(
    () => ({
      external,
      bannerOpen: ready && (external === null || settingsOpen),
      allowExternal: () => choose(true),
      rejectExternal: () => choose(false),
      openSettings: () => setSettingsOpen(true),
    }),
    [external, ready, settingsOpen, choose]
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
      <ConsentBanner />
    </ConsentContext.Provider>
  );
}

function ConsentBanner() {
  const { bannerOpen, external, allowExternal, rejectExternal } = useConsent();
  const { language } = useTranslation("home");
  if (!bannerOpen) return null;
  const de = language === "DE";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      className="fixed inset-x-3 bottom-3 z-[90] max-w-xl rounded-sm border border-black/15 bg-white p-5 text-[#1a1410] shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:inset-x-auto sm:left-6 sm:bottom-6"
    >
      <h2 id="consent-title" className="font-display text-xl">
        {de ? "Ihre Privatsphäre" : "Your privacy"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-black/75">
        {de
          ? "Wir setzen keine Tracking- oder Werbe-Cookies ein. Einige Inhalte stammen von Drittanbietern: die Karte (Google Maps), eingebettete Instagram-Beiträge und der Spam-Schutz im Bestellformular (Cloudflare Turnstile). Sie werden erst geladen, wenn Sie zustimmen; dabei werden Daten wie Ihre IP-Adresse an diese Anbieter übertragen, teils in die USA. Ihre Auswahl können Sie jederzeit im Footer ändern."
          : "We use no tracking or advertising cookies. Some content comes from third parties: the map (Google Maps), embedded Instagram posts and the spam protection on the order form (Cloudflare Turnstile). They load only if you agree, and data such as your IP address is then sent to those providers, partly to the USA. You can change your choice at any time in the footer."}
      </p>
      <p className="mt-2 text-sm">
        <Link href="/datenschutz" className="underline underline-offset-4 hover:text-[#7a6a32]">
          {de ? "Datenschutzerklärung" : "Privacy policy"}
        </Link>
        {" · "}
        <Link href="/impressum" className="underline underline-offset-4 hover:text-[#7a6a32]">
          {de ? "Impressum" : "Legal notice"}
        </Link>
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={rejectExternal}
          className="rounded-sm border border-black/30 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5"
        >
          {de ? "Nur notwendige" : "Necessary only"}
        </button>
        <button
          type="button"
          onClick={allowExternal}
          className="rounded-sm border border-black/30 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5"
        >
          {de ? "Externe Inhalte erlauben" : "Allow external content"}
        </button>
      </div>
      {external !== null && (
        <p className="mt-3 text-xs text-black/55">
          {de
            ? `Aktuell: externe Inhalte ${external ? "erlaubt" : "nicht erlaubt"}.`
            : `Currently: external content ${external ? "allowed" : "not allowed"}.`}
        </p>
      )}
    </div>
  );
}

/** Shows a click-to-load placeholder until the visitor allows external content. */
export function ConsentGate({
  service,
  provider,
  children,
  className,
}: {
  service: string;
  provider: string;
  children: ReactNode;
  className?: string;
}) {
  const { external, allowExternal } = useConsent();
  const { language } = useTranslation("home");
  const de = language === "DE";

  if (external) return <>{children}</>;

  return (
    <div className={`flex flex-col items-start justify-center gap-3 bg-[#e5dfd4] p-6 text-[#1a1410] ${className ?? ""}`}>
      <p className="font-display text-xl">
        {de ? `${service} wird erst nach Ihrer Zustimmung geladen` : `${service} loads only after you agree`}
      </p>
      <p className="max-w-md text-sm leading-relaxed text-black/70">
        {de
          ? `Beim Laden überträgt Ihr Browser Daten, etwa Ihre IP-Adresse, an ${provider}. Mehr dazu in der `
          : `Loading it sends data such as your IP address from your browser to ${provider}. More in the `}
        <Link href="/datenschutz" className="underline underline-offset-4">
          {de ? "Datenschutzerklärung" : "privacy policy"}
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={allowExternal}
        className="rounded-sm border border-black/40 px-4 py-2 text-sm font-semibold transition-colors hover:bg-black hover:text-white"
      >
        {de ? "Externe Inhalte erlauben und laden" : "Allow external content and load"}
      </button>
    </div>
  );
}
