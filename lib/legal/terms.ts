/** Business terms shown in the order dialog and on /agb. Keep this the single source of truth. */
export type TermsSection = { title: string; text: string };

export const TERMS: Record<'DE' | 'EN', TermsSection[]> = {
  DE: [
    {
      title: 'Buchung und Zahlung',
      text: 'Bestellungen werden bestätigt, sobald die Zahlung eingegangen ist. Preise beinhalten die ausgewählten Speisen und Leistungen in Ihrer Bestellübersicht.',
    },
    {
      title: 'Stornierungen',
      text: 'Stornierungen mindestens 48 Stunden vor dem Termin können voll erstattet werden. Spätere Stornierungen können mit Gebühren verbunden sein.',
    },
    {
      title: 'Lieferung',
      text: 'Lieferzeitfenster werden nach Zahlung bestätigt und können je nach Verfügbarkeit und Standort variieren.',
    },
    {
      title: 'Datenschutz',
      text: 'Wir verwenden Ihre Angaben ausschließlich zur Abwicklung Ihrer Bestellung und zur Kommunikation rund um Ihr Event. Einzelheiten stehen in unserer Datenschutzerklärung.',
    },
  ],
  EN: [
    {
      title: 'Booking and Payment',
      text: 'Orders are confirmed once payment is received. Prices include the selected items and services listed in your order summary.',
    },
    {
      title: 'Cancellations',
      text: 'Cancellations made at least 48 hours before the scheduled event are eligible for a full refund. Late cancellations may be subject to fees.',
    },
    {
      title: 'Delivery',
      text: 'Delivery windows are confirmed after payment and may vary based on scheduling availability and location.',
    },
    {
      title: 'Privacy',
      text: 'We only use your information to fulfil your order and communicate about your event. Details are in our privacy policy.',
    },
  ],
};
