# Public Package Catalogue Integration

## Source of truth and trust boundaries

Admin package management calls the existing `savePackage` Function, which writes `packages/{packageId}`. The web catalogue now reads this same source through the anonymous, read-only callable `getPublicCatalog`. No browser Firestore package access or writes were added. `firestore.rules` is unchanged.

`getCustomerCatalog` still authenticates before reading data. Its campus/settings response remains separate from the public endpoint. Both Functions use `queries/activePackageCatalog.ts` for the package query and explicit safe mapping.

The public response is `{ packages: [...] }`. Each package contains only `packageId`, `code`, `name`, `shortDescription`, `description`, `priceMinor`, `currency`, and `displayOrder`. Missing long descriptions use the authoritative short description. No raw documents, timestamps, staff fields, campuses, settings, margins, or customer data are returned.

The shared query requires `active === true`, orders by `displayOrder`, and returns at most 200 packages. Document ID supplies deterministic tie ordering. This is an MVP ceiling shared by customer and public catalogues; pagination is deferred. Records must conform to the existing trusted package schema. Invalid returned records fail closed rather than serving fabricated prices. Documents missing `displayOrder` are excluded by Firestore ordering and need operator correction, not a frontend fallback.

## Public website behavior

`publicCatalogRepository.ts` owns the callable and response validation. `usePublicCatalog` provides loading, error, empty, refresh, and unmount/stale-request protection. React pages do not import Firebase. No stale hardcoded price fallback or persistent catalogue cache is used.

- Home shows the first three returned active packages.
- Dossiers shows all returned active packages, within the documented ceiling.
- Cards and dialog use authoritative names and short/long descriptions.
- Package CTAs carry only a stable package hint into Customer Login/Signup and New Operation. Contact is an enquiry-information page, not a package selector or ordering form.
- Loading/unavailable/empty states reuse existing typography, borders and buttons. Refresh/retry reloads the catalogue, removing deactivated records. Page entry also fetches anew; this is not a realtime subscription.
- Prices retain integer `priceMinor` and `currency` in memory. Only display formatting divides by 100 via `Intl.NumberFormat('en-ZA', { style: 'currency', currency })`. No hardcoded dollar sign remains in the web dossier formatter.

`dossiers.ts` now contains presentation metadata only: images, tags, decorative staging labels, clearance labels and legacy staging copy, keyed by stable code. These are marketing presentation, not live workflow or availability. Unknown/new codes get neutral presentation defaults. Names, descriptions, prices and package membership do not come from this file. Existing layouts, forms and dialog treatment remain in place.

## Mock and Firebase mode

The catalogue uses `VITE_DATA_SOURCE=firestore` (matching the Customer app). It takes precedence over legacy `VITE_FIREBASE_MODE`. An omitted mode now defaults to Firebase, not mock. Explicit `mock` selects shared fixtures only during development; `firestore` or `firebase` selects the callable. Invalid modes fail safely. Every production build selects Firebase regardless of a mock setting. No fallback to mocks occurs on configuration or network failure. Development-only status labels and console stage/count/error-code diagnostics distinguish mock, Firebase, empty results and failures; production users see only safe messages.

The repository reuses the shared lazy Firebase Functions client and its default region. Existing public Firebase web config (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`) is required. These are browser app configuration, not server secrets. No service-account credentials or payment secrets were added to the client. Anonymous visitors do not need to sign in.

## Cost and deployment

No backend caching was added. Each catalogue fetch invokes a Function and reads up to 200 matching package documents; empty queries also incur applicable usage. Route visits/refreshes can repeat reads. Monitor usage and consider bounded caching/rate controls if traffic warrants it; CORS is not an authorization or billing protection mechanism. This endpoint is intentionally public marketing data.

The new `packages` composite index covers `active ASC, displayOrder ASC`. Deploy it and wait until ready **before** deploying the updated customer/public Functions, since both use it. Deploy Functions before releasing the new web build. No rules deployment is required for this feature.

## Preserved authority and known limitations

`createOperation` is unchanged: it rereads the package, verifies active state, derives price server-side, and records immutable snapshots. Public prices are informational, not price authority. Admin writes, customer Auth, customer campus/settings data and payment logic are unchanged.

The conversion cleanup removed `dispatchRepository.ts` and Contact's pseudo-order form. Package CTAs and public Login/Signup hand off to Customer; only its trusted command creates operations. Contact has no submission backend and offers the existing published email link only. See `PUBLIC_WEB_INTEGRATION.md` for package-hint validation and same-tab navigation.

No build, lint, typecheck, browser or deployment verification was executed. Review was static only.

## Manual verification and deployment

From the repository root:

```powershell
npm run typecheck
npm run lint
npm run build
firebase deploy --only firestore:indexes --project secret-service-37f6b
```

Wait for the index to become ready, then:

```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT="30"
firebase deploy --only functions --project secret-service-37f6b
```

Manual checks:

1. In Firebase mode, open Home and Dossiers while signed out. Confirm prices and names match Admin, including ZAR formatting.
2. Edit a name, description, price and display order in Admin; refresh each public catalogue and check the changes.
3. Deactivate a package; refresh and confirm it disappears from public views and its hint cannot preselect a package in Customer New Operation.
4. Add a new stable code and confirm it renders with neutral presentation without source changes.
5. Test no active packages, callable failure and retry. Confirm no mock or old prices appear in Firebase mode.
6. Inspect the public response: no campuses, settings, timestamps or private fields. Confirm anonymous direct Firestore package reads remain denied.
7. Confirm authenticated Customer catalogue still includes campuses/settings and operation creation retains server-derived pricing.
8. Check mobile cards, keyboard controls, dialog closing and same-tab Customer handoff. Test both local mock and real Firebase modes.
