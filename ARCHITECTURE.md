# Secret Service frontend architecture

## Repository layout

This repository is an npm-workspaces monorepo with three independently buildable React + TypeScript + Vite applications.

```text
apps/web       Public marketing, dossiers, protocol, and dispatch journey
apps/admin     Minimal routed React foundation; no dashboard features yet
apps/customer  Minimal routed React foundation; no account features yet
packages/ui    UI used by more than one application (currently placeholder shell only)
packages/types Shared domain contracts with no browser/Firebase dependency
packages/config Safe cross-app names/navigation constants
public/assets  Existing public imagery, served by apps/web
firebase.json  Three Firebase Hosting targets and SPA rewrites
```

The root-level vanilla HTML/JS and prior `dist` output remain temporarily as migration reference material. They are not used by the workspace build or Firebase target outputs. `apps/web` is the authoritative migrated public application.

## Application responsibilities

- **web:** public brand experience, catalogue, protocol, dispatch form, GSAP reveals, and Firebase dispatch persistence.
- **admin:** later home for authenticated operational workflows. This milestone intentionally contains only a routed placeholder.
- **customer:** later home for authentication, customer profile, and order status. This milestone intentionally contains only a routed placeholder.

Each app owns its Vite configuration, entry point, route tree, environment, build command, and `dist` directory. Apps must not import source from another app.

## Shared packages

- `@secret-service/types` owns `Dossier`, `DispatchInput`, and `DispatchResult` contracts.
- `@secret-service/config` owns non-sensitive cross-app identity/config constants. Secrets and app-specific Firebase values do not belong here.
- `@secret-service/ui` contains only the placeholder composition genuinely used by admin and customer. Public-site-specific cards, terminal, navigation, and layout remain in `apps/web`.

## Local development

Install once from the repository root:

```bash
npm install
```

Run one application:

```bash
npm run dev:web       # http://localhost:3000
npm run dev:admin     # http://localhost:3001
npm run dev:customer  # http://localhost:3002
```

## Build and verification

```bash
npm run build
npm run build:web
npm run build:admin
npm run build:customer
npm run typecheck
npm run lint
```

Outputs are `apps/web/dist`, `apps/admin/dist`, and `apps/customer/dist`.

## Public-site migration decisions

- React functional components and local state replace global DOM mutation and inline event handlers.
- React Router provides independent routing. Legacy `.html` paths redirect inside the web app; Firebase rewrites allow direct route loads.
- One typed dossier catalogue feeds cards, modal details, and form options.
- GSAP is scoped with `gsap.context()` and reverted on route unmount, preventing duplicate ScrollTriggers in Strict Mode.
- The custom cursor removes listeners and cancels its animation frame on unmount.
- The modal owns body-scroll cleanup and adds Escape-key handling and dialog semantics.
- Firebase persistence is behind `createDispatch`; real Firebase modules remain lazy-loaded. Mock mode is explicit rather than inferred from a magic production key.
- No React Three Fiber/Drei dependencies were added because the audited frontend contains no Three.js, WebGL, models, shaders, or 3D scene to migrate.
- The original global CSS is imported for exact visual parity. `react-migration.css` contains only state selectors, inline-style replacements, and reduced-motion handling.

## Environment strategy

Copy `apps/web/.env.example` to `apps/web/.env.local`. Vite exposes only `VITE_*` variables to client code; these are client identifiers, not a place for Admin SDK credentials or server secrets.

- `VITE_FIREBASE_MODE=mock` uses browser `localStorage` and does not contact Firebase.
- `VITE_FIREBASE_MODE=real` requires the Firebase client values in the example file.
- Admin and customer will receive their own `.env.example` files when Firebase is introduced there. They must not import web’s environment directly.

Real public dispatch writes still require audited Firestore rules and abuse controls before production use. This migration does not create or modify backend resources.

## Firebase Hosting multisite

`firebase.json` defines logical targets `web`, `admin`, and `customer`. Copy `.firebaserc.example` to `.firebaserc`, fill in the existing project/site IDs, then associate targets once the sites exist:

```bash
firebase target:apply hosting web YOUR_WEB_SITE_ID
firebase target:apply hosting admin YOUR_ADMIN_SITE_ID
firebase target:apply hosting customer YOUR_CUSTOMER_SITE_ID
```

Future individual deployments, after explicit authorization and project setup:

```bash
npm run build:web && firebase deploy --only hosting:web
npm run build:admin && firebase deploy --only hosting:admin
npm run build:customer && firebase deploy --only hosting:customer
```

No project, site, target, or deployment was created by this milestone.

## Future admin/customer considerations

Design authentication and authorization with Firestore rules/custom claims before building either dashboard. Keep domain contracts in `packages/types`, but keep feature UI inside its owning app until two apps genuinely share it. Admin mutations should use least privilege and trusted server-side workflows where appropriate. Customer server state may eventually justify a query cache; the current public site does not need a global state library.
