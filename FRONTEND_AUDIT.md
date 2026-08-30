# Secret Service Frontend Technical Audit

Audit date: 2026-08-30  
Scope: the repository as found, excluding `node_modules` internals and treating `dist` as generated output. No production code, dependencies, or Firebase configuration were changed.

## Executive summary

Secret Service is currently a small, conventional multi-page Vite site: five standalone HTML documents, one global stylesheet, one shared JavaScript entry point, and three static JPEG assets. The visual language is already coherent and should be preserved: near-black surfaces, crimson status/glow accents, restrained brass details, uppercase geometric headings, monospace telemetry, classified-file cards, terminal styling, grayscale photography, and short GSAP reveals.

The implementation is vanilla DOM code rather than a component system. Each page repeats the header, navigation, cursor, footer, stylesheet link, and script tag. Product/dossier information is repeated in homepage HTML, dossier HTML, JavaScript modal data, and the contact-page `<select>`. That duplication, plus inline event handlers and global mutable DOM behavior, is the main migration concern—not the visual design.

There is **no Three.js, WebGL, canvas, 3D model, shader, or animation-mixer code in the repository**. The current immersive effect is 2D: CSS layering/compositing, full-bleed static images, a lerped custom cursor, and GSAP/ScrollTrigger reveals. React Three Fiber is therefore not required to preserve the existing experience. It should only be introduced later for an explicitly approved new 3D feature.

Firebase is partially configured. The application can initialize Firebase App and Firestore from seven Vite environment variables, but switches to a browser `localStorage` mock only when the API key exactly equals `MOCK_KEY_123`. The dispatch form writes to `dispatches`; no Auth, Storage, Realtime Database, Functions, Analytics initialization, Hosting configuration, rules, indexes, or emulator configuration exists in this repository.

Migration difficulty is **low-to-moderate** for a faithful React port. Static sections map directly to components; GSAP behavior needs lifecycle-safe hooks; dossier data should be centralized and typed; Firebase submission should be isolated behind a service boundary. The safest approach is an incremental visual-parity migration, beginning with tests/reference captures and shared data, then page shells and static pages, then interactions and Firebase. The future three-app repository should be introduced only after the public site has parity.

## Current architecture

- **Application shape:** static multi-page application (MPA), not a client-side router or SPA.
- **Runtime:** browser-native HTML/CSS/ES modules.
- **Build tool:** Vite with explicit Rollup inputs for all five HTML pages.
- **Shared entry point:** every page loads `/src/main.js`, which feature-detects page-specific DOM before initializing behavior.
- **Styling:** one global `/src/styles/main.css`; no Tailwind, CSS Modules, Sass, PostCSS configuration, or component-scoped styles are present despite `CONTEXT.md` mentioning Tailwind/CSS Modules as possibilities.
- **Animation:** GSAP plus ScrollTrigger from npm.
- **Data/backend:** hard-coded dossier catalogue; Firebase App/Firestore loaded dynamically only during a real form submission, or a `localStorage` mock when the sentinel mock key is set.
- **Output:** `dist/` contains a prior production build with five HTML files, copied images, one hashed CSS bundle, one main JS bundle, and one small Firebase entry chunk. It is ignored by `.gitignore` and should be treated as generated/stale-capable output rather than source.
- **Tests and quality tooling:** no test runner, linter, formatter, type checker, accessibility tooling, or CI configuration was found.

### Main entry points

| Entry | Role |
|---|---|
| `index.html` | Marketing homepage |
| `about.html` | “The Directive” brand/ethos page |
| `dossiers.html` | Nine-item product catalogue and dispatch modal |
| `protocol.html` | Three-stage service/process explanation |
| `contact.html` | Dispatch/order form and HQ/contact details |
| `src/main.js` | Shared browser initialization, interactions, GSAP, catalogue modal data, and form submission |
| `src/styles/main.css` | Entire design system, page layouts, responsive rules, and CSS animation |
| `src/firebase.js` | Environment-driven Firestore adapter and mock `localStorage` adapter |
| `vite.config.js` | Vite development server and five-page Rollup build configuration |

## Folder map

```text
secret-service/
├── .env                         # Seven VITE_FIREBASE_* values; committed status could not be established
├── .gitignore                   # Ignores node_modules, dist, local env variants, logs
├── CONTEXT.md                   # Product/brand and intended-stack notes; informative, not runtime code
├── FRONTEND_AUDIT.md            # This audit
├── index.html                   # Homepage
├── about.html                   # Directive page
├── dossiers.html                # Catalogue page and modal markup
├── protocol.html                # Process page
├── contact.html                 # Dispatch form/contact page
├── package.json                 # Vite scripts; Firebase and GSAP runtime dependencies
├── package-lock.json            # npm lockfile
├── vite.config.js               # Multi-page build definition; port 3000 and one ngrok allowed host
├── src/
│   ├── main.js                  # Shared application behavior
│   ├── firebase.js              # Real/mock Firestore abstraction
│   └── styles/
│       └── main.css             # Global CSS and responsive rules
├── public/
│   └── assets/
│       ├── agent_hq_vibe.jpg    # 1376×768; hero, about, protocol
│       ├── classified_case.jpg  # 1200×896; all dossier cards
│       └── operational_protocol.jpg # 1376×768; protocol panels
├── dist/                        # Existing generated Vite output; not source
└── node_modules/                # Installed dependency tree; not application source
```

### Static resources

- Three JPEG files are the only first-party visual assets. The same images are copied into `dist/assets` by Vite.
- There are no local font files. Inter, Space Grotesk, and Space Mono are requested from Google Fonts in CSS.
- The logo is styled text (`S`, brand name, and plaque), not an image/SVG asset.
- The terminal dots, cursor, timeline nodes, glow treatments, dividers, and status indicators are CSS primitives.
- No SVGs, icon library, video/audio, 3D model formats (`glTF`, `GLB`, `FBX`, `OBJ`), texture sets, shader files, canvas assets, favicons, manifest, or service worker were found.

## Page map

All pages share a fixed translucent header, text logo/plaque, desktop navigation, mobile burger, custom cursor elements, common footer, global stylesheet, and shared module script. Navigation is full-document navigation between `.html` files.

### Homepage — `index.html`

**Purpose:** introduce the experiential-delivery proposition and move users toward either the catalogue or dispatch form.

**Structure and components:**

1. Full-viewport hero with status telemetry, “Delivered in Confidence” heading, supporting copy, dispatch CTA, and a right-side HQ image blended into a dark/red radial background.
2. “Active Operations” preview with three cards: Secret Admirer, Soft Revenge, and The Confession. Each card contains a classification strip, image, stage, price, copy, tags, and dossier link.
3. Three-step “Operational Protocol” timeline with circular numbered nodes.
4. Shared operational footer.

**Interactions/animation:** custom cursor; active navigation marker; GSAP entrance timeline for telemetry/title/subtitle/CTA; ScrollTrigger reveals for cards, section headers, and timeline steps; CSS card/image hover and glowing button sweep.

**Dependencies:** static HTML copy and two JPEGs. Prices are displayed in dollars. No API data is loaded.

**Responsive behavior:** at `≤1024px`, the hero becomes one column, its image covers the full hero at lower opacity, and the timeline becomes vertical without the connector line. At `≤768px`, navigation becomes a burger-controlled overlay and card grids become one column.

### The Directive — `about.html`

**Purpose:** communicate brand ethos, anonymity positioning, geographic context, and the Agent Code.

**Structure and components:** hero heading; two-column editorial area with quote/body copy and framed HQ image; three-column Discretion/Precision/Theatre specification grid; shared footer.

**Interactions/animation:** GSAP hero-title reveal; staggered editorial-copy reveal; image slide-in; staggered spec-item reveal; shared cursor/navigation.

**Dependencies:** static copy and `agent_hq_vibe.jpg`.

**Responsive behavior:** editorial columns collapse at `≤1024px`, image height drops from 480px to 380px, and specs collapse to one column.

### Dossiers — `dossiers.html`

**Purpose:** display the complete product catalogue and transfer a selected operation into the dispatch form.

**Structure and components:** page heading and intro; responsive nine-card catalogue; one reusable modal overlay with cost, staging period, clearance, status, description, and confirmation action.

The nine dossiers are Secret Admirer, Soft Revenge, The Confession, Roast Your Friend, Office Prank Kit, Midnight Mystery, VIP Decoy Guard/Escort, Anonymous Apology, and Red Envelope.

**Interactions/animation:** each card’s inline `onclick` invokes global `window.openDossierModal(id)`. JavaScript fills the shared modal from `DOSSIERS_DATA`, locks body scrolling, closes via the close button or overlay click, and on confirmation writes `preselected_dossier` to `sessionStorage` before navigating to `contact.html`. Cards and the section header reveal with ScrollTrigger. No Escape-key close, focus trap, focus return, or dialog ARIA semantics are implemented.

**Dependencies:** product data is split between HTML and `DOSSIERS_DATA`; every card reuses `classified_case.jpg`.

**Responsive behavior:** auto-fill grid uses a 360px minimum until `≤768px`, when it forces one column. The modal is padded and max-width constrained, but has no dedicated small-screen or overflow rule.

### Protocol — `protocol.html`

**Purpose:** explain the three-stage fulfilment workflow in more detail.

**Structure and components:** introductory hero followed by three minimum-80vh split panels: Directive Received, Covert Assembly, and Discretionary Dispatch. Text/image orientation alternates by `nth-child` styling.

**Interactions/animation:** GSAP reveals each panel’s child elements as a staggered group. Photography is grayscale/luminosity blended; the third panel has an extra inline brightness/contrast filter.

**Dependencies:** static copy plus `operational_protocol.jpg` and `agent_hq_vibe.jpg`.

**Responsive behavior:** at `≤1024px`, alternating rows become stacked columns, visual panels become 300px tall, and content padding is reduced.

### Contact / Dispatch terminal — `contact.html`

**Purpose:** collect a selected operation, agent alias, delivery location, and message/instructions, then stage a dispatch record.

**Structure and components:** terminal window chrome and boot log; two-column form; generated agent identifier; nine-option dossier selector; address input; full-width message textarea; command/status line and submit action; physical HQ and secure-communications details; shared footer.

**Interactions/animation:** preselects a dossier from `sessionStorage`, generates `AGENT_GUEST_####`, reports payload length only on exact multiples of ten characters, validates required values, disables controls, plays six 550ms simulated log steps, dynamically imports the Firebase adapter, and writes a dispatch. The terminal container has a GSAP reveal; status cursor and terminal light pulse in CSS.

**Submission payload:** `agent_id`, `operation_dossier`, Base64-encoded `encrypted_payload`, `delivery_location`, and `status: 'STAGED'`. Base64 is encoding, **not encryption**. On real Firestore success, the form resets but controls remain disabled. On failure, the raw error message is rendered into `innerHTML` and controls are re-enabled. No server timestamp, customer identity, email/phone, consent, anti-abuse control, payment, availability check, or authenticated session exists.

**Responsive behavior:** at `≤768px`, the form changes to one column and footer actions stack. HQ details collapse at `≤1024px`.

## JavaScript architecture

### Initialization

`src/main.js` imports GSAP and ScrollTrigger, registers the plugin, then runs seven initializers on `DOMContentLoaded`:

1. `initCustomCursor()`
2. `initMobileNav()`
3. `initActiveNavLink()`
4. `initHeroAnimations()`
5. `initScrollAnimations()`
6. `initDossierModals()`
7. `initTerminalForm()`

Each initializer queries the document and usually returns when its anchor element is absent. This lets one shared bundle serve every page, but page identity and behavior are inferred from selectors rather than explicit page modules.

### State and DOM patterns

- There is no application state store. State lives in DOM classes/styles/values, function-local cursor coordinates, `sessionStorage`, and (in mock mode) `localStorage`.
- DOM manipulation is imperative through `querySelector(All)`, `classList`, direct `style` assignments, `textContent`, attributes, and `innerHTML`.
- The mobile menu directly mutates each burger line’s inline styles.
- Active navigation is inferred from `window.location.pathname` and link `href` suffixes.
- The dossier catalogue object is module-local, but opening is exposed globally because HTML uses inline handlers.
- Navigation uses regular links and `window.location.href`; there is no History API or client router.
- No reusable module boundaries exist inside `main.js`; functions are cohesive but share selectors and document globals.

### Events and long-running behavior

- `mousemove` updates the cursor dot and an unbounded `requestAnimationFrame` loop lerps the ring position.
- Each interactive element found at initialization receives `mouseenter`/`mouseleave` listeners.
- Burger click toggles the menu and icon.
- Modal close/overlay click and confirmation events manage selection and navigation.
- Payload `input` updates terminal feedback.
- Form `submit` performs validation, simulated progress, and persistence.
- ScrollTrigger instances are created for timeline steps, cards, headers, spec items, protocol content, editorial content/image, and terminal.

There is no teardown: listeners are not removed, the cursor RAF is not cancelled, GSAP contexts are not reverted, and ScrollTriggers are not killed. This is harmless across full-page unloads but must be addressed in React development/Strict Mode and client-side navigation.

### Storage, APIs, authentication, integrations

- `sessionStorage.preselected_dossier`: one-navigation handoff between catalogue and contact.
- `localStorage['secret-service-mock-db']`: mock collections/documents, including dispatch payloads.
- Firestore `addDoc(collection(db, 'dispatches'), payloadData)`: the only external data request in source.
- No `fetch`, Axios, REST/GraphQL API, Auth, cookies, Realtime Database, Cloud Storage, Functions, analytics, payment provider, maps/geocoding, email, CMS, or social integration was found.

### React migration coupling

Highest-coupling areas are:

- Inline `onclick` ↔ `window.openDossierModal`.
- Selectors and shared global class names are behavior contracts.
- GSAP selectors/instances lack component ownership and cleanup.
- Direct body overflow mutation belongs to modal lifecycle.
- Dossier records are duplicated in four representations and can drift (for example “VIP Decoy Guard” versus “VIP Decoy Escort”).
- Header/footer/nav markup and page-specific inline styles are repeated.
- Form persistence, UI simulation, encoding, and Firestore calls are combined in one submit handler.
- Firebase switches adapters through a literal API-key sentinel rather than an explicit environment mode.

## Three.js architecture

### Current status

No Three.js or equivalent 3D stack exists. Specifically, there is no renderer, scene graph, camera, lighting, loader, model, texture pipeline, animation mixer, raycaster, pointer-to-3D interaction, render loop for a scene, resize handler, disposal logic, or performance tuning for WebGL. `package.json` and the lockfile have no `three`, `@react-three/fiber`, or `@react-three/drei` dependency.

The only continuous visual loop is the 2D custom cursor’s `requestAnimationFrame`. Scroll-linked motion uses GSAP ScrollTrigger, but none of it drives 3D state.

### Future R3F boundary

- **Remain ordinary React/CSS:** header, hero copy, cards, timeline, editorial layout, protocol copy, terminal, modal, footer, and existing static-image compositing.
- **Become hooks/utilities:** reduced-motion preference, pointer normalization if needed, scroll progress, and GSAP lifecycle helpers.
- **Become R3F components only if a new 3D brief is approved:** a canvas shell, scene/camera/lights, model components/loaders, scroll-to-scene choreography, pointer/raycast interactions, adaptive DPR/performance controls, and disposal boundaries.
- **Remain utility modules:** typed scene configuration, model URLs, numerical interpolation helpers, and asset preload policy.

Adding R3F during the parity migration would increase bundle size, accessibility/performance work, mobile testing, and state synchronization without preserving any existing functionality that CSS/GSAP does not already provide.

## Styling and design system

### Global foundations

- Two `:root` blocks establish fallback background/text and then tokens.
- Universal reset applies zero margin/padding and `border-box`.
- `html` enables smooth scrolling; `body` is a vertical flex container with horizontal overflow hidden.
- Headers use uppercase Space Grotesk; body uses Inter; operational labels use Space Mono.
- Paragraphs default to light (300) gray text with 1.6 line height.
- A WebKit-only thin custom scrollbar is provided.

The Google Fonts `@import` appears after style rules. CSS `@import` statements are required to precede ordinary style rules, so browsers may ignore it; local fallbacks then apply. This should be verified visually and corrected deliberately during migration, not silently altered beforehand.

### Tokens

| Category | Current tokens |
|---|---|
| Backgrounds | `#0A0A0A`, `#0d0d0d`, `#141414`, `#0e0e0e` |
| Accent | crimson `#DC2626`, bright `#EF4444`, dim `#991b1b`, muted rgba |
| Brass | `#C9A84C`, dim `#8B7331` |
| Text | white, `#a3a3a3`, `#525252` |
| Border | `#262626` |
| Effects | red border glow and text glow |
| Motion | 0.2s ease; 0.4s custom cubic-bezier |

There is no spacing scale token set. Layout repeatedly uses `2rem`, `4rem`, `5rem`, `6rem`, and `8rem`; containers consistently max at 1400px, except the 1000px terminal. Border radii are intentionally sparse and small.

### Layout conventions and reusable patterns

- `.section-container` / `.section-header` provide common width and heading treatment.
- `.btn`, `.btn-glowing`, and `.btn-secondary` form the button family.
- `.classified-card` and its child classes define catalogue cards.
- `.timeline*`, `.spec*`, `.protocol-panel*`, `.terminal*`, `.modal*`, and `.hq*` are coherent component candidates.
- Glass-like fixed navigation uses translucent background plus backdrop blur.
- Photography is grayscale/high-contrast/luminosity blended, with crimson overlays and gradient fades.
- Page-specific sizing/layout is partly inline in HTML, which weakens the global system.

### Animation and accessibility observations

- CSS keyframes: `pulse` and `blink`.
- CSS transitions cover cursor, links, buttons, cards, images, and modal.
- GSAP entrance animations set some hero elements initially invisible in CSS. If JavaScript fails, key homepage copy/CTA and hero titles on other pages can remain invisible.
- There is no `prefers-reduced-motion` handling, and smooth scrolling/continuous cursor animation always run on fine pointers.
- Keyboard focus styles are defined for form inputs only; links and buttons rely on browser defaults or hover styling.
- Mobile navigation does not expose `aria-expanded`, close on link/Escape, trap focus, or manage background scroll.
- The modal lacks semantic dialog attributes and keyboard focus management.
- Images have descriptive `alt` attributes. Form labels are correctly associated with controls.

### React component candidates

`SiteHeader`, `BrandMark`, `DesktopNav`, `MobileNav`, `CustomCursor`, `PageHero`, `SectionHeader`, `Button`, `DossierCard`, `DossierGrid`, `DossierDialog`, `ProtocolTimeline`, `ProtocolPanel`, `EditorialFeature`, `AgentCodeGrid`, `DispatchTerminal`, `HQDetails`, and `SiteFooter` all reflect existing repeated visual patterns and can preserve current markup/classes initially.

## External dependencies

### npm/build dependencies

| Package | Manifest range | Lockfile resolution | Actual use |
|---|---:|---:|---|
| `firebase` | `^10.12.0` | `10.14.1` | Dynamically imports App and Firestore only |
| `gsap` | `^3.12.5` | `3.15.0` | Core timelines/tweens and ScrollTrigger |
| `vite` (dev) | `^5.4.0` | `5.4.21` | Dev server and MPA production build |

The Firebase umbrella package brings many service modules into `node_modules`, but Vite tree-shaking/dynamic imports mean source uses only App and Firestore. There are no duplicate animation libraries. The declared ranges are substantially behind newer major generations and should receive a separate compatibility/security upgrade review; dependency upgrades should not be mixed into the visual-parity migration.

The local dependency tree could not be queried through npm in the restricted audit environment because Node failed while resolving `C:\Users\LENOVO`; lockfile resolutions above were read directly. No packages were installed or updated.

### CDN/external resources and services

- Google Fonts CSS endpoint is the only hard-coded external URL in application source.
- GSAP and Firebase are npm imports, not CDN scripts.
- Vite dev server allows one hard-coded ngrok host in addition to normal local behavior; this is development configuration and should not become shared production config.
- No analytics, payments, chat, maps, captcha, tag manager, CMS, email provider, or other external service is present.

### Potential issues

- Font loading depends on a third party and the `@import` placement may prevent it from loading.
- `.env` is not ignored by the current `.gitignore` (only local environment variants are). Vite Firebase client values are not server secrets by themselves, but environment hygiene and repository history should be reviewed before multi-app work.
- Package ranges and resolved versions differ, as expected with caret ranges; reproducible CI should use the lockfile (`npm ci`).
- `dist` is present even though ignored. It can be mistaken for deployable current output if source changed after the last build.
- No CSP or security headers configuration exists in-repository.

## Firebase status

### Present

- Seven environment keys are read: API key, auth domain, project ID, storage bucket, messaging sender ID, app ID, and measurement ID.
- Real mode dynamically initializes Firebase App and obtains Firestore.
- The contact form adds documents to `dispatches`.
- Mock mode implements compatible `db`, `collection`, and `addDoc` exports using `localStorage` and generated IDs/timestamps.

Environment variable names were inspected; values are intentionally not reproduced in this report.

### Not present or not used

- Firebase Authentication
- Realtime Database
- Cloud Storage runtime API
- Cloud Functions
- Analytics initialization (a measurement ID alone does not initialize Analytics)
- App Check
- Performance Monitoring, Messaging, Remote Config, or Data Connect
- `firebase.json`, `.firebaserc`, Hosting targets/sites, rewrites, headers, redirects
- Firestore/Storage security rules, Firestore indexes
- Emulator configuration
- Admin SDK or trusted server-side validation

### Operational/security implications

- Real Firestore viability and safety depend on rules that are not available for audit. A public unauthenticated write path must be constrained by rules and ideally abuse controls/server-side validation.
- The mock database stores entered location and encoded message content persistently in the browser and logs the full document to the console.
- `btoa(payload)` can throw for characters outside the Latin-1 range; South African names/messages can legitimately contain Unicode.
- Base64 does not provide confidentiality despite UI copy describing encryption.
- The mock switch is brittle: missing/incorrect non-sentinel configuration attempts real Firebase initialization rather than failing with a clear configuration state.
- No created timestamp is included in real Firestore writes; only the mock adds `created_at`.

## React migration assessment

### A. Direct React component conversions

- Shared header/navigation/logo/footer
- Homepage hero, operation previews, and timeline
- Directive editorial and Agent Code sections
- Dossier grid/cards and modal markup
- Protocol hero and alternating panels
- Contact terminal chrome, form fields, and HQ details
- Buttons, tags, status indicators, and section headings

Start by retaining class names and CSS so component extraction does not become a redesign.

### B. Shared hooks/utilities

- `useActiveNav` or router-aware navigation state
- `useMobileNav` only where state is not kept directly in the component
- `useGsapContext`/component-local GSAP setup and cleanup
- `usePrefersReducedMotion`
- `useCustomCursor` (or a self-contained cursor component with RAF cleanup)
- Dossier lookup, price formatting, and selection serialization
- Firebase configuration validation and a typed dispatch repository
- Form schema/validation and Unicode-safe payload handling

### C. Should be rewritten

- Inline dossier handlers and `window.openDossierModal`
- Direct burger-line style mutation
- Modal focus/body-scroll lifecycle
- Monolithic terminal submit handler (separate state machine/presentation/persistence)
- Literal mock-key environment detection
- `innerHTML` command-log updates; render structured React nodes/text instead
- Duplicated catalogue/select/page data
- Animation setup without cleanup/reduced-motion handling

“Rewrite” here means behavior-preserving implementation behind components, not visual or product redesign.

### D. Remain external/static

- JPEG assets during parity work
- Google Fonts may remain external initially, subject to the loading/privacy decision
- Firebase remains an external service behind a local adapter
- Legal/brand copy remains static content until a CMS is explicitly required
- Full-page static delivery can remain viable; React does not require a client-only SPA

### E. Special animation/3D handling

- GSAP ScrollTrigger should be initialized in layout effects or a GSAP context scoped to component refs, then reverted on unmount.
- Preserve triggers, start thresholds, easing, duration, stagger, and CSS opacity assumptions during parity testing.
- Cursor RAF and listeners need cancellation/removal.
- No current feature needs R3F. Any later 3D scene should be lazy-loaded, isolated behind a client-only boundary, and have a static/reduced-motion fallback.

### Risk summary

| Risk | Severity | Why it matters |
|---|---|---|
| Catalogue data drift | High | Four copies can disagree and will affect ordering |
| Public Firestore write/rules unknown | High | Data integrity, privacy, and abuse exposure cannot be assessed fully |
| “Encryption” is Base64 | High | Product copy overstates technical confidentiality |
| Animation lifecycle/accessibility | Medium | React Strict Mode and reduced-motion users need explicit handling |
| No test/reference baseline | Medium | A visual migration can regress unnoticed |
| Global CSS and inline styles | Medium | Safe component ownership and future sharing are harder |
| Repeated page chrome | Medium | Changes can drift across five documents |
| Firebase adapter coupled to Vite env | Medium | Three independently deployed apps need separate validated config |
| Disabled form after success | Low/Medium | Further submission is impossible without reload |
| No existing 3D system | Low technically | Avoid assuming/rebuilding functionality that does not exist |

## React migration strategy

1. **Freeze a parity baseline.** Capture desktop/tablet/mobile reference screenshots and interaction notes for every page, including cursor, menu, modal, form, success/error states, and reduced-JS behavior. Add smoke and visual-regression coverage before changing markup.
2. **Create one canonical dossier model.** Define stable IDs, display names, price as a numeric/currency value, stage, timeframe, clearance, description, tags, and image. Render homepage previews, catalogue cards, modal, and form options from it.
3. **Introduce React at the public-site boundary.** Keep Vite and static assets. Choose a route strategy deliberately: a React MPA offers the closest hosting/URL parity; a router SPA simplifies shared shell/navigation but requires Firebase rewrites. Do not change URLs accidentally.
4. **Port the shared shell and purely static pages first.** Header, footer, homepage, Directive, and Protocol are low-risk. Preserve existing DOM/class names and move inline styles into named variants after parity.
5. **Port interactive UI.** Replace global/inline modal plumbing, then mobile navigation and custom cursor. Add keyboard semantics, reduced-motion support, and cleanup while preserving visuals.
6. **Port ordering state and form.** Use route/search state or a small typed persisted selection rather than a global. Keep form state explicit and separate the theatrical progress sequence from persistence.
7. **Isolate Firebase.** Provide a dispatch repository interface with real and mock implementations, explicit environment selection, configuration validation, server timestamps, and structured errors. Review rules outside this frontend task before production use.
8. **Remove legacy pages only after parity and deployment validation.** Keep rollback points and avoid simultaneous framework, dependency-major, design, and Firebase changes.

No global state library is justified by the current site. React local state/context and a typed data module are sufficient. Add a query/state library only when authenticated dashboards introduce real server-state complexity.

## Recommended future repository architecture

The target should be a workspace/monorepo in which each application owns its build, environment, Firebase hosting target, routing, and app-specific UI. Shared packages should be deliberately small and must not assume browser-only globals or one Firebase project.

```text
secret-service/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/                 # Routes/entry and providers
│   │   │   ├── components/          # Public-site compositions
│   │   │   ├── features/dossiers/
│   │   │   ├── features/dispatch/
│   │   │   └── styles/
│   │   ├── public/assets/
│   │   ├── index.html
│   │   ├── vite.config.*
│   │   └── package.json
│   ├── admin/
│   │   ├── src/                     # Authenticated operations/admin features
│   │   ├── vite.config.*
│   │   └── package.json
│   └── customer/
│       ├── src/                     # Authenticated customer/order features
│       ├── vite.config.*
│       └── package.json
├── packages/
│   ├── ui/                          # Brand tokens and genuinely shared primitives
│   ├── types/                       # Dossier, dispatch, user, status contracts
│   └── config/                      # Shared lint/TS/build conventions, not secrets
├── firebase/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   ├── storage.rules
│   └── functions/                   # Only if trusted backend workflows are needed
├── firebase.json                    # Three hosting targets/config blocks
├── .firebaserc                      # Project aliases and target mapping
├── package.json                     # Workspace scripts
└── package-lock.json                # Single lockfile if npm workspaces are chosen
```

### Architectural boundaries

- `apps/web` owns marketing copy, public ordering flow, SEO metadata, and public-page composition.
- `apps/admin` owns privileged operational views and must enforce authorization both in UI and Firebase rules/backend—not merely hide routes.
- `apps/customer` owns customer authentication, profile, order history/status, and customer actions.
- `packages/ui` should contain tokens and primitives that are truly shared; marketing-specific classified cards should stay in `apps/web` unless another app genuinely uses them.
- `packages/types` should contain data contracts without Firebase/browser imports.
- `packages/config` should contain safe configuration schemas/defaults and tool presets, never credentials.
- A separate Firebase adapter per app can consume shared domain types while initializing its own environment values.
- Each app needs an independent build command and output directory, plus an explicit Firebase Hosting site/target. Root scripts can orchestrate all or one app.
- Shared runtime packages should be versioned/tested as workspace dependencies. Avoid importing app source across app boundaries.
- Admin/customer authentication should be designed together with claims/roles, rules, and trusted workflows before those dashboards are built.

## Proposed migration sequence

1. Document current URLs, behavior, content, and responsive screenshots.
2. Add non-invasive smoke, accessibility, and visual checks around the vanilla site.
3. Establish a canonical typed dossier/dispatch contract and reconcile naming/currency/content decisions.
4. Create the workspace skeleton and `apps/web` build without moving admin/customer work ahead of public-site parity.
5. Port design tokens, fonts, global reset, static assets, and shared shell.
6. Port homepage, Directive, and Protocol with pixel/animation parity.
7. Port dossier catalogue/modal using canonical data and accessible dialog behavior.
8. Port contact/dispatch form with a separated persistence adapter and verified Firestore rules/data contract.
9. Validate all public routes and deploy `apps/web` to its own Firebase Hosting target.
10. Add `packages/ui`, `packages/types`, and `packages/config` only as real cross-app reuse emerges; avoid speculative abstraction.
11. Build the authentication/authorization foundation, then `apps/customer`.
12. Build `apps/admin` with least-privilege roles, auditing, and trusted mutations.
13. Configure and test three independent Hosting deployments, previews, CI gates, and rollback paths.
14. Retire legacy vanilla entry points only after production parity and acceptance.

## Questions / Unknowns

- Are the current `.env` values mock, development, or production, and is `.env` tracked in the actual source-control history? Values were not reproduced, and repository status could not be established because Git did not recognize the accessible workspace as a repository despite a `.git` directory entry being visible.
- What Firestore security rules, indexes, data-retention policies, and Firebase project/region settings exist outside this repository?
- Which Firebase projects and Hosting site IDs should back `web`, `admin`, and `customer` in development, staging, and production?
- Should current dollar prices remain, or are they placeholders for South African rand pricing?
- Are statements such as “encrypted,” “zero digital footprint,” “we do not keep logs,” and “discard billing details” product copy only, or requirements that the eventual backend must demonstrably enforce?
- Is the contact form intended to create a binding order, a lead/request, or a staged draft, and what customer/contact/payment/consent data is actually required?
- Is immersive 3D a future approved requirement? No 3D implementation or assets currently exist.
- Are the displayed HQ address, email domain, PGP fingerprint, coordinates, “EST. 1952,” and agent/service claims final production content or placeholders?
- Which route format must be preserved in production: explicit `.html` URLs, extensionless routes, or a client-side SPA?
- Are there reference designs, supported-browser targets, accessibility requirements, analytics requirements, or performance budgets outside the repository?
