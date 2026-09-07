# Production readiness

Review completed: 2026-09-07. Intended project: `secret-service-37f6b`.

## PRE-DEPLOY

**Status: preparation completed, commercial launch NOT cleared.** This is a source/configuration review, not evidence of a successful build, deployed security rules, enabled services, working credentials or a completed live payment. No build, test, Firebase CLI, Git or deployment command was executed. Read-only repository inspection and edits were authorised. Commands below are operator instructions, not actions already performed.

### Launch gates

1. Choose and verify the real Customer HTTPS origin. `apps/web/.env.local` currently has an empty `VITE_CUSTOMER_APP_URL`; `apps/functions/.env.secret-service-37f6b` currently has `CUSTOMER_APP_URL=http://localhost:3002`. Neither is ready for production. No domain was guessed or local environment file changed.
2. Bind the web, customer and ambassador Hosting targets to actual sites. Only `admin -> secretserviceadmin` is recorded in `.firebaserc`. A local target mapping does not prove that site still exists remotely.
3. Payment-authority source repair is complete; deployment and negative tests remain mandatory. `transitionOperation` now rejects `PAID` and `REFUNDED` before writes. The canonical settlement edge remains for the internal verified-provider helper; Admin/Ambassador/Customer UI or callables cannot invoke it manually. No refund feature was added.
4. Success-payload source repair is complete; validate actual signed test events before launch. Yoco's Checkout payment notification places amount/currency in top-level `payload`. Success now requires positive integer amount, `ZAR`, payment ID and stored checkout identity, with exact payment/snapshot reconciliation. Missing event amounts are never replaced with local values. See the provider source and manual matrix in `PAYMENTS_MILESTONE.md`.
5. Retry/late-event source repair retains up to 20 checkout attempts without eviction, keeps ambiguous creation retries on the same idempotency key and prevents duplicate settlement. Test/live mode changes and unknown legacy modes block checkout creation. Verify concurrent, delayed, failed and duplicate events manually. Already-erased legacy checkout IDs cannot be recovered by this repair; reconcile outstanding payments before key rotation. Do not reuse test operations for live checkout.
6. Run typecheck/lint/build and the smoke/security checklist below. Confirm deployed rules, composite index readiness, runtime IAM/secret access, enabled Email/Password Auth, billing and quotas in the actual project. None were checked remotely.
7. Privacy and Terms are visible MVP drafts, not launch-approved policies. Obtain legal/business review and verify the published contact mailbox, location, brand assertions and content rights before commercial launch.
8. Do not offer zero-price packages for the paid flow without resolving its semantics: package management and operation creation accept zero, while checkout requires a positive amount. Review the real catalogue manually; do not silently rewrite historical prices.

Retain the previous known-good source revision, build artefacts, Hosting release IDs, rules/index configuration, public environment configuration and Secret Manager version references before a release. Do not store credential values in this document.

## ENVIRONMENT VARIABLES

### Files prepared in this pass

Created `PRODUCTION_READINESS.md` and `apps/functions/.env.example`.

Modified `firebase.json` (Ambassador Hosting target and Functions build hook), `.gitignore` (allow the blank Functions env example), all four frontend `.env.example` files (explicit project and current mode guidance), `apps/admin/src/auth/AdminAuthGuard.tsx` and `apps/admin/src/pages/AdminLoginPage.tsx` (strict role and development-only mock notice), `apps/admin/src/data/adminReadRepository.ts` and `apps/customer/src/data/customerReadRepository.ts` (production Firestore selection), `apps/functions/src/payments/yocoProvider.ts` (bounded diagnostic codes instead of provider prose), `apps/functions/src/commands/createOperationPayment.ts` and `apps/functions/src/commands/savePackage.ts` (remove temporary stage noise).

In the initial preparation pass, live/local env files, `.firebaserc`, generated build output, rules/indexes, payment settlement/lifecycle behavior and existing product features were not changed. The subsequent focused payment-integrity repair is documented below. Admin/Customer use their existing explicit ImportMeta typing convention, extended for Vite's boolean production flag; no compiler settings or dependencies were changed.

### All four frontends

Set these in each app's production build environment, normally its own ignored `.env.production.local`, or the equivalent build-system environment. The root monorepo `.env` is not the normal Vite env directory for workspace scripts.

| Variable | Required value/source |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Public Firebase web app API key from the intended project's registered web app |
| `VITE_FIREBASE_AUTH_DOMAIN` | Its approved Auth domain; local app files currently use `secret-service-37f6b.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `secret-service-37f6b` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Exact registered Firebase web configuration value; do not guess the bucket suffix |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Exact registered Firebase web configuration value |
| `VITE_FIREBASE_APP_ID` | Registered web app ID in the same project; different frontend registrations are acceptable |
| `VITE_DATA_SOURCE` | `firestore` explicitly |

The shared config reader requires all six Firebase configuration fields, including bucket and sender ID even if those services are not otherwise used here. These are public configuration, not Admin credentials. Do not put Yoco secrets, service-account JSON, passwords or private keys in any `VITE_` variable: Vite exposes them in the browser bundle.

- **Web:** all variables above plus `VITE_CUSTOMER_APP_URL=<actual Customer HTTPS origin>`. This is the only additional required app-specific variable. No trailing path, query, fragment, credentials, localhost or public-site origin. `VITE_FIREBASE_MODE` is a legacy fallback only; omit it. `VITE_FIREBASE_MEASUREMENT_ID` in the example and unprefixed `measurementId` in local files are not used by the shared configuration; no analytics integration is implied.
- **Customer:** common variables only. `VITE_OPERATION_WRITE_MODE` is obsolete/unused; creation and archiving follow the selected repository and trusted callable boundary.
- **Admin:** common variables only. `VITE_OPERATION_WRITE_MODE` is obsolete/unused; authoritative commands follow `adminDataMode`.
- **Ambassador:** common variables only; real role-based Auth is required even when developing with mock data.

This pass makes Admin and Customer production builds always select Firestore, matching Web/Ambassador. Local development can still use mock adapters. Missing Firebase configuration fails rather than becoming a production demo. Explicit production environment configuration remains mandatory; this is not a check that the remote project is correct.

### Inspected local configuration

The four app `.env.local` files identify `secret-service-37f6b` and `firestore`. Admin's additional `.env` matches. The legacy root `.env` identifies `secret-service-mock`; it was left untouched because workspace Vite commands run from each app. Do not copy it into a production app. Shell/build-system environment overrides and `.env.production*` files must be checked manually; their live values cannot be inferred from examples. Secret-looking values were not printed during inspection.

Vite production configuration is baked in at build time. Changing a Hosting setting after upload does not replace it: rebuild and redeploy affected frontends. Mode-specific local files take precedence over generic local files; an existing process environment can override both.

### Functions configuration

`apps/functions/src/payments/paymentConfig.ts` uses public `defineSecret`/`defineString` factories with portable `ReturnType` annotations:

- `CUSTOMER_APP_URL`: non-secret parameter, read inside checkout handling. Set it in `apps/functions/.env.secret-service-37f6b` to the **same actual HTTPS Customer origin** as Web's `VITE_CUSTOMER_APP_URL`, then redeploy `createOperationPayment` (or Functions). `apps/functions/.env.example` is a blank template, not deployable configuration.
- `YOCO_SECRET_KEY`: Secret Manager only; bound to `createOperationPayment`.
- `YOCO_WEBHOOK_SECRET`: Secret Manager only; bound to `yocoWebhook`.

No other `defineSecret` was found in Functions source. No Yoco/Admin secret variable was found in inspected frontend env key names. Remote secret existence, contents, version selection and IAM are not verified. Do not read secret values into logs or commit them. The backend return URL helper currently accepts HTTP as well as HTTPS; therefore the production HTTPS-origin check is an explicit operator gate, not a claim of runtime enforcement.

## FIREBASE

Use the explicit `--project secret-service-37f6b` on every operator command. `.firebaserc` default and `ssproject` aliases both identify that project. Do not switch projects or initialise a new one during deployment.

Verify billing, required APIs, Functions deployment permission, runtime Firestore access and Secret Manager access in the Console. Frontend API keys do not grant Admin SDK authority. Add the actual frontend domains to Firebase Authentication's authorised domains where required; use hostnames without scheme/path. Enable the existing Email/Password provider. Do not introduce new providers, public Admin signup or email-based role grants.

### Auth findings

- Shared service uses Firebase Email/Password signup/signin/signout and ID-token observation. Passwords are passed to Firebase Auth, not manually persisted or logged by the inspected auth service. Firebase browser-local persistence is configured.
- Admin guard and login redirect now require `claims.role === 'admin'`, consistent with `requireAdmin` and rules. Legacy boolean fields still exist in the shared claim adapter for compatibility but are not accepted by these Admin UI checks.
- Ambassador guard and callable require `role === 'ambassador'`; delivery commands also check assigned UID, active roster and account mapping. No public Ambassador signup or email-based authorization was found.
- Customer endpoints require authenticated identity and ownership where applicable; no special customer custom claim is required.
- Disabled-login errors are mapped by the shared service. Already-issued tokens and claim revocation are not instantaneously invalidated by these operator scripts, guards or callable helpers. No per-request revoked-token/Admin Auth user lookup is implemented. Treat urgent disable/revoke response as a separate operational requirement; test token refresh and denial, and do not promise immediate invalidation.
- Claim changes require sign-out/sign-in or the existing refresh-claims action. User identity/profile role fields must not substitute for trusted token claims. No MFA added.

## FUNCTIONS

`apps/functions` is an ESM Gen 2 workspace with Node `22`, entry `lib/index.js`, source `src`, and compiled output `lib`. The new Functions predeploy hook runs the existing build when the operator deploys, reducing the risk of publishing stale generated output. It was not run in this pass. Do not edit `lib` or `tsconfig.tsbuildinfo` manually. Typecheck alone does not produce deployable JS.

All 15 exports in `src/index.ts` were traced:

| Export | Boundary and readiness notes |
| --- | --- |
| `createOperation` | Authenticated; server binds customer UID, validates active package/campus and dates/settings; transaction creates operation, internal record, activity and safe projection. No cross-request idempotency key; retry after an ambiguous response needs care. |
| `transitionOperation` | Strict Admin; persisted lifecycle validation, activity and both projections. Explicit actor restriction denies PAID/REFUNDED; negative verification remains a launch gate. |
| `savePackage` | Strict Admin; input validation, immutable code, timestamps, transactional upsert; positive paid-package configuration remains an operator gate. |
| `getAdminDirectory` | Strict Admin; allowlisted Auth/directory projection, first 500 users and operations, truncation indicator. Not full pagination. |
| `saveAmbassador` | Strict Admin; typed operational validation; preserves existing Auth UID link; no browser write. Create retries can produce duplicate roster records. |
| `saveCampus` | Strict Admin; stable code, create conflict detection, activation and timestamp validation. |
| `assignAmbassador` | Strict Admin; persisted eligible state, active/available/campus checks; assignment activity and both projections. Roster records without an Auth UID can be assigned but cannot use the Ambassador portal until linked. |
| `ambassadorTransitionOperation` | Strict Ambassador; UID/roster/account link checks inside transaction; limited actions, failure reason, canonical validation, audit and projections. |
| `getCustomerCatalog` | Authenticated; active packages, safe active campuses and safe settings. |
| `getPublicCatalog` | Intentionally anonymous callable; fixed active-package query, 200-record limit, allowlisted marketing fields; no writes. |
| `setCustomerOperationArchived` | Authenticated owner; terminal-state validation and projection-only archive preference. |
| `getAdminSettings` | Strict Admin; server-only settings read. |
| `saveAdminSettings` | Strict Admin; validated settings mutation with server timestamp/actor. |
| `createOperationPayment` | Authenticated owner; immutable positive ZAR minor-unit amount, payment reservation/idempotency key, secret binding. Preserve live-cutover gates above. |
| `yocoWebhook` | Intentionally public HTTP POST; signing secret, HMAC over raw body, constant-time comparison and 180-second timestamp window; internal transactional settlement. Not a browser callable. |

`confirmOperationPayment` is an internal helper, not a deployed public export. It updates payment, operation, activity and customer projection atomically. Same winning checkout/payment duplicates return without writes; additional successful checkouts record their outcome and log an anomaly without changing settlement or paidAt. Webhook lookup uses uniquely recorded checkout history (plus legacy current IDs), not customer-supplied success state. Verify all paths manually.

`getAdminApp` lazily finds `[DEFAULT]` or initialises it; Firestore/Auth helpers receive that explicit app. No direct uninitialised `getFirestore()`/`getAuth()`/`getApp()` payment call remains. No import-time Firebase network query was found in exported Function modules; parameter declarations are not secret reads. Most exports use the SDK default region; payment exports explicitly use `us-central1`. The shared browser Functions client also uses the default region. Confirm all deployments remain in `us-central1` rather than migrating implicitly.

Useful payment/webhook start, validation, reservation, correlation, settlement and failure logs remain. Removed temporary Admin-initialisation and per-step package debug logs. Provider HTTP error logs now exclude raw bodies/free-form provider prose, retaining status, operation/payment references, amount/currency and bounded code/type fields. No Authorization header, secret value or full payment instrument is intentionally logged. Logs still contain operational identifiers: restrict access and decide retention. Other unexpected SDK errors still require operational log review.

Several older callable handlers rely on SDK generic error handling for malformed unexpected input; they do not all share the same parser/error wrapper. Do not call static inspection a penetration test. No function-wide rate limits/max-instance policy was introduced; review budget alerts, quota and abuse exposure, particularly the anonymous catalogue and account creation.

## FIRESTORE

No rules/index edits were justified by the inspected read queries. Existing definitions cover:

- `operations`, `operationInternal`, `operationActivity`, `payments`, `ambassadors`, `campuses`: strict Admin reads; no browser writes.
- `customerOperations`: authenticated owner or Admin reads; no browser writes. Customer queries include the UID ownership condition.
- `ambassadorOperations`: matching UID, strict Ambassador role, active linked roster; list limit at most 200. Fixed UID-keyed account/roster lookups support the query.
- `ambassadorAccounts`: no direct client reads or writes.
- `packages`: Admin or authenticated active-record reads. **Anonymous direct reads are denied**; public catalogue uses its callable. Existing signed-in active-package reads were not removed.
- `systemSettings` and all unmatched paths: denied by catch-all; reads/writes are through trusted Functions.

Composite indexes: packages `active + displayOrder`; ambassadorOperations `ambassadorUid + updatedAt desc`; customerOperations `customerId + createdAt desc`; operationActivity `operationId + timestamp asc`; payments `operationId + createdAt desc`. Checkout lookup uses normal single-field indexes: `providerCheckoutId` equality and `providerCheckoutIds` array membership. No additional composite index is needed. No remote index readiness or manually disabled single-field index was inspected.

Security Rules skill assessment (static, not emulator-verified):

```json
{
  "score": 4,
  "summary": "Strict claim/ownership read boundaries and denied client writes; deployed state and negative tests remain unverified.",
  "findings": [
    {
      "check": "Resource exhaustion / query limits",
      "severity": "minor",
      "issue": "Admin operation/internal subscriptions and customer history queries are unbounded; only ambassador lists have an explicit rules query limit.",
      "recommendation": "Monitor MVP volume and add compatible pagination/query limits in a focused follow-up; do not break current queries by changing rules alone."
    }
  ]
}
```

Create/update bypass and self-assigned role checks: all client writes are denied, so clients cannot create then mutate privileged records. Authority comes from signed token role/UID, not incoming role fields. Field sizes/types for writes are the trusted Functions' responsibility, not a permissive browser rule. The Rules score is **not** a score for payment backend readiness.

Manual deployment, after review:

```powershell
firebase deploy --only firestore:rules,firestore:indexes --project secret-service-37f6b
```

Wait for required indexes to finish building before application smoke tests. Do not approve removal of remotely existing indexes without understanding other deployed queries.

## HOSTING

Use classic Firebase Hosting multisite for the four Vite SPAs; no SSR/App Hosting infrastructure is needed. The Hosting skill informed target separation and SPA rewrites. No actual new site IDs were invented.

| Target | Workspace build | Output uploaded | Site binding known locally |
| --- | --- | --- | --- |
| web | `npm run build:web` | `apps/web/dist` (explicit Vite outDir) | Not bound |
| customer | `npm run build:customer` | `apps/customer/dist` (Vite default) | Not bound |
| admin | `npm run build:admin` | `apps/admin/dist` (Vite default) | `secretserviceadmin` |
| ambassador | `npm run build:ambassador` | `apps/ambassador/dist` (Vite default) | Not bound |

All four targets now rewrite unmatched URLs to `/index.html`, preserving actual static files. This supports direct navigation to each app's router paths; it is not an authentication boundary. App routers contain the required dashboard/operations/account paths, Admin directory/packages/moderation/settings paths, and public `/dossiers`, `/contact`, `/faq`, `/privacy`, `/terms`, `/login`, `/signup`. Customer payment return routes also exist. Verify refresh/deep links on the deployed origins; source inspection alone cannot prove HTTP routing works.

Dev ports (3000/3002/3001/3003), ngrok allowed-host settings and Vite `open` only affect local development, not Hosting. No random ngrok hostname was added or copied into production configuration.

### Manual site setup

First inspect the real project:

```powershell
firebase hosting:sites:list --project secret-service-37f6b
```

Choose distinct existing sites or available new IDs. Replace every angle-bracket placeholder below with the actual selected ID; these templates are intentionally not executable until that choice is made. Do **not** recreate the existing Admin site or map multiple apps to one site. Run each create command only if that site does not already exist:

```powershell
firebase hosting:sites:create <WEB_SITE_ID> --project secret-service-37f6b
firebase hosting:sites:create <CUSTOMER_SITE_ID> --project secret-service-37f6b
firebase hosting:sites:create <AMBASSADOR_SITE_ID> --project secret-service-37f6b
firebase target:apply hosting web <WEB_SITE_ID> --project secret-service-37f6b
firebase target:apply hosting customer <CUSTOMER_SITE_ID> --project secret-service-37f6b
firebase target:apply hosting ambassador <AMBASSADOR_SITE_ID> --project secret-service-37f6b
```

The existing Admin mapping needs no change if remote verification agrees. Connect/verify chosen custom domains in the Console if required, wait for HTTPS readiness, then record the actual Customer origin in both configuration locations. `.firebaserc` target edits are non-secret but must be reviewed before deployment.

## DEPLOYMENT ORDER

**Do not run the live sequence until launch gates above are resolved.** All commands below run manually from the repository root unless stated otherwise.

1. Preserve rollback material, resolve the payment/security gates, verify Node 22 and existing dependency installation/lockfile, and confirm project access. Determine site IDs/origins before building. Review environment precedence and remove stale mock/localhost overrides in the release environment.
2. Run the verification commands. Configure target mappings/HTTPS origins, Email/Password Auth, authorised domains, non-secret Functions parameter and current test secrets. Record deployed versions and existing pending payment attempts.
3. Deploy reviewed Firestore rules/indexes; wait for indexes.
4. Build/deploy Functions using the current test secret bindings and the real Customer HTTPS return origin. Do not overwrite working secrets during the preparation deployment. Confirm the deployed webhook URL from the CLI/Console, rather than guessing a Gen 2 hostname.
5. Build all four frontends with their actual production variables, then deploy Hosting. These actions may expose sites publicly: only perform them when the release gate permits. No pre-launch access-control infrastructure was added by this pass.
6. Verify test-mode end-to-end operation on these domains; keep commercial traffic closed operationally. Then perform the controlled Yoco live cutover below and the post-deploy smoke tests. Changing only server Yoco secrets does not require rebuilding frontends; changing a Vite origin does.

Verification (not executed):

```powershell
npm run typecheck
npm run lint
npm run build
```

Deploy/build sequence after all gates and configuration decisions:

```powershell
firebase deploy --only firestore:rules,firestore:indexes --project secret-service-37f6b
# Wait for indexes to become ready before proceeding.
$env:FUNCTIONS_DISCOVERY_TIMEOUT="30"
firebase deploy --only functions --project secret-service-37f6b
npm run build:web
npm run build:customer
npm run build:admin
npm run build:ambassador
firebase deploy --only hosting:web,hosting:customer,hosting:admin,hosting:ambassador --project secret-service-37f6b
```

The Functions deploy now invokes its build hook automatically. The earlier root `npm run build` also builds Functions and all frontend workspaces; the per-app builds above make the final env-dependent deployment artefacts explicit. Never deploy a stale `dist` directory because a build failed.

## YOCO CUTOVER

This is an operator plan, not a credential rotation performed here. Existing provider contract: POST `https://payments.yoco.com/api/checkouts`, Bearer secret, JSON body, integer minor-unit `amount`, `ZAR`, `Idempotency-Key`, absolute return URLs, `clientReferenceId`, `externalId`, and operation/payment metadata. No client redirect can settle payment. Registration is not performed at import/startup.

1. Complete the payment launch-gate repairs and test signature verification, mismatch rejection, retries, duplicate success and projection updates. Reconcile outstanding test/live attempts before switching; preserve previous secret versions and operational references without exposing values. There is no new global payment-disable switch in this pass. Stop approving new payable operations during the maintenance window; existing pending checkouts require explicit handling.
2. Obtain the merchant's live Yoco secret through the approved Yoco account process. Confirm merchant/domain approval requirements with Yoco. Set the live secret interactively; never put its value in a shell argument, source file or Vite variable:

```powershell
firebase functions:secrets:set YOCO_SECRET_KEY --project secret-service-37f6b
$env:FUNCTIONS_DISCOVERY_TIMEOUT="30"
firebase deploy --only functions:createOperationPayment --project secret-service-37f6b
```

3. Obtain the actual deployed `yocoWebhook` URL from the Functions Console/deployment output. Register that production HTTPS URL with Yoco under the same live merchant/key context. The repository's `PAYMENTS_MILESTONE.md` describes operator registration via POST `https://payments.yoco.com/api/webhooks`, Bearer authentication, and `name` plus `url` JSON fields. Use the provider's current approved operator/API workflow; no registration script, guessed URL, or secret-bearing curl command is supplied here. Do not register a public SPA URL or a localhost/ngrok test URL.
4. Securely capture the signing secret returned by registration (the adapter expects `whsec_` format), store it, then redeploy the webhook:

```powershell
firebase functions:secrets:set YOCO_WEBHOOK_SECRET --project secret-service-37f6b
firebase deploy --only functions:yocoWebhook --project secret-service-37f6b
```

5. Verify unauthenticated transport to the webhook is permitted by its deployed HTTP/Cloud Run IAM configuration, while missing/invalid signatures are rejected by the handler. It must not require Firebase Auth, Firebase App Check or an interactive login from Yoco. Do not strip signature headers or replace the raw body in a proxy.
6. Only after both live bindings are deployed, create a fresh, controlled real operation, approve it and perform a real payment with the business's approval. Confirm the amount, currency, provider checkout reference, signature-verified event, one payment-confirmed activity and `PAID` authoritative state plus Customer projection. Verify Admin and Customer both update; continue the approved fulfilment test if appropriate. Do not automatically refund the controlled payment: refund integration is not provided here.
7. Review logs manually:

```powershell
firebase functions:log --only createOperationPayment --project secret-service-37f6b
firebase functions:log --only yocoWebhook --project secret-service-37f6b
```

Freshly signed provider replay may recover a delayed matching event, but an old timestamp is rejected by the 180-second window. Confirm Yoco's actual replay capabilities; never bypass signature checks or manually mark Firestore paid as a recovery shortcut. Keep test and live webhook registrations/keys consistent. Do not rotate away an old signing secret while events signed with it still need settlement: this code accepts one signing secret, not a dual-key transition.

## AMBASSADOR PROVISIONING

Use trusted operator Application Default Credentials with the necessary Auth/Firestore permissions, obtained outside the repository. Firebase CLI login alone is not an assurance that these Node scripts have ADC. Do not commit a service-account file. Explicit project confirmation is required by the Ambassador scripts.

1. Create the real Auth user in Firebase Authentication (or an already approved operator process). Record the UID; do not put passwords in scripts.
2. Create/review the Admin roster entry, active/availability state and campus eligibility; record its roster ID.
3. Grant the role by email, then link UID to the existing roster using the built Functions helpers:

```powershell
node apps/functions/scripts/ambassadorClaims.mjs grant --email <EXISTING_EMAIL> --project secret-service-37f6b --confirm-project secret-service-37f6b
npm run build --workspace=@secret-service/functions
node apps/functions/scripts/linkAmbassadorAccount.mjs --project secret-service-37f6b --confirm-project secret-service-37f6b --ambassador <ROSTER_ID> --uid <AUTH_UID>
```

Replace placeholders manually. Grant preserves unrelated claims and refuses an Admin role/legacy Admin claim or another existing role. Link validates enabled Auth and Ambassador role, updates roster/account mapping and repairs existing assignment projections; it does not grant claims. Sign out/in, then test the Ambassador portal with that account and an actual eligible assignment.

Revocation, when explicitly intended:

```powershell
node apps/functions/scripts/ambassadorClaims.mjs revoke --email <EXISTING_EMAIL> --project secret-service-37f6b --confirm-project secret-service-37f6b
```

It removes only the Ambassador role, not Auth users, other claims, roster records or links, and does not revoke already-issued tokens. Deactivate a roster through the existing Admin command when operational access must be blocked by roster checks. Admin provisioning remains the separate existing `adminClaims.mjs` script; do not use Ambassador accounts for administration.

## SMOKE TESTS

- Directly open and refresh every required SPA route on each actual HTTPS origin. Check static assets and the intended app rather than a shared/misbound site. Missing Auth should route to login, not reveal operational content.
- Public: active catalogue loads without signing in; inactive packages are absent. Test `/faq`, `/privacy`, `/terms`, `/contact`, `/login`, `/signup`. Verify the legal draft notices remain until legal review, footer links, same-tab Customer handoff and preservation of a selected package hint. Invalid/missing portal configuration must not fall back to production localhost.
- Contact: deliberately has **no submission backend or form**; existing mailto opens the user's mail app. Verify the mailbox and business contact details externally. This is an accepted limitation only if the business chooses email-only contact; otherwise it is a launch blocker. No CRM/email service was added.
- Auth: valid/invalid login, disabled account, signout, token refresh after role changes; customer signup in Customer only. A legacy `admin: true` without `role: admin` must not grant Admin UI or API access. Wrong-role Ambassador/Admin must be denied. Verify a disabled/revoked existing session and record the token-validity limitation.
- Rules: anonymous direct package/operation reads denied; authenticated Customer A cannot read Customer B's projection; no customer reads of internal/activity/roster/account-link data; all direct authoritative writes denied. Strict Admin reads succeed. Ambassador A cannot read or mutate B's assignments; unlinked/inactive roster denies access; UID-filtered, limited list succeeds.
- Catalogue/settings: configure active paid packages (positive integer ZAR minor units), active campuses, delivery windows and realistic lead times through the existing Admin UI. No production seeding script supplied. Verify unavailable/inactive selections are rejected server-side and snapshots preserve historical prices/location names.
- Workflow: fresh creation starts in review; approval atomically moves to payment required; verify direct Admin PAID/REFUNDED rejection. Complete controlled checkout and the detailed integrity matrix in `PAYMENTS_MILESTONE.md`: duplicate signed success, malformed/tampered/wrong-amount/wrong-currency/missing-field rejection, return-before-webhook, failed payment, concurrent retries and delayed older success. A browser success URL alone must never settle.
- Fulfilment: eligible active linked Ambassador assignment, reassignment privacy, out for delivery, failure with internal reason, reviewed retry, delivered then completed. Confirm authoritative activity, Admin realtime state, Customer safe state and Ambassador projection. Internal failure reasons and ambassador contact details must not leak to the customer.
- Lifecycle cancellation while payment is in flight needs explicit review: a later valid payment can otherwise fail the current transition check. Do not resolve this by loosening settlement validation.
- Mobile layouts and keyboard controls, session expiration, empty/error/retry states; inspect browser console and Functions logs for configuration/permission failures without exposing credentials.

## APP CHECK

No enforcement was enabled and no frontend App Check SDK integration was added. Stage after launch readiness: register actual frontend origins/provider, add token acquisition in a focused change, observe valid/invalid metrics without enforcement, exercise all four apps and the public catalogue, then enable enforcement per supported callable/rules service with a rollback plan. Debug tokens must never ship as production configuration. Keep `yocoWebhook` outside Firebase App Check enforcement because Yoco cannot supply Firebase client tokens; its signature is the authority. App Check is not a replacement for roles/ownership or budget controls.

## ROLLBACK

Do not use database deletion, history resets or test credentials as a blanket rollback. Every rollback needs an explicit operator decision and compatibility review.

- **Frontend regression:** select the recorded previous release in Firebase Hosting's release history for the affected site only and use its rollback action. Alternatively rebuild the known-good source with its recorded public env and deploy only that target (`firebase deploy --only hosting:customer --project secret-service-37f6b`, replacing the target as appropriate). A frontend rollback does not undo backend writes or change server URL parameters. Verify payment return routes still match.
- **Functions regression:** prepare the last known-good compatible source/lockfile in a separate operator-managed checkout, run its build, and redeploy only affected named Functions. Example: `firebase deploy --only functions:createOperationPayment --project secret-service-37f6b`. Restore the corresponding non-secret parameters and supported secret bindings deliberately. There is no custom automatic rollback mechanism in this repo. Avoid blindly deploying an older index that omits newer exports or accepting Function deletion prompts.
- **Rules regression:** restore the saved restrictive known-good rules file and run `firebase deploy --only firestore:rules --project secret-service-37f6b`. Do not temporarily allow all reads/writes. Re-test role/ownership denial. Keep compatible indexes; do not delete data or indexes as an emergency substitute for a rules fix.
- **Yoco issue:** pause new payable approvals and coordinate handling of already-pending checkouts. Keep the signed webhook able to process existing live events whenever safe. Determine whether the cause is code, configuration or provider-side before changing keys. Restore a valid matching secret through Secret Manager and redeploy its bound Function if necessary; never switch live transactions to test keys, disable signature checking, or overwrite payment records. Reconcile outstanding event/checkout references before resuming. No automatic refund/recovery endpoint or universal payment kill switch exists.

## KNOWN LIMITATIONS

Payment gates, missing origins/site mappings, legal/contact review and unexecuted verification prevent a production sign-off. Runtime IAM, remote rules/indexes, secret versions, provider approval and existing data integrity remain unknown. The deployment hook is prepared, not verified on this machine's shell/CLI version.

Admin/customer history reads remain unbounded; the directory caps at 500 records and the public catalogue at 200. Public catalogue abuse controls and App Check are deferred. Operation creation has no cross-request deduplication. Payment history is a bounded in-document reconciliation mechanism, not a full ledger; already-erased references, persistent ambiguous provider requests, cancellation during checkout and additional successful charges require operator follow-up. Provider idempotency retention was not established by the inspected API reference. The current secret handling does not support dual-signature-key cutover. Refund integration, notifications and a real contact submission backend are not implemented here. No product features, lifecycle redesign, automatic migration, secret rotation, seeded data or deployment was added.

## FOCUSED PAYMENT-INTEGRITY REPAIR

Source changes: `apps/functions/src/commands/transitionOperation.ts`, `apps/functions/src/commands/createOperationPayment.ts`, `apps/functions/src/domain/operationTypes.ts`, `apps/functions/src/payments/confirmPayment.ts`, `apps/functions/src/payments/yocoWebhook.ts`; new helper `apps/functions/src/payments/paymentAttempts.ts`. Documentation: this file and `PAYMENTS_MILESTONE.md`. No frontend, rules, index configuration, generated output, credentials or provider request contract changed in this repair.

- **Authority:** structurally valid lifecycle edges do not imply actor permission. Only the verified webhook calls internal settlement. Admin refund/paid actions are denied; delivery-only Ambassador permissions remain unchanged. Existing Admin action maps already hide these actions. Mock adapters remain separate from trusted Firebase commands.
- **Reconciliation:** require the documented success payload fields and a unique checkout created/saved by the server. Check history membership, record identity, ownership and immutable amount/currency again transactionally. No metadata-only fallback. The old success parser's guessed `data` variants and substituted local values were removed.
- **Retry:** reuse pending checkout URLs. Ambiguous initiation errors retain the key and return-URL snapshot. Only signed current-checkout failure permits a new key; preserve all registered IDs up to the cap. Never evict old references or silently switch test/live mode. A current legacy checkout can still receive a webhook without migration; unknown-mode creation/retry needs review.
- **Late/duplicate events:** the first valid retained success wins while the operation is payable. Same winning checkout/payment returns 2xx without activity or timestamp changes. Other successful checkout IDs produce `additional_payment_success` logs and retained outcomes, not a second settlement/refund. Old failures cannot fail a newer checkout; no failure undoes PAID. Current-record merges prevent a late checkout response from overwriting settlement.
- **Replay/security:** raw-body signature verification and the 180-second delivery timestamp window remain unchanged. Fresh signed retries are separate from settlement idempotency. Safe customer CONFIRMED projection and archive preferences remain intact; no browser writes or new public settlement endpoint.

These are static source corrections, not live-payment clearance. Follow the full manual matrix in `PAYMENTS_MILESTONE.md`, typecheck/lint/build, deploy the new Functions build, and inspect actual signed Yoco test deliveries. Investigate additional-success logs and unresolved legacy references using trusted provider records; do not grant manual PAID authority or fabricate refund automation as a workaround. Remaining origins, Hosting mappings, catalogue, legal, IAM/secret and runtime gates above still apply.

The Firebase Hosting, Auth and Security Rules skills guided SPA separation, claim-alignment and the static rules checklist. Their execution steps were not run. Operator command conventions were cross-checked with [Firebase Hosting multisites](https://firebase.google.com/docs/hosting/multisites) and [Functions environment/secrets](https://firebase.google.com/docs/functions/config-env). Yoco registration details above are from the existing repository milestone; confirm the current merchant workflow with [Yoco Checkout API guidance](https://support.yoco.help/en/articles/739322-yoco-checkout-api) before cutover.
