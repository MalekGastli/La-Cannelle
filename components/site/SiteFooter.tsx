import Link from "next/link";
import { Instagram, Music2, MapPin, Mail, Phone } from "lucide-react";
import Container from "./Container";
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
  return (
    <footer className="bg-[#1a110b] text-white border-t border-white/10">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="font-display text-3xl">{footer.brandTitle}</p>
            <span className="mt-4 block h-px w-10 bg-[color:var(--accent)]" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">{footer.brandTagline}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[color:var(--accent)]">{footer.quickLinks}</p>
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
            <p className="text-sm font-semibold text-[color:var(--accent)]">{footer.contact}</p>
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
            <p className="text-sm font-semibold text-[color:var(--accent)]">{footer.followUs}</p>
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

        <div className="mt-14 border-t border-white/10 pt-7 text-center text-xs tracking-wide text-white/45">
          {footer.copyright}
        </div>
      </Container>
    </footer>
  );
}

