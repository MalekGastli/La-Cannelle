"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import Container from "@/components/site/Container";
import { useTranslation, pick } from "@/lib/hooks/useTranslation";
import { commonTranslations } from "@/lib/translations/common";

export default function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, toggleLanguage } = useTranslation("home");
  const common = pick(commonTranslations, language);

  return (
    <div className="min-h-screen bg-[#faf6ef] text-[#1a1410]">
      <SiteHeader
        language={language}
        toggleLanguage={toggleLanguage}
        pathname={pathname}
        nav={{ ...common.nav }}
        a11y={common.accessibility}
        onOrderClick={() => router.push("/order")}
      />
      <main className="pb-24 pt-44">
        <Container>
          <h1 className="mb-4 font-display text-4xl font-medium tracking-tight lg:text-5xl">{title}</h1>
          {language === "EN" && (
            <p className="mb-8 max-w-3xl text-sm text-black/60">
              The legal texts are provided in German, as required for a business based in Germany.
            </p>
          )}
          <div className="legal-prose mt-8 max-w-3xl">{children}</div>
        </Container>
      </main>
      <SiteFooter footer={common.footer} nav={common.nav} />
    </div>
  );
}
