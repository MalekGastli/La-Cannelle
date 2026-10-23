/**
 * Provider details for the legal notice (Impressum) and privacy policy.
 *
 * Only facts that are already public on the site are filled in. Everything else is read from
 * NEXT_PUBLIC_LEGAL_* environment variables and shows as a visible "[bitte ergänzen]" until set,
 * so no legal information is ever invented. Mandatory details depend on the legal form of the business.
 */
const env = (value: string | undefined) => (value && value.trim() ? value.trim() : null);

export const LEGAL = {
  companyName: env(process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME) ?? 'La Cannelle Catering',
  legalForm: env(process.env.NEXT_PUBLIC_LEGAL_FORM), // e.g. "GmbH", "Einzelunternehmen"
  owner: env(process.env.NEXT_PUBLIC_LEGAL_OWNER), // Inhaber / vertretungsberechtigte Person(en)
  street: 'Borsigstrasse 2',
  zip: '41541',
  city: 'Dormagen',
  country: 'Deutschland',
  email: env(process.env.NEXT_PUBLIC_LEGAL_EMAIL) ?? 'booking@la-cannelle.com',
  phone: env(process.env.NEXT_PUBLIC_LEGAL_PHONE) ?? '+49 2133 978 2992',
  registerCourt: env(process.env.NEXT_PUBLIC_LEGAL_REGISTER_COURT), // only if registered (HRB/HRA)
  registerNumber: env(process.env.NEXT_PUBLIC_LEGAL_REGISTER_NUMBER),
  vatId: env(process.env.NEXT_PUBLIC_LEGAL_VAT_ID), // USt-IdNr. nach § 27a UStG, if assigned
  emailProvider: env(process.env.NEXT_PUBLIC_LEGAL_EMAIL_PROVIDER), // SMTP provider used for contact mails
  /** true = "willing to take part in consumer arbitration", false = "not willing / not obliged" */
  disputeResolutionWilling: process.env.NEXT_PUBLIC_LEGAL_ARBITRATION === 'yes',
  lastUpdated: '2026-10-23',
} as const;

export const MISSING = '[bitte ergänzen]';
export const orMissing = (value: string | null) => value ?? MISSING;
