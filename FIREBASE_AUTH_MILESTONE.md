# Secret Service Firebase Auth Milestone

## Outcome

Firebase Authentication is now the intended identity/session provider for the admin and customer applications. Authentication is real when Firebase web configuration is supplied; operation data remains mock and session-local. No Firestore operation persistence, Cloud Functions, rules, indexes, payments, or deployment were added.

## Firebase client architecture

`packages/firebase` owns the browser-only Firebase boundary:

- `config.ts` reads and validates public `VITE_FIREBASE_*` configuration.
- `client.ts` initializes one Firebase app with `getApps()`/`getApp()` and configures Firebase-managed local auth persistence.
- `authService.ts` wraps email/password signup, login, logout, ID-token observation, current-user adaptation, claim refresh, and safe error mapping.
- `types.ts` exposes small application-facing `AuthUser`, `AuthSession`, `AuthClaims`, and role types rather than leaking Firebase `User` throughout the apps.

No Admin SDK or service credentials are present. The `firebase` browser dependency is declared by the new workspace package. Application imports currently use the shared source boundary directly so the existing one-line app manifests do not need unsafe blind rewrites; this can be switched to the package export during a later package-manifest cleanup.

## Environment variables

Copy the appropriate app example to a non-committed `.env.local` in both `apps/admin` and `apps/customer`:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

These Firebase web values identify the project and are not server secrets. Never place service-account JSON, private keys, webhook secrets, or Admin SDK credentials in a `VITE_` variable or frontend file.

Missing configuration produces a clear authentication-unavailable message instead of a low-level initialization error.

## Customer authentication

`CustomerAuthProvider` subscribes once to Firebase ID-token state and provides async signup, login, and logout. `CustomerAuthGuard` waits for initial resolution before rendering protected content. The customer login form maps common provider failures to friendly messages. Signup collects first/last name, stores only the combined Firebase Auth display name, and deliberately does not invent a Firestore profile.

Successful customer signup/login routes to the existing customer portal. Customer operation records remain mock data by design.

## Admin authentication and authorization

`AdminAuthProvider` observes Firebase session and claims. Admin has login/logout only—there is no admin signup route. `AdminAuthGuard` waits for auth resolution and requires a trusted claim in either supported architecture form:

- `admin: true`, or
- `role: "admin"`.

An authenticated user without the claim sees an access-denied screen with Sign Out and receives no protected dashboard content. Email address and domain are never used as authorization signals. The browser cannot assign or mutate claims.

## Auth lifecycle

1. Provider starts in `loading: true`.
2. Firebase restores its persistent browser session and emits ID-token state.
3. The shared service adapts the user and reads claims.
4. Customer guard requires a user; admin guard requires user plus admin claim.
5. Logout delegates to Firebase and the observer clears application state.
6. Claim refresh is exposed for a future provisioning/refresh UX. A newly assigned claim normally requires forced token refresh or sign-out/sign-in.

Passwords, access tokens, and ID tokens are never copied into custom storage. Previous hardcoded mock credentials are not part of the new auth path and must not be used for Firebase accounts.

## Multisite and cross-origin behavior

Firebase Hosting sites may use origins such as `www`, `account`, and `admin`. Browser persistence is origin-scoped, so do not assume a user authenticated on one subdomain is already authenticated on another. The public website should link to customer `/login` or `/signup`; the customer site establishes its own Firebase session. Admin authentication remains separate. Each deployed origin/domain must be listed under Firebase Authentication authorized domains.

This milestone does not add cross-origin SSO. If seamless SSO becomes a requirement, design an explicit trusted redirect/session exchange rather than copying tokens through URLs or browser storage.

## Manual setup required

1. Create or select a development Firebase project.
2. In Authentication, enable the Email/Password provider.
3. Register the admin and customer web applications, or intentionally use one shared Firebase web app registration for the same project.
4. Add local development hosts and future Hosting/custom domains to Authentication authorized domains.
5. Copy the public web configuration into untracked `apps/admin/.env.local` and `apps/customer/.env.local` files using the included examples.
6. Create a development customer through the customer signup UI.
7. Create a development admin user in Firebase Authentication. Do not expose public admin registration.
8. In a later trusted tooling environment, use Firebase Admin SDK to assign `admin: true` or `role: "admin"` as a custom claim.
9. Sign the admin out and back in, or force-refresh the ID token, after assigning the claim.

Admin claims require Admin SDK, a trusted backend, or a secure provisioning script. They cannot and must not be assigned by frontend code. No service-account secret belongs in either app's environment file.

## Manual verification

### Customer

1. Sign up with a new email/password; confirm authentication and customer-dashboard navigation.
2. Sign out; confirm protected routes redirect to login.
3. Log in again; confirm the dashboard appears and refresh preserves the Firebase session.
4. Try invalid credentials, malformed email, duplicate signup, weak password, and network interruption; confirm safe errors.

### Admin

5. Visit a protected admin route signed out; confirm redirect to login without protected-content flash.
6. Sign in with a Firebase user lacking an admin claim; confirm the unauthorized screen and Sign Out.
7. Sign in with a properly claimed admin account; confirm dashboard access.
8. Sign out; confirm protected routes become inaccessible.

Also confirm old hardcoded mock credentials no longer grant access unless someone separately created matching Firebase users; admin/customer mock operation screens and the admin workflow should continue working because their data repositories were not migrated.

## Manual commands

Run these yourself from the repository root:

```text
npm install
npm run typecheck
npm run lint
npm run build
npm run dev:admin
npm run dev:customer
```

No command above was run as part of the implementation.

## Known limitations and future integration points

- Customer profile fields beyond Firebase display name await the Firestore user-profile milestone.
- Admin claim provisioning tooling is intentionally deferred and must run in a trusted environment.
- Email verification, password reset, MFA, OAuth, emulator configuration, and ambassador auth remain later work.
- Operation data is still mock. Future repositories will use Firestore customer projections and trusted backend workflow commands described in `FIREBASE_ARCHITECTURE.md`.
- Cross-origin SSO is not implemented.

## Typecheck repair

The initial Firebase Auth routing change created new `App.tsx` files with screen and shell names inferred from the milestone description instead of matching the repository's established module names. That caused TypeScript module-resolution failures for both applications. The correction must reconnect the auth routes and guards to the existing dashboard, operations, detail, account, and shell exports; those screens must not be recreated as placeholders.

The shared Firebase configuration initially modeled `import.meta.env` values as `string | boolean | undefined`. Indexing that record carried the boolean member into the configuration object, so validation could not safely call `.trim()`. Configuration now passes every value through an explicit `readString` boundary. The resulting Firebase configuration fields are `string | undefined`, and boolean values cannot reach normalization.

For this milestone the shared browser package remains intentionally Vite-aware because it is consumed only by the three Vite frontend applications. It declares the small `ImportMeta.env` shape locally rather than assuming that an importing application's `vite/client` declaration is visible while compiling shared source. Moving environment collection into each app remains a reasonable future refinement if this package gains non-Vite consumers.

### Admin source restoration

An inventory of `apps/admin/src` found that the Firebase Auth router had not merely misreferenced renamed files: all five route targets and their supporting pre-auth dashboard/workflow modules were absent. Only `App.tsx`, `main.tsx`, `AdminLoginPage.tsx`, `AdminAuthProvider.tsx`, and `AdminAuthGuard.tsx` remained. There were no alternative `layouts`, `routes`, `features`, component, page, domain, data, hook, type, or style implementations to reconnect.

The admin source graph was therefore reconstructed from the established Admin Milestone 1/2 architecture rather than replaced with route placeholders:

| `App.tsx` import | Resolved file | Repair |
|---|---|---|
| `./components/AdminShell` | `apps/admin/src/components/AdminShell.tsx` | Reconstructed the responsive shell and Firebase logout integration. |
| `./pages/DashboardPage` | `apps/admin/src/pages/DashboardPage.tsx` | Reconstructed reactive metrics and action-required operation queue. |
| `./pages/NotFoundPage` | `apps/admin/src/pages/NotFoundPage.tsx` | Reconstructed the routed admin not-found state. |
| `./pages/OperationDetailPage` | `apps/admin/src/pages/OperationDetailPage.tsx` | Reconstructed operation details, guarded workflow controls, moderation, assignment, delivery exceptions, reset control, and activity history. |
| `./pages/OperationsPage` | `apps/admin/src/pages/OperationsPage.tsx` | Reconstructed the searchable/filterable operation ledger. |

Supporting operation domain types, transition rules, mock ambassadors, session-persisted repository, subscription hook, table/status/dialog/timeline components, realistic mock records, and admin styling were also restored because the route targets depend on them. Firebase authentication remains wrapped around the restored application: unauthenticated users go to login, authenticated users require the trusted admin claim, authorization loading is resolved before protected content renders, and shell logout delegates to Firebase.

The customer source tree was deliberately not inspected or changed during this admin-only restoration; its four unresolved route targets remain a separate repair scope.

## Customer dashboard restoration

The customer source was subsequently confirmed to contain only the Firebase login/signup pages, provider, guard, router, and entry point. The original shell, dashboard, operation pages, account page, customer-safe data/domain layer, and styles were genuinely absent rather than moved or renamed. The likely cause was the same Firebase Auth migration failure that authored a replacement router using expected screen names without retaining the pre-existing screen source.

The following customer files were reconstructed:

- `components/CustomerShell.tsx` with responsive navigation and Firebase logout.
- `components/CustomerOperationCard.tsx`, `CustomerStatusBadge.tsx`, and `TrackingTimeline.tsx`.
- `pages/CustomerDashboardPage.tsx`, `CustomerOperationsPage.tsx`, `CustomerOperationDetailPage.tsx`, and the required read-only `CustomerAccountPage.tsx`.
- `data/customerOperationsRepository.ts` with seven customer-safe mock projections and `customerProfileRepository.ts`.
- `types/customer.ts`, centralized `utils/status.ts`, and `styles/customer.css`.

`App.tsx` now supports `/login`, `/signup`, `/dashboard`, `/operations`, `/operations/:operationId`, and `/account`. Every private route remains nested under `CustomerAuthGuard` and `CustomerShell`; no mock authentication was reintroduced. Firebase authentication is real, while operation/profile data remains intentionally mock until the Firestore milestones.

The projection exposes only customer-appropriate package, recipient, requested-delivery, message, safe payment summary, and mapped status fields. It contains no moderation notes, internal workflow labels in presentation, ambassador contact details, internal delivery notes, staff identity, or operational failure details.

## Lint repair

Both auth provider files exported a provider component and their `useAdminAuth` / `useCustomerAuth` hooks from the same module. React Fast Refresh treats non-component exports in a component module as an unstable refresh boundary, which triggered `react-refresh/only-export-components` warnings. Because the root lint task sets `--max-warnings=0`, those warnings failed lint.

The context contracts, context instances, and hooks now live in `adminAuthContext.ts` and `customerAuthContext.ts`. `AdminAuthProvider.tsx` and `CustomerAuthProvider.tsx` export only their provider components. Guards, login/signup pages, shells, and the customer account page now import hooks from the corresponding context module. Firebase observation, claims, signup, login, logout, loading, and unauthorized behavior are unchanged.

`adminOperationsRepository.ts` had two empty `catch` blocks around session-storage writes and cleanup. Their intent was to keep the mock workflow usable when browser storage is unavailable, but the compressed implementation neither documented that state nor gave subsequent operations a deliberate recovery path. The repository is now formatted as readable TypeScript with `loadOperations`, `persistOperations`, and `clearPersistedOperations` boundaries. Malformed/non-array stored data is removed and replaced with fresh seed data. Parsing or storage-access failure switches the repository to an explicit in-memory-only mode for the remainder of the runtime; workflow transitions and reset continue working without repeatedly attempting unavailable storage.

## Build repair

The shared Firebase package originally extended `@secret-service/config/tsconfig.base.json`. That package-style subpath was not resolvable by Vite/esbuild while transforming the Firebase package's raw TypeScript source. The first repair incorrectly assumed the base file lived at `packages/config/tsconfig.base.json` and changed the value to `../config/tsconfig.base.json`; the repeated build failure confirmed that physical target does not exist.

The real base configuration is the repository-root file `tsconfig.base.json`. From `packages/firebase/tsconfig.json`, the verified monorepo-relative relationship is `../../tsconfig.base.json`. The Firebase package now extends that root file directly, avoiding both a non-exported/unresolvable package subpath and the nonexistent sibling-package target.

Admin and customer currently consume the Firebase implementation as raw shared source through imports resolving to `packages/firebase/src/index.ts`. Consequently Vite walks into that package and asks esbuild to load the nearest `packages/firebase/tsconfig.json`; this is why the package config affects both application builds even though the web app does not use Firebase Auth. The fix preserves the existing compiler options and changes only config inheritance. No Firebase source, Auth behavior, application routes, repositories, customer data, package exports, or other package tsconfig files were modified.

## Files changed

- `packages/firebase/package.json`
- `packages/firebase/tsconfig.json`
- `packages/firebase/src/config.ts`
- `packages/firebase/src/client.ts`
- `packages/firebase/src/authService.ts`
- `packages/firebase/src/types.ts`
- `packages/firebase/src/index.ts`
- `.env.example`
- `apps/admin/.env.example`
- `apps/customer/.env.example`
- Admin/customer auth providers, guards, login/signup pages, application routing, and main entry points
- `FIREBASE_AUTH_MILESTONE.md`
