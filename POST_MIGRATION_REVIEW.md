# Secret Service post-migration review

Date: 2026-08-30  
Method: static source comparison and file edits only. No build, lint, type-check, test, server, browser-automation, Firebase CLI, Git, or deployment command was used for this milestone.

## Summary

The React public application remains structurally faithful to the retained five-page vanilla implementation. It preserves the existing page order, copy variants, navigation, imagery, dossier modal/selection handoff, terminal dispatch sequence, Firebase mock/real modes, custom cursor, GSAP reveal timings, responsive breakpoints, and legacy `.html` compatibility routes.

This stabilization adds customer-facing `/login` and `/signup` prototypes and visible header entry points. They deliberately perform no authentication, network request, persistence, or user creation. Admin authentication remains private to the future admin application and is not exposed on the marketing site.

## Migration parity assessment

### Pages and sections

| Legacy source | React route/component | Assessment |
|---|---|---|
| `index.html` | `/`, `HomePage` | Hero, three operation previews, protocol timeline, CTA, and footer retained |
| `about.html` | `/about`, `AboutPage` | Editorial copy/image and three Agent Code items retained |
| `dossiers.html` | `/dossiers`, `DossiersPage` | Nine cards, modal details, selection, and dispatch handoff retained |
| `protocol.html` | `/protocol`, `ProtocolPage` | Intro and three alternating process panels retained |
| `contact.html` | `/contact`, `ContactPage` | Terminal fields, option list, theatrical log sequence, HQ details, and persistence path retained |

### Static comparison findings

- Header, brand mark, five original navigation links, custom cursor, and footer are shared through `SiteLayout` rather than repeated across documents.
- React Router owns navigation. `/index.html`, `/about.html`, `/dossiers.html`, `/protocol.html`, and `/contact.html` redirect to their React equivalents.
- The three original JPEG assets remain at their original `/assets/...` URLs. `apps/web/vite.config.ts` serves the retained root `public` directory.
- The React app intentionally imports the original `src/styles/main.css`; the audited design tokens, fonts, breakpoints, layouts, hover states, and keyframes remain authoritative.
- The Google Fonts import is now at the valid beginning of the stylesheet. This corrects the legacy ordering defect while retaining Inter, Space Grotesk, and Space Mono.
- Homepage card copy, dossier-card copy, modal copy, dossier metadata, and form options are now variants on one typed dossier record rather than parallel component constants.
- The legacy inline modal handler/global `window.openDossierModal` was correctly replaced with React state and navigation.
- The `sessionStorage` key `preselected_dossier` and its one-time consumption on the contact page are preserved.
- The terminal’s original staged status sequence, required fields, mock mode, real Firestore collection name, and success/error presentation are preserved. The migration additionally uses Unicode-safe Base64 conversion and a real server timestamp.
- The original post-success disabled-form regression is not carried forward: the React form becomes usable again after the mocked/real request settles.
- No Three.js parity issue exists because neither the retained implementation nor the migrated app contains a Three.js/WebGL scene.

### Animation and interaction parity

- GSAP hero timing and ScrollTrigger selectors/start thresholds are preserved in `usePageAnimations`.
- GSAP work is scoped with `gsap.context()` and reverted on route unmount.
- The custom cursor retains its lerped ring and immediate dot, but now uses one delegated hover listener and cancels its RAF/listeners on unmount.
- Mobile navigation is React state, resets on route change, and exposes `aria-expanded`.
- The dossier dialog restores focus, closes on Escape or overlay click, owns body-scroll cleanup, and uses dialog semantics.
- Reduced-motion handling was added without changing the default animated experience.

### Responsive parity

The original `1024px` and `768px` breakpoints remain in the shared stylesheet. Authentication prototypes add scoped breakpoints at `1180px`, `900px`, and `768px` to prevent the expanded navigation and two-column auth composition from overflowing. Existing public-page selectors are not redesigned.

## React architecture review

No broad refactor was warranted.

- `document.querySelector` is limited to the scoped GSAP hook, where it locates animation targets inside the current page ref. It is not used as application state.
- Direct DOM mutation is limited to animation transforms/styles, custom-cursor coordinates, and temporary body scroll locking for the modal. Each has cleanup.
- No global application variables or window-attached functions remain in `apps/web`.
- Event listeners and animation frames created by the cursor and modal are removed on cleanup.
- Dossier selection, navigation state, form values, mock notices, and dialog state remain local. No global state dependency is justified.
- Firebase modules remain lazy-loaded only in real mode. Mock and real persistence share a small typed repository boundary.
- `ContactPage` is the largest page because it owns a small theatrical submission state machine. It does not currently create a lifecycle leak; splitting it further would be stylistic rather than stabilizing.
- Auth presentation duplication is limited through `AuthLayout` and `AuthFormField`. No authentication service or context was invented before real auth requirements exist.

## Shared package review

- `packages/ui`: contains only `AppPlaceholder`, genuinely shared by the admin and customer foundations. Marketing navigation, dossier cards, terminal UI, and auth prototypes correctly remain in `apps/web`.
- `packages/types`: contains framework-independent dossier and dispatch contracts. Dossier display variants were added here because all catalogue representations are one domain record.
- `packages/config`: contains safe app names and public navigation constants. It contains no secrets or Firebase environment values.

No component was moved to a shared package during stabilization. The customer auth pages are currently web-specific prototypes; extracting them before the customer app has a real auth flow would be premature.

## Authentication prototypes

### Entry points and routes

- `Log in` routes to `/login`.
- `Sign up` routes to `/signup`.
- Both are customer-facing only and appear alongside the existing navigation.
- There is no public admin-login or admin-signup link.

### Login

`LoginPage` uses the existing covert visual language and includes:

- “Access Your File” heading and secure-access classification
- Email and password fields with labels and autocomplete metadata
- Log In button
- Forgot password mock action
- Sign-up link
- Explicit status notice explaining that credentials were neither sent nor stored

### Sign-up

`SignupPage` includes:

- “Create Your File” heading and new-personnel-file classification
- First name, last name, email, password, and confirm-password fields
- Create Account button
- Login link
- Terms/Privacy acknowledgment text
- Explicit status notice explaining that no personal data was sent or stored

Both forms use semantic form elements, submit prevention, labels, visible keyboard focus styling, suitable autocomplete values, responsive layouts, and `role="status"` feedback. They do not call Firebase or any other backend.

## Firebase Auth recommendation

Do not add Auth initialization to the existing dispatch repository. Dispatch persistence and identity/session concerns should remain separate.

Recommended later structure:

```text
packages/
  firebase-client/
    app.ts              # get-or-initialize factory accepting typed client config
    auth.ts             # thin Auth factory/helpers, no app-specific routing/UI
apps/web/src/auth/      # customer entry forms and session integration
apps/customer/src/auth/ # protected customer route/session integration
apps/admin/src/auth/    # admin gate and authorization checks
```

Each independently hosted app should initialize a Firebase client from its own validated `VITE_FIREBASE_*` environment. `web` and `customer` may use the same Firebase project and customer identities, but separate Hosting origins do not automatically share browser-local Firebase sessions; the desired handoff/sign-in behavior needs an explicit product and security decision. The admin app should use the same identity provider only if appropriate, require verified administrative custom claims/roles, and enforce those privileges in Firestore rules and trusted backend operations—not merely in React route guards.

Share initialization code and framework-independent auth types, not app-specific screens or authorization assumptions. Add an `AuthProvider` inside each app only when Firebase Auth is actually implemented. Do not put privileged credentials in Vite variables.

## Legacy cleanup assessment

### A. Safe to delete later, after parity sign-off

- Root generated `dist/` from the vanilla build
- `src/main.js` once no legacy behavior comparison is required
- `src/firebase.js` once the real/mock dispatch behavior has production sign-off
- Root `vite.config.js` and legacy root build entry configuration

### B. Keep temporarily as migration reference

- `index.html`, `about.html`, `dossiers.html`, `protocol.html`, `contact.html`
- `src/main.js`, `src/firebase.js`, and root `vite.config.js` until visual/behavior acceptance is complete
- `CONTEXT.md` and `FRONTEND_AUDIT.md`

Files can appear in both A and B: they are technically replaceable now, but should be retained until the manual parity pass is accepted.

### C. Still used by the React application

- `src/styles/main.css`, imported by `apps/web/src/main.tsx`
- `public/assets/agent_hq_vibe.jpg`
- `public/assets/classified_case.jpg`
- `public/assets/operational_protocol.jpg`

These must not be deleted. A later cleanup may move them under `apps/web`, but imports and Vite `publicDir` must change together.

### D. Requires manual review

- Root `.env`: determine whether it contains mock, development, or production identifiers and whether any values need to be copied to `apps/web/.env.local` before removal.
- Root `package-lock.json`: remains authoritative for the npm workspace and must be kept.
- Legacy marketing/security claims and contact details: content approval is outside migration parity.
- Any external Firebase rules, indexes, Hosting target mappings, and project settings not present in this repository.

## Files changed in this milestone

- `apps/web/src/App.tsx`
- `apps/web/src/components/SiteLayout.tsx`
- `apps/web/src/components/DossierCard.tsx`
- `apps/web/src/components/auth/AuthLayout.tsx`
- `apps/web/src/components/auth/AuthFormField.tsx`
- `apps/web/src/data/dossiers.ts`
- `apps/web/src/pages/LoginPage.tsx`
- `apps/web/src/pages/SignupPage.tsx`
- `apps/web/src/react-migration.css`
- `packages/types/src/index.ts`
- `POST_MIGRATION_REVIEW.md`

## MANUAL VERIFICATION COMMANDS

Run these yourself from the repository root:

```bash
npm run typecheck
npm run lint
npm run build
```

There is currently no test script or existing automated test suite to run. If one is added later, include it in the verification gate.

Then start the public app manually:

```bash
npm run dev:web
```

Manual browser checklist:

- Homepage loads with the original layout, imagery, fonts, cursor, and entrance animations.
- Original navigation links and footer link route correctly.
- `Log in` routes to `/login`; `Sign up` routes to `/signup`.
- Login and sign-up forms show prototype notices without a network request, Firebase write, navigation, or stored user data.
- Forgot password shows its prototype notice and does not send email.
- Login/sign-up labels, tab order, focus indicators, password masking, and autocomplete behavior are sensible.
- Auth pages remain composed at wide desktop, tablet, and narrow mobile widths.
- The mobile burger contains all five original links plus Log in and Sign up, reports expanded state, and closes after navigation.
- Dossier modal opens, closes by button/overlay/Escape, and transfers a selected dossier to `/contact`.
- Contact terminal mock submission still completes and can submit again afterward.
- `/index.html`, `/about.html`, `/dossiers.html`, `/protocol.html`, and `/contact.html` redirect to the React routes.
- Directly loading `/login` and `/signup` works through the configured Firebase Hosting rewrite.
- Browser console shows no obvious errors or duplicate GSAP/ScrollTrigger warnings during repeated route changes.
- With reduced motion enabled, content remains visible and continuous cursor/entrance motion is suppressed.
