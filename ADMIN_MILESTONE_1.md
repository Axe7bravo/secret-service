# Secret Service Admin Dashboard — Milestone 1

Date: 2026-08-30  
Scope: UI and frontend architecture only. This milestone uses local mock data and contains no Firebase, authentication, persistence, payment, moderation, or workflow implementation.

## Routes created

| Route | Purpose |
|---|---|
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Operational overview, recent operations, and action-required queue |
| `/operations` | Searchable and filterable operations ledger |
| `/operations/:operationId` | Internal Operation File detail view |
| Unknown routes | Simple admin Not Found page |

## Components created

- `AdminShell`: responsive application frame, sidebar/drawer, top bar, current-admin prototype, and route outlet.
- `PageHeader`: consistent page title, context, description, and optional action slot.
- `MetricBlock`: represented directly by the small repeated dashboard metric markup because a separate generic abstraction was not yet warranted.
- `OperationStatusBadge`: maps the complete lifecycle to five restrained semantic tone groups.
- `OperationList`: accessible desktop table that transforms into readable operation cards on mobile.
- `SectionCard`: consistent internal information section used by dashboard and Operation File pages.

All components are admin-specific and remain under `apps/admin`. Nothing was moved to `packages/ui`; the public marketing UI and internal operations UI have different responsibilities.

## Dashboard sections

- Compact operational summary: New Operations, Awaiting Review, Preparing, Out for Delivery, and Completed Today.
- Recent Operations: five latest records with direct Operation File links.
- Action Required: review-required, failed-delivery, and incomplete/new records with a concise reason.

No charts or decorative analytics were added.

## Operations workspace

The ledger supports local frontend filtering by:

- Operation ID, customer name, or recipient name
- Operation status
- Package type

Desktop columns cover operation/customer, package, recipient, campus, status, requested delivery, ZAR amount, creation time, and open action. At mobile widths, each table row becomes a labeled two-column card so operators do not have to use an unusable horizontal table.

## Operation File

The detail route resolves its record through the repository boundary and displays:

- Operation header, package, current status, creation date, amount, and requested delivery
- Customer/sender contact details
- Recipient, campus, residence, location, and delivery notes
- Package price/date/window
- Visually distinct Classified Message
- Moderation status and disabled prototype controls
- Delivery status, ambassador assignment, window, and notes
- Payment status, reference, amount, and payment date

Approve, Reject, Start Preparation, Assign Ambassador, and moderation actions are deliberately disabled. They demonstrate placement without implying a working workflow or mutating mock data.

## Mock data structure

`Operation` is currently admin-local because no second application consumes this operational record yet. It includes:

- Identity/timing: `operationId`, `createdAt`
- Package: `packageType`, `amount`
- Customer: name, email, phone
- Recipient: name, phone, campus, residence, location, notes
- Requested delivery: date and window
- Payment: status, reference, date
- Operations: lifecycle status, ambassador
- Moderation: status and anonymous message

`operationsRepository` is the only data-access boundary. It currently exposes synchronous `list()` and `getById()` methods over twelve safe, realistic Bloemfontein campus cases. A later Firebase repository can implement an asynchronous equivalent without scattering Firestore imports across pages.

## Operation status model

Primary lifecycle:

```text
NEW
PAYMENT_PENDING
PAID
REVIEW_REQUIRED
APPROVED
PREPARING
READY_FOR_DELIVERY
AMBASSADOR_ASSIGNED
OUT_FOR_DELIVERY
DELIVERED
COMPLETED
```

Exception/side states:

```text
REJECTED
CANCELLED
DELIVERY_FAILED
REFUNDED
```

Statuses are display-only. `OperationStatusBadge` groups them into neutral, attention, active, success, and danger tones rather than assigning a different bright colour to every state.

## Design decisions

- The public brand’s black, charcoal, bone, crimson, geometric heading, and monospace-label language is retained in a quieter data-first system.
- Borders and hierarchy replace glow, glass, decorative charts, and large colourful statistic cards.
- “Operation,” “Operation File,” and “Classified Message” reinforce the product model, while field labels remain direct and operational.
- Admin-specific CSS has no dependency on the marketing stylesheet.
- No state-management, data-grid, charting, UI-framework, animation, or Firebase dependency was added.
- Disabled future sidebar modules expose the intended information architecture without creating empty routes that look complete.

## Responsive strategy

- Desktop uses a fixed-width sidebar and wide operational workspace.
- At `900px`, the sidebar becomes an accessible drawer with an overlay and menu button.
- Dashboard columns and filters collapse progressively.
- At `700px`, tables become labeled cards, metrics use a two-column arrangement, detail sections become single-column, and action/header layouts wrap.
- Reduced-motion preference removes drawer transition animation.

## Future Firebase integration point

Replace the mock repository with an asynchronous implementation under the same data-access boundary, for example:

```text
apps/admin/src/data/
  operationsRepository.ts          # interface/factory
  firebaseOperationsRepository.ts  # future Firestore implementation
```

The future repository should own mapping between Firestore documents and `Operation`, pagination, status queries, timestamps, and structured failures. Pages should consume hooks/services layered over that repository rather than importing Firestore directly. No Firebase call, collection, rule, or resource was created in this milestone.

## Future authentication boundary

Real authentication should continue to wrap the admin route tree at the app boundary when implemented. Route visibility is not authorization: administrative claims/roles must also be enforced by Firebase rules and trusted backend operations. The current login, route guard, admin identity, and sign-out behavior are temporary client-side mocks only; no verified identity, claim, role, permission, or auth listener exists yet.

## TEMPORARY MOCK ADMIN AUTH

The admin prototype now includes `/login`, a client-side route guard, and a browser-session marker so the team can review the intended access experience before Firebase Authentication is implemented.

Development credentials:

```text
Email:    admin@secretservice.co.za
Password: Operation2026!
```

These values live only in `auth/mockAdminAuth.ts`, which is explicitly marked for removal. The login UI calls `adminAuthService`; it does not compare credential strings itself. The service currently exposes `login()`, `logout()`, and `isAuthenticated()`, forming the boundary a later Firebase-backed implementation can replace.

On successful mock login, the service stores only the value `authenticated` under `sessionStorage['secret-service-admin-mock-session']` and redirects to `/dashboard`. It does not store the email or password. The session survives refreshes within the current browser tab/session and is discarded when the browser session ends. Sign Out removes the marker and replaces the current route with `/login`.

`AdminAuthGuard` protects:

- `/dashboard`
- `/operations`
- `/operations/:operationId`
- the current authenticated admin shell and its Not Found route

Unauthenticated access redirects to `/login`. The login page displays a discreet development-only credential panel and a direct warning that the mechanism is not secure.

Files involved:

- `src/auth/mockAdminAuth.ts`
- `src/auth/adminAuthService.ts`
- `src/auth/AdminAuthGuard.tsx`
- `src/pages/AdminLoginPage.tsx`
- `src/App.tsx`
- `src/components/AdminShell.tsx`
- `src/styles/admin.css`

This is only client-side presentation logic. Anyone can inspect the credentials, create the session marker, or bypass the React guard. It provides no identity assurance, authorization, backend enforcement, claims, roles, or data protection.

**Mock authentication must not be used as production authorization.**

When Firebase Authentication is introduced, remove `mockAdminAuth.ts` and the development credential panel, replace the service implementation with Firebase session methods, subscribe through an app-level auth provider, and enforce administrator claims in Firebase rules and trusted backend operations. Route guards may remain as navigation UX, but must never be the security boundary.

## Files changed

- `apps/admin/src/main.tsx`
- `apps/admin/src/App.tsx`
- `apps/admin/src/auth/AdminAuthGuard.tsx`
- `apps/admin/src/auth/adminAuthService.ts`
- `apps/admin/src/auth/mockAdminAuth.ts`
- `apps/admin/src/components/AdminShell.tsx`
- `apps/admin/src/components/OperationList.tsx`
- `apps/admin/src/components/OperationStatusBadge.tsx`
- `apps/admin/src/components/PageHeader.tsx`
- `apps/admin/src/components/SectionCard.tsx`
- `apps/admin/src/data/operationsRepository.ts`
- `apps/admin/src/pages/DashboardPage.tsx`
- `apps/admin/src/pages/AdminLoginPage.tsx`
- `apps/admin/src/pages/NotFoundPage.tsx`
- `apps/admin/src/pages/OperationDetailPage.tsx`
- `apps/admin/src/pages/OperationsPage.tsx`
- `apps/admin/src/styles/admin.css`
- `apps/admin/src/types/operations.ts`
- `apps/admin/src/utils/formatters.ts`
- `ADMIN_MILESTONE_1.md`

## MANUAL VERIFICATION

No command-based verification was performed for this milestone. Run these commands yourself from the repository root:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev:admin
```

Manual browser checklist:

- `/` redirects to `/dashboard`.
- Visiting `/dashboard` while logged out redirects to `/login`.
- Visiting `/operations` while logged out redirects to `/login`.
- Incorrect credentials show the single inline “Access denied” error.
- Correct mock credentials redirect to `/dashboard`.
- Refreshing during the current browser session remains logged in.
- Sign Out clears the mock session and returns to `/login`.
- Closing the session/browser removes the session marker.
- Direct operation-detail routes remain protected while logged out.
- `/dashboard` renders metrics, five recent operations, and the Action Required queue.
- Desktop sidebar navigation indicates the current route.
- Disabled future modules and sign-out control do not navigate or mutate state.
- `/operations` renders all mock records.
- Search matches operation IDs, customers, and recipients.
- Status and package filters work alone and together; Clear filters resets them.
- Operation rows/cards open `/operations/:operationId`.
- Operation Files show customer, recipient, package, Classified Message, moderation, delivery, and payment sections.
- Unknown operation IDs show File Not Found and a route back to Operations.
- Unknown admin routes show the general Not Found page.
- At tablet/mobile widths, the sidebar opens as a drawer and closes on overlay click or route navigation.
- Mobile operation cards have readable labels and no obvious horizontal overflow.
- Keyboard focus is visible for navigation, filters, buttons, and operation links.
- Browser console shows no obvious errors.
- The existing public website under `apps/web` remains unchanged.
