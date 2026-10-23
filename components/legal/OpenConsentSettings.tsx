"use client";

import { useConsent } from "@/components/site/ConsentProvider";

export default function OpenConsentSettings() {
  const { openSettings } = useConsent();
  return (
    <button type="button" onClick={openSettings} className="underline underline-offset-4 text-[#7a6a32]">
      Cookie- und Datenschutz-Einstellungen öffnen
    </button>
  );
}
