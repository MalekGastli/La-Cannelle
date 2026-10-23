# Legal and content checklist

This is a technical checklist, not legal advice. Have the texts reviewed by a lawyer before relying on them.

## Must be filled in (shown as "[bitte ergänzen]" on /impressum until set)
Set these as environment variables on the frontend Vercel project, then redeploy:

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_LEGAL_COMPANY_NAME` | Legal name of the business (default: "La Cannelle Catering") |
| `NEXT_PUBLIC_LEGAL_FORM` | e.g. GmbH, Einzelunternehmen |
| `NEXT_PUBLIC_LEGAL_OWNER` | Owner / authorised representative, also "responsible for content" (§ 18 Abs. 2 MStV) |
| `NEXT_PUBLIC_LEGAL_REGISTER_COURT`, `NEXT_PUBLIC_LEGAL_REGISTER_NUMBER` | Only if entered in a commercial register |
| `NEXT_PUBLIC_LEGAL_VAT_ID` | USt-IdNr. (§ 27a UStG), if assigned |
| `NEXT_PUBLIC_LEGAL_EMAIL_PROVIDER` | Provider that sends contact mails (named in the privacy policy) |
| `NEXT_PUBLIC_LEGAL_ARBITRATION` | `yes` only if you are willing to join consumer arbitration; default text says you are not |

The privacy policy also asks you to name the database provider and its location (section 3).

## To clarify with a lawyer
- AGB (`lib/legal/terms.ts`): the current text is the short sample from the order dialog. Cancellation and payment terms are business decisions.
- Right of withdrawal (Widerrufsrecht) for consumer orders, and whether a notice is needed.
- Price display for consumers (VAT included? § 3 PAngV) and allergen information for non-prepackaged food (LMIV).
- Partner banner: the client logos are shown again on the home page on the owner's instruction. Make sure each brand has agreed to be shown (ideally in writing); remove any that haven't in `BRAND_LOGOS` in `app/(client)/home/page.tsx`.

## Images
All photographs come from Pexels (Pexels License). Sources and photographer names: `lib/legal/imageCredits.ts`
(also listed on /impressum). Photographer names follow the Pexels usernames and may be spelled differently there.
Several photos show people from a distance or masked; Pexels does not guarantee model releases, so avoid using them in a way that implies a person endorses the business.
The old copyrighted images (a Pinterest image, third-party shop and competitor photos in the default data) have been removed. The partner logos are the owner's own responsibility (see above).

## Third-party loading
Google Maps, Instagram embeds and Cloudflare Turnstile load only after consent (`components/site/ConsentProvider.tsx`).
Fonts are self-hosted and phone-number flags are emoji, so no other third-party requests occur.
If the database already contains menus, services or accessories with old image URLs, replace them in the admin area.
