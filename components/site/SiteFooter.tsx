"use client";

import Link from "next/link";
import { Instagram, Music2, MapPin, Mail, Phone } from "lucide-react";
import Container from "./Container";
import { useConsent } from "./ConsentProvider";
import { INSTAGRAM_PROFILE_URL } from "@/lib/config/social";

type FooterLabels = {
  quickLinks: string;
  contact: string;
  followUs: string;
  brandTitle: string;
  brandTagline: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  copyright: string;
  social: {
    instagram: string;
    tiktok: string;
  };
};

type NavLabels = {
  home: string;
  services: string;
  menus: string;
  contact: string;
};

type SiteFooterProps = {
  footer: FooterLabels;
  nav: NavLabels;
};

export default function SiteFooter({ footer, nav }: SiteFooterProps) {
  const { openSettings } = useConsent();
  const year = String(new Date().getFullYear());
  return (
    <footer className="bg-[#120d0a] text-white border-t border-white/10">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="font-display text-3xl">{footer.brandTitle}</p>
            <span className="mt-4 block h-px w-10 bg-[color:var(--accent)]" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">{footer.brandTagline}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">{footer.quickLinks}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="/home" className="text-white/70 hover:text-white transition-colors">
                {nav.home}
              </Link>
              <Link href="/services" className="text-white/70 hover:text-white transition-colors">
                {nav.services}
              </Link>
              <Link href="/menus" className="text-white/70 hover:text-white transition-colors">
                {nav.menus}
              </Link>
              <Link href="/contact" className="text-white/70 hover:text-white transition-colors">
                {nav.contact}
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">{footer.contact}</p>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <Phone size={16} className="mt-0.5 text-white/60" />
                <span>{footer.contactPhone}</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 text-white/60" />
                <span>{footer.contactEmail}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 text-white/60" />
                <span>{footer.contactAddress}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">{footer.followUs}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <a
                href={INSTAGRAM_PROFILE_URL}
                className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram size={16} className="text-white/60" />
                <span>{footer.social.instagram}</span>
              </a>
              <a
                href="https://www.tiktok.com/@lacannellecatering"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                <Music2 size={16} className="text-white/60" />
                <span>{footer.social.tiktok}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 border-t border-white/10 pt-7 text-xs text-white/55">
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
            <Link href="/agb" className="hover:text-white transition-colors">AGB</Link>
            <button type="button" onClick={openSettings} className="hover:text-white transition-colors">
              Cookie-Einstellungen
            </button>
          </nav>
          <p>{footer.copyright.replace(/20\d\d/, year)}</p>
        </div>
      </Container>
    </footer>
  );
}

