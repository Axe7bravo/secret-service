# Public Web Integration

## Confirmed catalogue root cause

Read-only inspection found `apps/web/.env.local` contains real Firebase web configuration and `VITE_DATA_SOURCE=firestore`, but the previous repository read only `VITE_FIREBASE_MODE` and defaulted to `mock` during development. Therefore the checked-in selection logic with that environment never called `getPublicCatalog`; replacing credentials alone could not show Admin-created packages. The old `.env.example` reinforced the mock default.

Both inspected app-local configurations identify `secret-service-37f6b` and its Firebase Auth domain. All six shared required web configuration fields are present. Root `.env` contains a mock project, but these Vite app configs have no root `envDir` override; standard workspace startup uses each app's own environment. Shell environment overrides and previously built/deployed bundles were not observed. Restart Vite after changing env values, and rebuild for production changes.

## Mode fix and diagnostics

`publicCatalogRepository` resolves mode in this order:

1. Non-empty `VITE_DATA_SOURCE`.
2. Legacy non-empty `VITE_FIREBASE_MODE`.
3. Default `firestore`.

Both `firestore` and `firebase` select Firebase. Only explicit `mock` in development uses fixtures. Production never selects fixtures. Invalid values fail safely. Real Firebase configuration is still required; missing configuration does not trigger a mock fallback.

In development, catalogue status visibly identifies MOCK/FIREBASE and LOADING/LOADED/ZERO PACKAGES/FAILED. Console diagnostics use the `[Public catalogue]` prefix and report mode, public project ID, default region, stage, result count, and safe SDK error code. No API keys, credentials, tokens, raw response bodies or raw error messages are logged. `invalid-response` identifies schema rejection; `empty` identifies a successful zero-result response. Production suppresses these diagnostics.

The backend remains `getPublicCatalog → loadActivePackages → packages`, with the existing active-only filter, numeric display order, stable IDs, ZAR minor units, allowlist and 200-record ceiling. Inspection found the trusted `savePackage` shape agrees with the backend and frontend validators for normal validated records. No server query or validator change was needed for this mode bug.

The shared Functions client uses its default `us-central1` region; `getPublicCatalog` has no region/global override, so its source also uses that default. The `active ASC, displayOrder ASC` composite index is already declared in `firestore.indexes.json`. No index or Function source was changed during this pass. Whether the deployed Function returns records, the deployed index exists/is ready, or deployed data conforms was not verified: no remote calls or deployments were run.

## Login and Signup: one identity system

Public `/login` and `/signup` retain the existing `AuthLayout`, typography, surfaces and buttons, but replace nonfunctional credential forms with explicit Customer Portal links. The destination is respectively `<customer-origin>/login` or `/signup`. All Customer handoffs now navigate in the same tab for a consistent mobile conversion flow. If the destination is unreachable, return with Back and retry. No authentication request is performed by these public pages.

The existing Customer app owns Firebase email/password login, signup, error messages, token persistence and post-auth navigation. Signup uses `createUserWithEmailAndPassword` and optional display-name update; it grants no Admin or Ambassador claim. No duplicated user/account store or fake localStorage auth was introduced.

Without a package hint, Login/Signup preserve a validated internal Customer destination from `location.state.from`, falling back to `/dashboard`. A valid `package` query hint instead targets `/operations/new?package=<id>`, including for already signed-in users. Login/Signup links preserve that hint and internal return state. There is no arbitrary `next`/`redirect` URL support.

Auth sessions are origin-scoped: using the same Firebase project does not transfer browser persistence between different origins. By sending visitors to the existing Customer origin, its existing session is reused without moving tokens. The public app transfers only a validated non-sensitive `package` query hint; it does not transfer credentials, tokens, arbitrary query parameters or browser history state. Admin/Ambassador guards and navigation are untouched; no handoff to those apps is provided.

## Environment and domains

Both apps expect these shared public Firebase config names:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

The web example retains optional `VITE_FIREBASE_MEASUREMENT_ID`; the shared client does not require it. These are browser Firebase app configuration, not server secrets. No Yoco/Functions/service-account secrets are exposed or added. Existing local credential files were not modified.

Public catalogue mode: `VITE_DATA_SOURCE=firestore`.

New web configuration: `VITE_CUSTOMER_APP_URL`, an origin only (no path other than `/`, query, fragment or embedded credentials).

Local example in `apps/web/.env.local` if an explicit origin is desired:

```dotenv
VITE_DATA_SOURCE=firestore
VITE_CUSTOMER_APP_URL=http://localhost:3002
```

The scripts run web on port 3000 and Customer on port 3002. With the new variable omitted, loopback development uses the current hostname at port 3002 (`localhost`, `127.0.0.1`, or IPv6 loopback). This keeps localhost/127.0.0.1 sessions consistent with the chosen hostname. Remote/ngrok development requires an explicit reachable Customer HTTPS origin; the public ngrok origin cannot infer the Customer tunnel.

For production, explicitly supply the actual Customer app HTTPS origin before building web. No real production domain is assumed or inserted. Loopback production destinations, same-public-origin destinations, non-HTTPS remote destinations, path/query/fragment URLs and credential-bearing URLs fail closed with an unavailable message. This avoids accidental self-handoff loops. Configure the deployed Customer host to serve `/login`, `/signup` and `/dashboard` through its existing SPA rewrite.

## Error handling and limitations

- Public catalogue failures stay safe and retryable with no stale fixture fallback.
- Missing/invalid portal configuration disables the handoff with a safe message (actionable configuration hint in development only).
- The public page does not probe a different origin's health or claim it is online. For an unreachable Customer host, the browser displays the destination error; use Back to return and retry. Correct DNS/hosting/local-server availability must be verified manually.
- Invalid credentials, duplicate email, weak password, disabled account and network errors remain handled by the existing Customer Auth UI/service. No second password-reset/social/MFA flow was added.
- The obsolete `dispatchRepository.ts` was removed by the conversion cleanup. Contact is informational, with an existing published mailto address only; no site submission backend exists.
- No live SDK calls, browsers, builds, lint, typechecks or deployment tools were run. Static source/environment inspection cannot prove current deployed availability or data.

## Security review

Public catalogue stays anonymous/read-only; Firestore rules and backend pricing/snapshot authority are unchanged. No public Firestore writes, custom-claim changes, private package fields, token handoff, new Auth store, Admin/Ambassador access path or production mock-price fallback was added. Destination routes are fixed and origins come from trusted build configuration, not untrusted query parameters.

## Manual verification

```powershell
npm run typecheck
npm run lint
npm run build
```

Start/restart each development server in its own terminal:

```powershell
npm run dev:web
```

```powershell
npm run dev:customer
```

1. Open web on port 3000. Confirm DEV CATALOGUE: FIREBASE and a loaded count in console. Verify an Admin-created active package appears, then edit/deactivate it and refresh the catalogue.
2. Temporarily select explicit mock mode and restart web to confirm the diagnostic identifies it; restore firestore afterward.
3. If Firebase reports failure, inspect the safe code and check deployment/index status manually. If it reports zero packages, inspect active records/order fields in the intended project; do not change rules to bypass the endpoint.
4. Follow both public auth links. Verify the real Customer forms open on port 3002; test valid/invalid login, duplicate/weak-password signup, and an already-signed-in Customer session. Check an internally guarded Customer route still returns to its existing destination after login.
5. Check portal misconfiguration, stopped Customer server, keyboard navigation and narrow-screen handoff layout.
6. Before release, set the real Customer HTTPS origin in the web build environment and verify links in the production build. Existing web Hosting deployment is still required to publish the changed bundle.

This pass needs no new Functions/index deployment. If the previous catalogue milestone was not deployed, deploy its existing index first and wait for readiness, then deploy Functions:

```powershell
firebase deploy --only firestore:indexes --project secret-service-37f6b
$env:FUNCTIONS_DISCOVERY_TIMEOUT="30"
firebase deploy --only functions --project secret-service-37f6b
```

## Public conversion cleanup

### Retired prototype flow

The previous path was Dossier selection → `preselected_dossier` session storage → Contact fields → `createDispatch`. It simulated dispatches in `secret-service-mock-db` or attempted a blocked direct `dispatches` write. The active web app no longer contains either write path, pseudo-cart state, encoded payload helper, fake agent ID, animated submission logs, or order-success simulation.

Removed `apps/web/src/services/dispatchRepository.ts` and its unused `DispatchInput`/`DispatchResult` interfaces. Removed web-only command-log CSS. Existing browser storage is not erased; legacy keys are simply no longer read/written by the app. Historical root `src/main.js`/`src/firebase.js` are not part of the current `apps/web/index.html → src/main.tsx` entry and were left outside this focused cleanup.

### Package conversion

Home's introductory CTA opens Dossiers. Active package cards and their detail dialog have a primary **Get Started** link directly to Customer `/login?package=<stable-id>`; Login offers Signup while preserving selection. No extra cart or Contact step is involved. The public Login/Signup handoff pages also preserve the same hint if visited. All links use the same tab; no token sharing or automatic login is introduced.

`packages/config/src/packageHandoff.ts` centralizes syntax validation and query construction. It accepts one ID/code consisting of 1–64 letters, digits, underscores or hyphens; malformed, duplicate or empty parameters are ignored. Handoffs contain only that identifier: never name, price, UID, token, payment status or package metadata. The configured Customer origin remains the only permitted external destination.

Customer Login/Signup route to New Operation when a syntactically valid hint is present. Switching between the auth forms retains the hint; already authenticated users take the same path. The Customer guard preserves a package hint when an unauthenticated visitor directly opens New Operation. Internal return destinations are restricted to known Customer route patterns, preventing external redirects and auth loops.

New Operation derives preselection only by matching the hint to the loaded authenticated active catalogue (stable ID, or code for compatibility). It displays the current catalogue description and minor-unit price. Missing/inactive hints do not select anything; manual selection is required. Manual changes take precedence over the original hint. Submission requires a package still present in the loaded catalogue. The unchanged trusted `createOperation` then rereads the authoritative package, checks active state, derives price and creates the immutable snapshot. A hint is not a reservation.

### Contact purpose and limits

Contact now describes general enquiries, support questions and partnerships using the same terminal-style container. Ordering fields and the optional package selector were removed because there is no connected enquiry backend. There is no contact form, submit handler, API call or stored message. The existing `comms@secret-service.agency` address is offered as a mailto link that opens the visitor's email app; mailbox ownership/delivery was not verified. No email provider, collection or ticket system was added. Existing published location information was retained, not independently verified.

### Verification additions

Run the manual typecheck/lint/build commands above; then start web and Customer in separate terminals. No verification, browser or deployment commands were run during implementation.

- From Home and Dossiers, choose an active package and verify only `package` appears in the Customer login URL.
- Test login, signup, auth-form switching, and an already signed-in session; all should reach New Operation with current catalogue data.
- Open Customer `/operations/new?package=<id>` while signed out and verify guard/login preserve the hint.
- Test invalid, missing, duplicate and deactivated package IDs; no unavailable package should be selected.
- Change the package manually and refresh the catalogue; the original hint must not override manual choice.
- Change Admin price between public browsing and creation; Customer must show current catalogue pricing and the Function must remain authoritative.
- Test unsafe external return state; it must fall back to Dashboard rather than redirect externally.
- Confirm Contact has no order fields, simulated success, Firestore writes or storage writes.
- Check mobile same-tab navigation, Back behavior, dialog controls, and production `VITE_CUSTOMER_APP_URL`.

No Functions, Firestore rules, indexes, payments or auth service changes were required for this cleanup. Local web/Customer ports remain 3000/3002; production still needs the explicit Customer HTTPS origin.
