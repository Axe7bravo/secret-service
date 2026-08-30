# Secret Service Customer Dashboard — Milestone 1

Date: 2026-08-30  
Scope: customer portal UI and frontend architecture using mock data only. No Firebase, real authentication, payment processing, checkout, persistence, messages, or notifications are implemented.

## Routes

| Route | Purpose |
|---|---|
| `/` | Redirects to `/dashboard` after the mock guard |
| `/login` | Temporary mock customer access |
| `/dashboard` | Active/recent operation overview and compact metrics |
| `/operations` | All customer operations with All/Active/Completed filtering |
| `/operations/:operationId` | Private operation file and customer-safe tracking |
| `/account` | Read-only customer profile and contact summary |
| Unknown routes | Customer portal Not Found view |

## Components

- `CustomerShell`: responsive private-client navigation, mobile drawer, customer identity, and working mock Sign Out.
- `PageHeader`: consistent private portal page headings and optional action area.
- `OperationCard`: responsive operation summary used on dashboard and archive pages.
- `CustomerStatusBadge`: renders only customer-facing status labels.
- `TrackingTimeline`: five-stage customer tracking presentation without internal workflow details.
- `SectionCard`: operation/account information grouping.

All presentation remains under `apps/customer`; no customer component was promoted prematurely to `packages/ui`.

## Mock authentication

Development credentials:

```text
Email:    customer@secretservice.co.za
Password: Mission2026!
```

The credentials live only in `auth/mockCustomerAuth.ts`. The login UI calls `customerAuthService`, which exposes `login()`, `logout()`, and `isAuthenticated()` and can later be replaced behind the same boundary.

A successful login stores only `authenticated` under `sessionStorage['secret-service-customer-mock-session']`. It never stores the password. The marker survives refreshes during the current browser session and is removed when the session/browser closes. Sign Out clears it and replaces the route with `/login`.

`CustomerAuthGuard` protects `/dashboard`, `/operations`, `/operations/:operationId`, `/account`, and the authenticated portal shell. This is client-side presentation logic only: credentials and the marker can be inspected or bypassed.

**Mock authentication must not be used as production authorization.**

## Dashboard

- Compact Active, Completed, and Total Operations metrics
- Up to three Active Operations
- Recent completed/delivered operations
- Link to the full private operation archive
- A visible but disabled Start a New Operation CTA

The CTA remains disabled because `apps/web` and `apps/customer` are independently deployed and no canonical cross-site public ordering URL is configured. No broken destination or duplicate checkout was invented.

## My Operations

The customer can filter seven local records by All, Active, or Completed. Cards show only useful sender-facing information: operation ID, package, recipient, customer-facing status, requested delivery date, amount, and file link. There is no desktop-only table or horizontal mobile overflow dependency.

## Mock data model and privacy boundary

`CustomerProfile` contains the current mock client’s identity and contact summary. `CustomerOperation` is a customer-safe projection containing:

- operation ID and creation time
- package and public package description
- recipient name, campus, and delivery destination
- requested date/window
- amount and customer-safe payment details
- internal status value used only as mapping input
- the sender’s own anonymous message

It intentionally excludes internal moderation status, moderation notes, operational staff notes, ambassador identity/contact details, failure diagnostics, and admin workflow controls.

The admin dashboard’s full `Operation` type remains admin-local and includes internal-only fields. Importing it into the customer portal would weaken the privacy boundary, so this milestone uses a smaller view model rather than duplicating or exposing the full admin record. Shared domain contracts should move to `packages/types` only when a backend DTO is defined for more than one app.

## Customer-facing status mapping

| Internal input | Customer display |
|---|---|
| `PAYMENT_PENDING` | Payment Pending |
| `PAID`, `REVIEW_REQUIRED`, `APPROVED` | Confirmed |
| `PREPARING`, `READY_FOR_DELIVERY` | Preparing Your Operation |
| `AMBASSADOR_ASSIGNED` | Delivery Scheduled |
| `OUT_FOR_DELIVERY` | In Progress |
| `DELIVERED` | Delivered |
| `COMPLETED` | Operation Complete |
| `REJECTED` | Requires Attention |
| `CANCELLED` | Cancelled |
| `REFUNDED` | Refunded |
| `DELIVERY_FAILED` | Delivery Issue |

`utils/status.ts` owns this mapping and the active/completed classification. Pages never duplicate customer labels.

The operation file tracks five meaningful stages: Operation Confirmed, Preparation Underway, Agent Assigned, Operation In Progress, and Delivery Complete. It does not simulate live GPS or expose internal moderation.

## Repository boundary

- `customerRepository.getCurrent()` returns the current mock profile.
- `customerOperationsRepository.list()` returns the current customer’s operation projection.
- `customerOperationsRepository.getById()` resolves a private operation file.

Pages import repositories, not mock JSON/constants. A future Firebase implementation can replace these methods with async queries/hooks without adding Firestore imports throughout the UI.

## Responsive approach

- Desktop uses a private-client sidebar and three/two-column operation grids.
- At `850px`, navigation becomes an overlay drawer.
- At `650px`, operation grids, metrics, summaries, details, and account sections become single-column.
- The tracking timeline changes from horizontal to vertical on mobile.
- Filter buttons remain touch-friendly and operation cards avoid table overflow.
- Reduced-motion preference disables drawer/card transitions.

## Future Firebase integration

Later milestones should replace the two repositories with Firebase-backed implementations that return customer-safe DTOs filtered by the authenticated customer UID. Firestore rules must enforce ownership; filtering only in React is not authorization. Firebase Auth should replace the mock service behind an app-level auth provider/listener. Payment records should remain server-authoritative and read-only to customer clients.

Do not send the full admin operation document to the customer application. Prefer an explicit safe projection or separately secured customer view.

## Files changed

- `apps/customer/src/main.tsx`
- `apps/customer/src/App.tsx`
- `apps/customer/src/auth/CustomerAuthGuard.tsx`
- `apps/customer/src/auth/customerAuthService.ts`
- `apps/customer/src/auth/mockCustomerAuth.ts`
- `apps/customer/src/components/CustomerShell.tsx`
- `apps/customer/src/components/CustomerStatusBadge.tsx`
- `apps/customer/src/components/OperationCard.tsx`
- `apps/customer/src/components/PageHeader.tsx`
- `apps/customer/src/components/SectionCard.tsx`
- `apps/customer/src/components/TrackingTimeline.tsx`
- `apps/customer/src/data/customerRepository.ts`
- `apps/customer/src/pages/AccountPage.tsx`
- `apps/customer/src/pages/CustomerLoginPage.tsx`
- `apps/customer/src/pages/DashboardPage.tsx`
- `apps/customer/src/pages/NotFoundPage.tsx`
- `apps/customer/src/pages/OperationDetailPage.tsx`
- `apps/customer/src/pages/OperationsPage.tsx`
- `apps/customer/src/styles/customer.css`
- `apps/customer/src/types/customer.ts`
- `apps/customer/src/utils/formatters.ts`
- `apps/customer/src/utils/status.ts`
- `CUSTOMER_MILESTONE_1.md`

## MANUAL VERIFICATION

No command-based verification was performed. Run these yourself from the repository root:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev:customer
```

Manual browser checklist:

- `/login` renders the branded private-client login and development credential panel.
- Incorrect credentials show one neutral access-denied error.
- Correct credentials open `/dashboard`.
- `/dashboard`, `/operations`, `/operations/:operationId`, and `/account` redirect to `/login` when logged out.
- Dashboard metrics, Active Operations, and Recent Operations render.
- Start a New Operation is visibly disabled and has no broken destination.
- My Operations renders all seven records.
- All, Active, and Completed filters return the expected cards.
- Every operation card opens its matching private operation file.
- Customer-facing status labels match the documented mapping and no moderation/internal staff data appears.
- Tracking stages are sensible for confirmed, preparing, scheduled, in-progress, delivered, and completed records.
- Operation details show recipient, package, message, delivery, and payment sections.
- Account renders profile/contact data and a disabled Edit Profile action.
- Refresh remains authenticated within the mock browser session.
- Sign Out clears the session and returns to `/login`.
- Mobile navigation opens, closes by overlay/route change, and exposes Dashboard, My Operations, and Account.
- Mobile cards/timeline/details show no obvious horizontal overflow.
- Keyboard focus is visible and form labels are associated correctly.
- Browser console shows no obvious errors.
- The admin and public applications were not modified unintentionally.
