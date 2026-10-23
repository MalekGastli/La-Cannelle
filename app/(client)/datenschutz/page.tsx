import type { Metadata } from "next";
import LegalShell from "@/components/legal/LegalShell";
import Field from "@/components/legal/Missing";
import OpenConsentSettings from "@/components/legal/OpenConsentSettings";
import { LEGAL } from "@/lib/config/legal";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | La Cannelle",
  robots: { index: true, follow: true },
};

export default function DatenschutzPage() {
  return (
    <LegalShell title="Datenschutzerklärung">
      <p>
        Stand: {new Date(LEGAL.lastUpdated).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        {LEGAL.companyName} {LEGAL.legalForm && <>({LEGAL.legalForm})</>}, {LEGAL.street}, {LEGAL.zip} {LEGAL.city},{" "}
        {LEGAL.country}
        <br />
        Vertreten durch: <Field value={LEGAL.owner} />
        <br />
        E-Mail: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> · Telefon: {LEGAL.phone}
      </p>

      <h2>2. Überblick</h2>
      <p>
        Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung dieser Website, zur Bearbeitung von
        Anfragen und Bestellungen oder aufgrund Ihrer Einwilligung nötig ist. Wir setzen weder Tracking- noch
        Analyse- oder Werbe-Cookies ein. Schriftarten werden von unserem eigenen Server ausgeliefert; es erfolgt keine
        Verbindung zu Schriftarten-Servern Dritter.
      </p>

      <h2>3. Hosting und Server-Logfiles</h2>
      <p>
        Die Website und die zugehörige Schnittstelle werden bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723,
        USA, betrieben. Beim Aufruf der Seiten werden technisch notwendige Daten in Server-Logfiles verarbeitet
        (IP-Adresse, Datum und Uhrzeit, aufgerufene URL, übertragene Datenmenge, Browsertyp). Rechtsgrundlage ist
        Art. 6 Abs. 1 lit. f DSGVO (sicherer und stabiler Betrieb). Eine Übermittlung in die USA stützt sich auf den
        Angemessenheitsbeschluss zum EU-US Data Privacy Framework bzw. auf EU-Standardvertragsklauseln. Mit dem
        Anbieter besteht ein Auftragsverarbeitungsvertrag.
      </p>
      <p>
        Bestell- und Anfragedaten speichern wir in einer Datenbank bei einem Hosting-Dienstleister (Auftragsverarbeiter);
        hochgeladene Bilder der Speisekarte liegen bei Vercel Blob. Bitte nennen Sie hier den aktuell eingesetzten
        Datenbank-Anbieter und dessen Standort: <Field value={null} />
      </p>

      <h2>4. Kontaktformular und Anfragen</h2>
      <p>
        Wenn Sie uns über das Kontaktformular schreiben, verarbeiten wir Ihren Namen, Ihre E-Mail-Adresse, optional Ihre
        Telefonnummer, Veranstaltungstyp, -datum, Gästezahl und Ihre Nachricht, um Ihre Anfrage zu beantworten.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. lit. f (Beantwortung von
        Anfragen). Die Nachricht wird per E-Mail über{" "}
        {LEGAL.emailProvider ? LEGAL.emailProvider : <Field value={null} />} an uns übermittelt. Wir löschen die Daten,
        sobald die Anfrage erledigt ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
      </p>

      <h2>5. Bestellungen</h2>
      <p>
        Bei einer Bestellung verarbeiten wir Kontaktdaten, ggf. Firmenangaben, Veranstaltungs- und Lieferadresse,
        Bestellinhalt und Zahlungsstatus, um den Vertrag zu erfüllen (Art. 6 Abs. 1 lit. b DSGVO). Handels- und
        steuerrechtliche Aufbewahrungspflichten (z. B. § 147 AO, § 257 HGB) verpflichten uns, Buchungsbelege bis zu zehn
        Jahre aufzubewahren (Art. 6 Abs. 1 lit. c DSGVO). Zahlungen erfolgen nach den im Bestellprozess angegebenen
        Zahlungswegen. Eine automatisierte Entscheidungsfindung findet nicht statt.
      </p>

      <h2>6. Speicherung in Ihrem Browser</h2>
      <p>Wir speichern folgende Einträge lokal in Ihrem Browser (§ 25 Abs. 2 Nr. 2 TDDDG, soweit unbedingt erforderlich):</p>
      <ul>
        <li>
          <code>lacannelle_language</code>: Ihre gewählte Sprache (Deutsch/Englisch).
        </li>
        <li>
          <code>lacannelle_consent_v1</code>: Ihre Entscheidung zu externen Inhalten (siehe Abschnitt 7).
        </li>
        <li>
          Nur für den Administrationsbereich: ein Sitzungs-Cookie (<code>admin_token</code>) bzw. ein Anmelde-Token.
          Besucher der öffentlichen Seiten erhalten diese nicht.
        </li>
      </ul>

      <h2>7. Externe Inhalte (nur mit Ihrer Einwilligung)</h2>
      <p>
        Die folgenden Dienste werden erst geladen, wenn Sie im Hinweis zu Beginn Ihres Besuchs zugestimmt oder den
        Platzhalter bestätigt haben. Rechtsgrundlage ist Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 25
        Abs. 1 TDDDG. Dabei wird mindestens Ihre IP-Adresse an den Anbieter übertragen, teils in die USA.
      </p>
      <ul>
        <li>
          <strong>Google Maps</strong> (Kartenansicht auf der Kontaktseite): Google Ireland Limited, Gordon House,
          Barrow Street, Dublin 4, Irland, sowie Google LLC, USA.{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Datenschutzhinweise
          </a>
        </li>
        <li>
          <strong>Instagram-Beiträge</strong> (eingebettete Beiträge, falls konfiguriert): Meta Platforms Ireland
          Limited, Merrion Road, Dublin 4, Irland, sowie Meta Platforms, Inc., USA.{" "}
          <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer">
            Datenschutzhinweise
          </a>
        </li>
        <li>
          <strong>Cloudflare Turnstile</strong> (Spam-Schutz im Bestellformular, falls aktiviert): Cloudflare, Inc., 101
          Townsend St, San Francisco, CA 94107, USA. Es werden technische Merkmale Ihres Browsers ausgewertet, um
          Menschen von automatisierten Zugriffen zu unterscheiden.{" "}
          <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
            Datenschutzhinweise
          </a>
        </li>
      </ul>
      <p>
        Ihre Einwilligung können Sie jederzeit mit Wirkung für die Zukunft ändern: <OpenConsentSettings />
      </p>

      <h2>8. Verlinkte Dienste</h2>
      <p>
        Links zu Instagram und TikTok sind einfache Verweise. Daten werden an diese Anbieter erst übertragen, wenn Sie
        den Link anklicken; ab dann gelten deren Datenschutzbestimmungen.
      </p>

      <h2>9. Ihre Rechte</h2>
      <p>Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:</p>
      <ul>
        <li>Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18)</li>
        <li>Datenübertragbarkeit (Art. 20)</li>
        <li>
          Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO), wenn sich aus Ihrer
          besonderen Situation Gründe ergeben
        </li>
        <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
      </ul>
      <p>
        Bitte wenden Sie sich dazu an <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Außerdem können Sie sich bei
        einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei der Landesbeauftragten für Datenschutz und
        Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf.
      </p>

      <h2>10. Änderungen</h2>
      <p>
        Wir passen diese Erklärung an, wenn sich unsere Dienste oder die Rechtslage ändern. Es gilt die jeweils hier
        veröffentlichte Fassung.
      </p>
    </LegalShell>
  );
}
