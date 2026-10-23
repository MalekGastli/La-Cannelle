import type { Metadata } from "next";
import LegalShell from "@/components/legal/LegalShell";
import { TERMS } from "@/lib/legal/terms";
import { LEGAL } from "@/lib/config/legal";

export const metadata: Metadata = {
  title: "AGB | La Cannelle",
  robots: { index: true, follow: true },
};

export default function AgbPage() {
  return (
    <LegalShell title="Allgemeine Geschäftsbedingungen">
      <p>
        Diese Bedingungen gelten für Bestellungen bei {LEGAL.companyName}, {LEGAL.street}, {LEGAL.zip} {LEGAL.city}.
      </p>
      {TERMS.DE.map((section, index) => (
        <section key={section.title}>
          <h2>
            § {index + 1} {section.title}
          </h2>
          <p>{section.text}</p>
        </section>
      ))}
      <p>
        Fragen zu diesen Bedingungen beantworten wir unter <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    </LegalShell>
  );
}
