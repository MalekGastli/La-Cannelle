import type { Metadata } from "next";
import LegalShell from "@/components/legal/LegalShell";
import Field from "@/components/legal/Missing";
import { LEGAL } from "@/lib/config/legal";
import { IMAGE_CREDITS } from "@/lib/legal/imageCredits";

export const metadata: Metadata = {
  title: "Impressum | La Cannelle",
  robots: { index: true, follow: true },
};

export default function ImpressumPage() {
  return (
    <LegalShell title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {LEGAL.companyName} {LEGAL.legalForm && <>({LEGAL.legalForm})</>}
        <br />
        {LEGAL.street}
        <br />
        {LEGAL.zip} {LEGAL.city}
        <br />
        {LEGAL.country}
      </p>

      <h3>Vertreten durch / Inhaber</h3>
      <p>
        <Field value={LEGAL.owner} />
      </p>

      <h3>Kontakt</h3>
      <p>
        Telefon: <a href={`tel:${LEGAL.phone.replace(/[^\d+]/g, "")}`}>{LEGAL.phone}</a>
        <br />
        E-Mail: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>

      <h3>Registereintrag</h3>
      <p>
        Registergericht: <Field value={LEGAL.registerCourt} />
        <br />
        Registernummer: <Field value={LEGAL.registerNumber} />
      </p>

      <h3>Umsatzsteuer-Identifikationsnummer</h3>
      <p>
        Umsatzsteuer-ID gemäß § 27a UStG: <Field value={LEGAL.vatId} />
      </p>

      <h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
      <p>
        <Field value={LEGAL.owner} />, {LEGAL.street}, {LEGAL.zip} {LEGAL.city}
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        {LEGAL.disputeResolutionWilling
          ? "Wir sind bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
          : "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."}
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Als Diensteanbieter sind wir nach den allgemeinen Gesetzen für eigene Inhalte auf diesen Seiten verantwortlich.
        Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach
        Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder
        Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben unberührt. Eine Haftung ist erst ab
        dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich; bei Bekanntwerden entsprechender
        Rechtsverletzungen entfernen wir diese Inhalte umgehend.
      </p>

      <h2>Haftung für Links</h2>
      <p>
        Unser Angebot enthält Links zu externen Websites Dritter (z. B. Instagram, TikTok), auf deren Inhalte wir keinen
        Einfluss haben. Für diese fremden Inhalte übernehmen wir keine Gewähr; verantwortlich ist stets der jeweilige
        Anbieter. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch uns erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.
        Vervielfältigung, Bearbeitung und Verbreitung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen
        Zustimmung des jeweiligen Rechteinhabers.
      </p>

      <h2>Bildnachweise</h2>
      <p>
        Die Fotografien auf dieser Website stammen von{" "}
        <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">
          Pexels
        </a>{" "}
        und stehen unter der Pexels-Lizenz (kostenlose Nutzung, auch kommerziell). Die Namen der Urheber folgen den
        Angaben auf Pexels.
      </p>
      <ul>
        {Array.from(new Map(IMAGE_CREDITS.map((credit) => [credit.photographer, credit])).values()).map((credit) => (
          <li key={credit.photographer}>
            <a href={`https://www.pexels.com/photo/${credit.id}/`} target="_blank" rel="noopener noreferrer">
              {credit.photographer}
            </a>
          </li>
        ))}
      </ul>
    </LegalShell>
  );
}
