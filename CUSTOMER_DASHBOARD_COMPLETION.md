# Customer Dashboard Completion

## Architecture and routes

The private customer portal remains protected by `CustomerAuthGuard` and Firebase Authentication. Its routes are `/dashboard`, `/operations`, `/operations/new`, `/operations/:operationId`, and `/account`.

Customers read only backend-maintained `customerOperations` projections. Authoritative `operations`, `operationInternal`, privileged activity, admin directories, ambassador records, moderation notes, and internal delivery details are not read by the customer application.

## Dashboard and operations

Dashboard metrics derive from the selected customer repository and include active, successfully completed, and total operation counts. Recent operation cards link to Operation Detail, and an empty account links directly to New Operation.

My Operations supports active/closed filtering, loading, failure with retry, empty-account, and no-filter-match states. Firebase reads are scoped by the authenticated UID and ordered by creation time.

The repository exposes a realtime subscription API. In Firebase mode it uses one UID-scoped `onSnapshot` listener with cleanup. In mock mode the same interface publishes mock changes. React pages do not contain raw Firestore listeners.

## Operation detail and tracking

Operation Detail displays only projection fields: operation reference, package snapshot, customer-owned recipient summary, requested delivery information, safe payment summary, safe timestamps, anonymous message, and customer-facing status.

The single customer presentation map translates projection states into:

- Under Review
- Approved
- Payment Required
- Confirmed
- Preparing Your Operation
- Delivery Scheduled
- In Progress
- Delivered
- Operation Complete
- Requires Attention
- Cancelled
- Delivery Issue
- Refunded

Successful states use the progression Under Review → Approved → Payment Required → Confirmed → Preparing → Delivery Scheduled → In Progress → Delivered → Operation Complete. Side and terminal exception states render separately rather than pretending to advance through the successful path. Progress contains no hardcoded percentages.

Admin workflow changes rebuild `customerOperations` in the trusted transaction. The realtime repository then updates dashboard, list, and detail views.

## Package and campus catalogue

Firebase mode obtains catalogue data through the authenticated `getCustomerCatalog` callable. It returns an allowlisted projection of active packages and campuses only. Package price, active state, and campus eligibility are still revalidated in `createOperation`; the browser never supplies a trusted price, owner UID, status, payment state, or moderation state.

Mock mode maps the established package fixtures and lightweight campus fixtures behind the same catalogue repository. Hardcoded package fixtures are not the Firebase source of truth.

New operations submit a stable package ID and campus code. The trusted transaction resolves the current active records and stores immutable package and campus-name snapshots. Historical operations retain their original snapshots when catalogue records later change.

## Operation creation and dates

The creation form provides catalogue loading, failure/retry, no-active-package, no-active-campus, submission error, and pending states. Submission is disabled while pending, preventing double-click duplicates while preserving entered form values after failure. Successful creation navigates to the new Operation Detail.

Requested delivery date uses a native `input[type=date]`, a browser-local date-only minimum, and `YYYY-MM-DD` values without UTC conversion. The trusted Function independently validates format, real calendar validity, and that the date is not earlier than the current Johannesburg date.

## Account and authentication

Account displays only Firebase Auth display name, email, and verification state. It does not substitute mock profile fields when Firebase values are absent. Identity edits remain read-only because safe email/profile mutation would require a deliberate reauthentication-aware flow.

Login, signup, logout, auth loading, redirect preservation, and understandable Firebase errors remain intact. No custom claims, provider internals, tokens, or Firebase security metadata are displayed.

## Mock and Firebase modes

Mock mode supports dashboard, list, detail, creation, catalogue selection, tracking, and the Auth-backed account summary through repository adapters.

Firebase mode supports authenticated projection subscriptions, customer-safe detail lookup, trusted catalogue reads, trusted operation creation, active-campus validation, immutable snapshots, and realtime safe tracking.

## Ownership and privacy

- Firestore queries require the authenticated UID and filter `customerOperations.customerId` by that UID.
- Operation Detail searches only the authenticated customer's subscribed projections.
- The trusted create command derives ownership from `request.auth.uid`.
- The client cannot provide price, status, moderation, payment, timestamps, or internal metadata.
- Recipient data remains scoped to each owned projection.
- Ambassador contact details, failure reasons, moderation notes, safety flags, staff notes, and privileged activity are never projected.

## Customer Operation Archiving

Archiving is customer-specific presentation state stored only on the owned `customerOperations` safe projection as `archived` and optional `archivedAt`. It is not an operation lifecycle status and never changes the authoritative operation, admin queues, fulfilment, moderation, payment, or activity history.

The trusted `setCustomerOperationArchived` callable requires Firebase Authentication, derives the customer UID from `request.auth.uid`, reads both the authoritative operation and safe projection in one transaction, verifies that both belong to that UID, and updates only archive metadata. The client cannot supply a customer UID or mutate arbitrary projection fields. Firestore browser write permissions remain unchanged.

Archive eligibility is enforced server-side for the permanently terminal `COMPLETED`, `CANCELLED`, `REFUNDED`, and `REJECTED` states. `DELIVERED`, `DELIVERY_FAILED`, and every active state remain unarchiveable. Restore removes `archivedAt`, sets `archived` false, and never changes lifecycle state.

Projection fields have explicit ownership:

- System-maintained fields include status, package and recipient snapshots, delivery summary, payment summary, tracking, and system timestamps.
- Customer-maintained fields are limited to `archived` and `archivedAt`.

Operation creation initializes `archived: false`. Admin workflow and ambassador-assignment transactions read the existing projection and pass its archive metadata into the projection builder, so a later safe projection refresh cannot erase the customer's preference.

My Operations provides All, Active, History, and Archived filters. The first three exclude archived records; Archived shows only archived records. Archive controls are shown only for eligible operations, use a confirmation dialog, disable duplicate submissions, and display callable failures without optimistically removing data. Archived cards and detail pages retain their real lifecycle badge and add a separate text-labelled Archived indicator. Restore is available from both the archived list and detail view.

Dashboard active and recent-operation sections exclude archived files. The completed metric remains a lifetime completed count, including archived completed operations. Realtime repository subscriptions remain the only UI update path after trusted archive/restore commands; no polling or component-level Firestore listeners were added.

Mock mode applies the same eligibility and command interface and keeps archive preference in the existing in-memory mock session. Firebase mode uses the trusted callable and the existing UID-scoped realtime projection query. Permanent deletion, bulk operations, automatic retention, admin archive management, and lifecycle changes are intentionally excluded.

## UI/UX Restoration

The requested `D:\Programming_projects\VibeCoding2026\secret-service-old-customer` worktree was not present on disk during this pass. The exact `apps/customer` tree from historical commit `3c77771` was therefore inspected read-only from repository history and used as the primary Customer Dashboard UI/UX reference. The current cec8e64-derived Secret Service visual language was used only as secondary guidance for current controls with no direct historical equivalent.

Restored historical presentation includes:

- the 250px private-client sidebar, classified navigation groups, identity block, secure-session top bar, and mobile drawer behavior;
- the wide dossier workspace, ruled page headers, compact metric strip, active/archive dashboard composition, and restrained whitespace;
- operation-file cards with separated header, summary data, and explicit file-opening action;
- the operation detail file summary, bordered section hierarchy, sealed-message treatment, and responsive two-column composition;
- the charcoal, bone, neutral-gray, and restrained deep-crimson token system with Space Grotesk, Inter, and Space Mono typography;
- the classified private-access login/signup framing and the historical account-file presentation.

Current functionality was intentionally adapted into that design rather than replaced. The six-stage safe tracker extends the historical timeline from five to six stages. Catalogue loading/failure states, active package cards, the campus selector, native date input, retry controls, no-catalogue states, duplicate-submit protection, Firebase Auth notices, and successful-creation feedback now use the same historical surfaces, borders, typography, and restrained status treatment.

No historical mock authentication, mock credentials, repository implementation, data fixtures as production truth, obsolete operation types, routing model, or Firebase access pattern was restored. Current Firebase Auth, UID-scoped realtime projections, safe status mapping, trusted operation creation, backend package/campus authority, immutable snapshots, date validation, mock/Firebase adapters, and account privacy boundaries remain authoritative.

Intentional differences from `3c77771` are limited to current product requirements: New Operation is an active navigation route, login and signup use real Firebase Authentication, the tracker has six customer-safe stages with separate side states, Account exposes only supported Firebase Auth fields, and all loading/error/empty/catalogue states remain functional.

## Known limitations and deferred work

- Account/profile editing is intentionally read-only.
- Requested delivery windows remain the existing text value; only calendar dates use the native date control.
- Catalogue reads are request-based rather than realtime because active state is revalidated during submission.
- Payment collection and checkout are not implemented.
- Email, SMS, push, support chat, recipient responses, ambassador portal, Admin Payments, Admin Moderation, Admin Settings, and deployment remain deferred.

## Manual verification

Run manually from the repository root:

```text
npm run typecheck
npm run lint
npm run build
```

Then verify login/signup/logout, route guarding, mock and Firebase modes, UID isolation, realtime status changes, all empty/error/loading states, active catalogue filtering, campus validation, date validation, duplicate-submit prevention, operation creation navigation, responsive tracking, and absence of privileged fields.
