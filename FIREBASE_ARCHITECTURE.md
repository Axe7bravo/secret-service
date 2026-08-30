# Secret Service Firebase Architecture

Status: Architecture Decision Record — Firebase Architecture Milestone 1  
Scope: Planning only; no Firebase implementation is included.

## 1. Executive Summary

Secret Service should use Firebase Authentication, Firestore, and trusted backend functions in a hybrid architecture. The authoritative `operations/{operationId}` document should contain the business identity, ownership key, lifecycle status, and carefully limited operational summaries. Sensitive moderation, delivery, risk, and staff information should live in a separately secured `operationInternal/{operationId}` document. Customers should read a purpose-built `customerOperations/{operationId}` projection rather than the authoritative or internal records.

The projection is deliberate duplication, not a second source of truth. Trusted backend code creates and updates it atomically with authoritative operation changes. This design respects Firestore's document-level read model, gives the customer application a simple safe query, and prevents new internal fields from becoming customer-visible by accident.

Firebase Auth establishes identity. Privileged access is authorized with trusted custom claims, while `users/{uid}` holds display/profile data and a non-authoritative role mirror for UI use. Sensitive state transitions, operation creation, payment updates, projection writes, and audit writes should be performed by callable/HTTP Cloud Functions or another trusted backend—not directly by browsers.

## 2. Existing Architecture

The monorepo currently contains `apps/web`, `apps/admin`, and `apps/customer`, with shared `packages/ui`, `packages/types`, and `packages/config`. Admin and customer applications already isolate UI from data through repository/service boundaries. Admin workflow rules are centralized in TypeScript, admin operations use a mock mutable repository and session storage, and customer operations use a customer-safe projection/status adapter. Both authenticated apps currently use temporary mock authentication.

These are useful migration seams:

- Admin pages consume an operations repository and an auth service rather than owning persistence.
- The admin workflow is pure domain logic and can be reused by trusted backend code after extracting platform-neutral rules.
- Customer pages consume customer-safe records and labels rather than full admin operation objects.
- Mock ambassador records already sit behind an admin data boundary.

The production migration should replace adapters behind these seams. Components should not import Firebase SDKs or Firestore document shapes directly.

## 3. Authentication Model

### Customers

- Firebase Authentication email/password initially.
- Public signup is allowed through a controlled customer registration flow.
- Email verification should be required before sensitive actions such as checkout or contact-detail changes.
- OAuth providers may be added later without changing the UID-based data model.
- Passwords and password-derived material never belong in Firestore.

### Admins

- Firebase Authentication accounts provisioned privately; no public admin signup.
- Initial provider may be email/password, but MFA and an organizational identity provider should be evaluated before production launch.
- An authenticated user is an admin only when a trusted backend has set an `admin: true` custom claim.
- Admin routes hidden by React are a usability feature, not authorization.

### Ambassadors

- Defer ambassador authentication until a delivery-facing application or workflow is implemented.
- Create operational ambassador records now without requiring each record to have a UID.
- Later, link an invited Firebase Auth user through `ambassadors/{ambassadorId}.userId` and issue an `ambassador: true` claim.
- This separate operational ID keeps assignment history stable if an account is replaced, disabled, or not yet activated.

### Session behavior

Applications should use Firebase Auth's auth-state observer as the source of session state. Protected route guards wait for initial auth resolution, then require both authentication and appropriate claims. Logout uses Firebase Auth sign-out. Current mock credentials, session keys, and mock services must be removed—not retained as a fallback—when real auth is enabled.

## 4. Authorization and Roles

Use custom claims plus Firestore profiles:

- Claims: small, trusted authorization facts such as `admin: true`, `ambassador: true`, and optionally `rolesVersion`. Claims are set only by trusted backend administration.
- `users/{uid}`: profile, account status, display data, preferences, and a role mirror useful to the UI. Its role field is not sufficient for privileged rules because a client-writable profile can be tampered with and profile reads add ambiguity to security decisions.
- Operational records: ambassador permissions also require assignment checks against authoritative data; a claim alone must not grant access to every operation.

Recommended claims are booleans rather than a single exclusive role because a staff member may legitimately hold more than one capability. Customer is the default authenticated identity, not a privileged claim. Rules should use `request.auth.token.admin == true` and `request.auth.token.ambassador == true` for privileged gates.

Role changes are made by a trusted administration function, which updates claims and the profile mirror. Claim changes reach existing clients only after ID-token refresh; the administration flow should revoke refresh tokens for urgent removals and the frontend should force a token refresh after a known change. Disabled account enforcement belongs in Firebase Auth and, where needed, a profile status check.

## 5. User and Customer Model

Use one `users/{uid}` profile initially:

```text
uid, email, firstName, lastName, phone,
roleDisplay, status, emailVerified,
createdAt, updatedAt
```

The document ID is the Auth UID; a duplicated `uid` field is optional and useful only for exports. Firebase Auth remains authoritative for email verification and account enablement. Customers do not need a separate collection until genuinely customer-specific profile data emerges. Admin-specific privileges stay in claims, and ambassador operational metadata stays in `ambassadors`.

Customers may update a strict allowlist of their own profile fields through direct writes if rules validate field changes. Status, role display, timestamps, and administrative fields are backend-owned.

## 6. Firestore Collection Design

### `users/{uid}`

Purpose: account profile and non-authoritative UI role mirror. Owner reads their profile; admins read profiles for support. Owner writes only permitted contact/profile fields; backend owns role/status/audit fields. Customer-visible only to that customer.

### `packages/{packageId}`

Purpose: product catalogue. Fields include `slug`, `name`, `description`, `priceMinor`, `currency`, `active`, `customerVisible`, `createdAt`, and `updatedAt`. Active customer-visible packages are publicly readable if the public site needs them. Admins manage them through trusted backend operations. Each operation snapshots name and price so historical orders do not change when catalogue pricing changes.

### `operations/{operationId}`

Purpose: authoritative business entity and internal query surface. Holds ownership, internal lifecycle, recipient/request data needed by trusted operations, package snapshot, safe summary values, and timestamps. Customers do not read it directly. Admin access requires claims; ambassador reads should preferably use a narrower assignment projection rather than this document.

### `operationInternal/{operationId}`

Purpose: one-to-one sensitive operational record. Holds moderation detail, risk flags, internal notes, delivery execution detail, provider/error references, and staff-only exception context. Separate top-level storage is easier to secure and batch-query than a deeply nested singleton subcollection. Admin/backend only. Ambassadors should not read it wholesale.

### `operations/{operationId}/activity/{activityId}`

Purpose: append-only authoritative audit history. Admin/backend reads; backend-only creates. Customers never read this raw collection. Existing events should not be updated or deleted from client applications.

### `customerOperations/{operationId}`

Purpose: sanitized customer projection. Contains `customerId` for rules and queries plus only fields intentionally shown in customer UI. Owner and admin read; backend only writes. It is derived from authoritative data.

### `ambassadors/{ambassadorId}`

Purpose: operational workforce record. Fields include nullable `userId`, `displayName`, `phone`, `status`, `availability`, `campus`, `serviceAreas`, `createdAt`, and `updatedAt`. Admin/backend writes. Ambassadors may read a safe view of their own record; phone and other sensitive fields should not be placed in customer projections.

### `ambassadorAssignments/{assignmentId}`

Purpose: optional future delivery-facing projection keyed by assignment, containing only the recipient/delivery subset an assigned ambassador requires. It simplifies assignment security and avoids granting ambassadors the full operation. Backend writes; assigned ambassador and admin read. Introduce with ambassador authentication, not in the first Firestore read migration.

### `payments/{paymentId}`

Purpose: payment attempt and provider boundary. Stores `operationId`, `customerId`, amount, currency, provider, provider reference, status, timestamps, idempotency key/hash, and safe failure classification. Backend/webhook only writes. Admins receive limited operational reads; customers do not read provider records and instead see the safe payment summary in `customerOperations`.

## 7. Operation Data Classification

`PUBLIC` means safe without authentication. `CUSTOMER_READABLE` means only the owning customer and authorized staff. `INTERNAL_ONLY` means operational staff/backend. `SENSITIVE_INTERNAL` requires the narrowest access and should never enter customer projections.

| Field | Classification | Recommended location / note |
|---|---|---|
| package catalogue name/description | PUBLIC | `packages`, only when active and customer-visible |
| operationId / publicReference | CUSTOMER_READABLE | Customer projection; use a non-sequential opaque ID/reference |
| customerId | INTERNAL_ONLY / rule-critical | Authoritative and projection ownership key; not rendered |
| createdAt / updatedAt | CUSTOMER_READABLE | Projection and authoritative document |
| internalStatus | INTERNAL_ONLY | `operations`; do not expose raw internal vocabulary by default |
| customerStatus / statusLabelKey | CUSTOMER_READABLE | Projection; backend-derived from internal status |
| customer name/email/phone | CUSTOMER_READABLE | `users`; snapshots only when business/audit need is clear |
| recipient name | CUSTOMER_READABLE | Projection for owning sender; authoritative operation |
| recipient phone | CUSTOMER_READABLE with minimization | Projection only if sender UI requires it; authoritative operation |
| campus/residence/building | CUSTOMER_READABLE | Projection if submitted by owner; authoritative operation |
| precise delivery location/instructions | CUSTOMER_READABLE with minimization | Projection only while needed; authoritative operation |
| anonymous message | CUSTOMER_READABLE | Owning sender and admins; omit from ambassador/customer event surfaces unless required |
| packageId/name/price snapshot | CUSTOMER_READABLE | Authoritative operation and projection |
| payment amount/currency/status | CUSTOMER_READABLE | Safe summary in projection |
| payment provider/reference/raw response | SENSITIVE_INTERNAL | `payments`; never projection |
| requested date/window | CUSTOMER_READABLE | Authoritative operation and projection |
| assignedAmbassadorId | INTERNAL_ONLY | Authoritative/internal delivery data; assignment projection where needed |
| ambassador display name | CUSTOMER_READABLE only if product decides | Prefer generic delivery language initially |
| ambassador phone | SENSITIVE_INTERNAL | `ambassadors`; never customer projection |
| scheduled/delivered timestamps | CUSTOMER_READABLE | Projection |
| retry count/failure reason/internal route notes | INTERNAL_ONLY | `operationInternal.delivery` |
| moderation outcome detail/reason note | INTERNAL_ONLY | `operationInternal.moderation` |
| customer-safe rejection/cancellation message | CUSTOMER_READABLE | Projection, sanitized reason code/message only |
| staff notes/admin actor ID | SENSITIVE_INTERNAL | Internal record/activity |
| risk/safety flags | SENSITIVE_INTERNAL | `operationInternal.risk` |
| raw system/provider errors | SENSITIVE_INTERNAL | Internal record/logging system, with retention limit |
| activity actor role/from/to/note | INTERNAL_ONLY | Raw activity subcollection |
| customer timeline event/title/time | CUSTOMER_READABLE | Projection summary or safe event collection |

No operation-related document is truly public. Ownership keys are readable by rules but should not be displayed.

## 8. Customer-Safe Projection Strategy

### Options considered

| Option | Security | Query simplicity | Duplication/consistency | Frontend impact |
|---|---|---|---|---|
| A. Customer reads `operations` with sensitive subdocuments | Safe only if every future core field remains customer-safe | Simple ownership query | Least duplication; highest accidental-exposure risk | Couples customer UI to internal model |
| B. Top-level `customerOperations/{operationId}` | Strong allowlist boundary | Simple `customerId + createdAt` query | Small deliberate duplication; backend must maintain projection | Best match for current customer repository |
| C. `users/{uid}/operations/{operationId}` | Strong ownership path | Very simple per-user query | Same consistency cost; collection-group/admin operations become less direct | Tightly nests business data under identity |

Choose Option B within the hybrid architecture. It provides a top-level customer-safe contract, supports owner queries and admin support reads, and maps naturally to the existing customer-safe repository. The authoritative operation remains independent of user document hierarchy. Projection writes must be backend-only and performed in the same transaction/batch as authoritative state changes whenever possible.

The customer projection should store a stable `customerStatus` enum/key, not merely a rendered English label. Backend domain mapping produces this value from internal status, and the customer application maps the safe enum to localized presentation. This prevents the customer from seeing transient/internal states and keeps clients consistent.

For initial tracking, embed a bounded array of recent safe timeline items only if it has a firm maximum. Prefer `customerOperations/{id}/events/{eventId}` once an unbounded timeline is required. Customers must never read raw admin activity.

## 9. Core and Internal Operation Shapes

Avoid an enormous flat document, but do not over-normalize one-operation data. Recommended authoritative shape:

```ts
interface OperationDocument {
  publicReference: string;
  customerId: string;
  internalStatus: InternalOperationStatus;
  recipient: {
    name: string;
    phone: string;
    campus: string;
    residence?: string;
    deliveryLocation: string;
    deliveryInstructions?: string;
  };
  packageSnapshot: {
    packageId: string;
    name: string;
    priceMinor: number;
    currency: 'ZAR';
  };
  request: { anonymousMessage: string; requestedDate: Timestamp; requestedWindow: string };
  deliverySummary: { scheduledDate?: Timestamp; scheduledWindow?: string; assignedAmbassadorId?: string; deliveredAt?: Timestamp };
  paymentSummary: { status: PaymentStatus; amountMinor: number; currency: 'ZAR' };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}
```

`operationInternal/{operationId}` should group concerns:

```ts
interface OperationInternalDocument {
  moderation: { status: ModerationStatus; reviewedBy?: string; reviewedAt?: Timestamp; reasonCode?: string; reasonNote?: string };
  delivery: { assignedAt?: Timestamp; startedAt?: Timestamp; completedAt?: Timestamp; failureReasonCode?: string; internalNotes?: string; retryCount: number };
  risk: { flags: string[]; reviewed: boolean; notes?: string };
  staffNotes?: string;
  updatedAt: Timestamp;
}
```

Document size should be monitored; large notes or evidence would later move to dedicated records/storage with explicit access controls.

## 10. Moderation Architecture

Store the authoritative moderation record under `operationInternal.moderation`. The authoritative operation stores only `internalStatus`, which is necessary for efficient admin queues. Approval/rejection is a backend workflow command that validates the current state, changes `internalStatus`, writes moderation actor/time/reason, appends an activity entry, and updates the customer projection atomically.

Customers receive only a safe resulting status/message, such as `CONFIRMED`, `REQUIRES_ATTENTION`, or `CANCELLED`. They do not receive reviewer identity, raw reason notes, flags, or internal codes unless a specific code has been approved for customer communication.

## 11. Delivery Architecture

Keep requested delivery date/window and safe delivered timestamp in the authoritative summary and customer projection. Store assignment timestamps, execution timestamps, retries, failure reasons, and internal notes in `operationInternal.delivery`. The assigned ambassador ID may remain on the authoritative operation to support admin queries, but never expose their phone through an operation document.

When ambassador access is introduced, create an `ambassadorAssignments` projection containing only what is needed to complete delivery: assignment identity, assigned user/ambassador ID, safe recipient contact, delivery destination/instructions, package handling summary, status, and timing. It must omit customer account details, anonymous message unless operationally essential, moderation, payment, and staff notes.

## 12. Activity and Audit Architecture

Use `operations/{operationId}/activity/{activityId}` as append-only internal audit history:

```ts
interface OperationActivityDocument {
  type: string;
  timestamp: Timestamp;
  actorId: string;
  actorRole: 'ADMIN' | 'AMBASSADOR' | 'SYSTEM';
  fromStatus?: InternalOperationStatus;
  toStatus?: InternalOperationStatus;
  reasonCode?: string;
  note?: string;
  correlationId: string;
}
```

Only trusted backend code writes events. Admins read them; ambassadors do not read the raw stream. Customers receive safe derived events only when tracking needs more than the projection's current status. Backend-generated IDs or correlation IDs support idempotency and incident tracing. Firestore is not a tamper-proof compliance ledger; export/retention requirements can be evaluated later.

## 13. Payment Boundary

Use `payments/{paymentId}` rather than storing provider data on the operation. One operation may have multiple attempts, refunds, or webhook events. `operations.paymentSummary` supports workflow decisions and admin queues; `customerOperations.paymentSummary` exposes only amount, currency, safe status, and paid/refunded timestamps.

Payment creation and updates are backend-only. Webhooks validate provider signatures, deduplicate using provider event IDs/idempotency keys, update the payment record and operation summary, perform the allowed lifecycle transition, append activity, and update the customer projection atomically. Raw provider payloads should be minimized or moved to short-retention secure logs rather than Firestore.

## 14. Write Authority Matrix

| Entity/action | Customer | Admin client | Ambassador client | Trusted backend |
|---|---|---|---|---|
| Own profile safe fields | Limited allowlist | Support request, preferably backend | Limited own fields | Full validated control |
| User role/status | No | No direct write | No | Yes |
| Read public packages | Yes | Yes | If needed | Yes |
| Manage packages/prices | No | Backend command | No | Yes |
| Create operation | Call backend | Call backend if assisted | No | Yes, validates/snapshots |
| Read authoritative operation | No | Yes with admin claim | No/full record denied | Yes |
| Read customer projection | Own only | Yes | No | Yes |
| Change workflow status | No | Call backend command | Limited future commands | Yes |
| Moderate/assign/cancel | No | Call backend command | No | Yes |
| Update delivery execution | No | Call backend command | Limited assigned command later | Yes |
| Write internal details/activity | No | No direct write | No | Yes |
| Read ambassador private data | No | Admin only | Own safe record | Yes |
| Write payment/provider metadata | No | No | No | Yes/webhook |
| Write customer projection | No | No | No | Yes |

## 15. Security Rule Strategy

Rules are defense in depth and enforce document boundaries; trusted backend code performs business validation.

- `users`: authenticated owner can read and update only an explicit safe field allowlist; admins can read; role/status writes denied to clients.
- `packages`: public reads only where `active && customerVisible`; all client writes denied or admin commands routed through backend.
- `operations`: customers denied. Admin reads require `request.auth.token.admin == true`. Direct client writes should be denied once backend commands exist.
- `operationInternal`: admin reads by trusted claim; all client writes denied.
- `activity`: admin reads; all client writes denied.
- `customerOperations`: read only when authenticated and `resource.data.customerId == request.auth.uid`, or admin claim. All client writes denied. List rules must match query constraints.
- `ambassadors`: admin reads; authenticated ambassador may read only the safe record linked to their UID. Client writes tightly limited or denied.
- `ambassadorAssignments`: assigned ambassador reads only when both claim and assignment UID match; admins read; writes denied.
- `payments`: no customer reads of provider records; restricted admin reads; all client writes denied.

Claims establish privileged roles. Ownership and assignment fields establish record scope. Backend validates transitions, package price, payload shape, side effects, and projection content. App Check should be enabled for supported clients/functions as abuse reduction, but it does not replace Auth or rules.

## 16. Backend and Workflow Responsibilities

Choose callable Cloud Functions or an equivalent trusted API for sensitive workflow writes. Direct Firestore writes cannot safely express the complete transition graph, coordinated multi-document audit/projection changes, notifications, idempotency, and payment side effects. Rules can compare old/new fields but should not become a duplicated workflow engine.

The current TypeScript workflow rules should move later into a platform-neutral shared domain package usable by backend functions and frontend display logic. The backend remains authoritative; frontend use only determines available buttons and provides immediate validation feedback.

Backend commands should include at least `createOperation`, `transitionOperation`, `assignAmbassador`, and payment webhook handlers. Each command authenticates the caller, checks claims/ownership/assignment, validates the previous state and request, runs a transaction, emits audit history, maintains projections, and returns a sanitized result.

## 17. Transaction and Atomicity Requirements

Use Firestore transactions when validity depends on the current document; use atomic batches only when no read-before-write is needed.

- Status transition: read current operation/version; validate transition; update status/version/timestamps; update internal record when relevant; create activity; update customer projection.
- Ambassador assignment: verify operation state and ambassador active/available; update operation/internal delivery; create assignment projection; append activity; update customer status.
- Payment confirmation/refund: deduplicate event; update payment; update operation payment summary and lifecycle; append activity; update projection.
- Operation creation: validate active package and authoritative price; create operation/internal/projection/payment intent metadata consistently.
- Cancellation/retry: update internal reason/retry fields, status, audit, assignment projection, and customer projection together.

Use server timestamps, idempotency keys, a monotonically increasing `version`, and correlation IDs. Firestore transaction limits and external calls mean payment provider calls/notifications occur outside transactions with durable idempotent follow-up state.

## 18. Query and Index Strategy

Likely single-field indexes cover simple filters; composite indexes should be created only for actual queries. Expected composites:

| Consumer | Query | Likely composite index |
|---|---|---|
| Admin | queue by status newest first | `operations: internalStatus ASC, createdAt DESC` |
| Admin | campus queue by status/date | `operations: recipient.campus ASC, internalStatus ASC, createdAt DESC` |
| Admin | requested delivery schedule | `operations: deliverySummary.scheduledDate ASC, internalStatus ASC` |
| Admin | package history | `operations: packageSnapshot.packageId ASC, createdAt DESC` |
| Customer | own operations newest first | `customerOperations: customerId ASC, createdAt DESC` |
| Customer | own operations filtered by safe status | `customerOperations: customerId ASC, customerStatus ASC, createdAt DESC` |
| Ambassador | assigned active work by date | `ambassadorAssignments: ambassadorId ASC, status ASC, scheduledDate ASC` |
| Payments/admin | payments for operation/date | `payments: operationId ASC, createdAt DESC` |

Search by arbitrary names/phone/reference is not a Firestore substring use case. Use exact normalized lookup fields sparingly or add a dedicated search service later. Disable unnecessary indexes on large free-text/internal note fields to reduce cost and exposure.

## 19. Firebase Client and Environment Strategy

Proposed future package:

```text
packages/firebase/
  src/client.ts
  src/auth.ts
  src/firestore.ts
  src/emulators.ts
```

It should initialize one Firebase app per browser bundle and export configured primitives, not business repositories. Admin/customer-specific services remain inside their applications. Backend functions live in a separate deployable workspace such as `apps/functions` and must not import browser SDK code.

Use separate Firebase projects for development, staging, and production, with separate Auth users, Firestore data, Hosting sites, functions, service accounts, and budgets. Each app receives environment-specific public web configuration via validated Vite variables (for example API key, auth domain, project ID, app ID). Firebase web config identifies a project but is not a secret; security comes from Auth, rules, App Check, and backend validation.

Service-account credentials, webhook secrets, admin SDK configuration, and provider secrets belong only in server-managed secret storage. They must never use `VITE_` variables or enter frontend bundles. Emulator configuration is enabled only by an explicit development flag and must visibly identify emulator mode.

## 20. Repository Migration Strategy

Keep component-facing contracts stable and add implementations:

- Admin `operationsRepository`: retain list/get/subscribe/transition concepts. Firebase reads can expose query subscriptions; sensitive transition methods call backend commands instead of writing Firestore. Avoid promising synchronous return values in the final interface—introduce `loading`, `error`, async command results, and unsubscribe semantics deliberately.
- Customer `customerOperationsRepository`: query `customerOperations` by authenticated UID and map Firestore documents into existing customer-safe domain models.
- Auth services: replace mock login/logout/session checks with Firebase Auth methods and an observable `AuthSession` containing loading, user, and claims.
- Ambassador repository: replace admin mock list with restricted reads; assignment uses backend command.
- Storage adapters: session mock persistence remains development-only and is removed from production composition.

Use explicit layers:

```text
React page/hook
  -> app repository interface (domain-safe types)
  -> mock adapter OR Firebase/backend adapter
  -> Firestore document mapper / callable function client
```

Do not leak Firestore `Timestamp`, `DocumentSnapshot`, collection paths, or raw errors into page components. Mapper tests should verify customer documents cannot produce internal fields.

## 21. Mock Authentication Migration

1. Add shared Firebase client initialization and environment validation.
2. Define an auth-service interface and observable session state.
3. Implement customer login, signup, email verification, logout, and password-reset flows.
4. Implement private admin login without signup; load/refresh trusted claims before entering guarded routes.
5. Update route guards to display an initializing state and enforce claims, not just authentication.
6. Add trusted admin-provisioning tooling outside public clients.
7. Remove mock credentials, mock session keys, fallback in-memory authentication, and development credential UI.
8. Add ambassador invitation/auth only when its operational application is scheduled.

## 22. Safe Operation Creation

Operation creation should use a trusted backend function. A browser can submit a typed request, but cannot choose price, payment state, moderation state, ownership UID, timestamps, or initial internal status. The backend:

1. Requires a verified authenticated customer where checkout policy requires it.
2. Validates and limits recipient/message fields.
3. Loads an active package and snapshots its authoritative name, price, and currency.
4. Sets `customerId` from Auth, never request input.
5. Creates an opaque reference and initial `NEW`/`PAYMENT_PENDING` lifecycle state.
6. Creates internal and customer-safe records atomically.
7. Initiates payment through a server integration when introduced.

Recipients should remain embedded in the operation. They are delivery targets, not Auth users. A normalized recipients collection would create unnecessary linkage and retention risk without a current reuse requirement.

## 23. Privacy and Data Minimization

For the South African operating context, apply data-minimization and retention principles without treating this document as legal advice:

- Collect only recipient contact/location details needed for the specific delivery.
- Limit ambassador access temporally to assigned active work and revoke it when complete/cancelled.
- Avoid exposing ambassador personal phone numbers; use platform-mediated contact later if needed.
- Keep anonymous messages out of logs, payment records, analytics, and notifications unless essential.
- Define retention windows for completed/cancelled operations, recipient phones/locations, provider payloads, and raw errors; redact or delete when operational needs expire.
- Separate production from non-production and prohibit copying real personal data into development.
- Use least-privilege service accounts, audit privileged access, and maintain documented deletion/export procedures.
- Store timestamps and reason codes rather than duplicating free-text personal information across documents.

## 24. Proposed Firestore Tree

```text
users/
  {uid}

packages/
  {packageId}

operations/
  {operationId}
  {operationId}/activity/
    {activityId}

operationInternal/
  {operationId}

customerOperations/
  {operationId}
  {operationId}/events/          # introduce only for an unbounded safe timeline
    {eventId}

ambassadors/
  {ambassadorId}

ambassadorAssignments/          # deferred until ambassador application/auth
  {assignmentId}

payments/
  {paymentId}
```

Top-level collections support admin queries and direct one-to-one IDs. Only `packages` contains intentionally public documents. Customer projections are owner-readable. Authoritative operations, internal records, and raw activity are admin/backend surfaces. Payments and all projection writes are backend-owned.

## 25. Proposed Type Shapes

Types should distinguish domain concepts, Firestore persistence, and read projections:

```ts
interface UserProfile { id: string; email: string; firstName: string; lastName: string; phone?: string; status: 'ACTIVE' | 'DISABLED'; roleDisplay: 'CUSTOMER' | 'ADMIN' | 'AMBASSADOR'; }
interface Operation { id: string; customerId: string; internalStatus: InternalOperationStatus; recipient: RecipientSnapshot; packageSnapshot: PackageSnapshot; request: OperationRequest; deliverySummary: DeliverySummary; paymentSummary: PaymentSummary; createdAt: Date; updatedAt: Date; version: number; }
interface OperationInternal { operationId: string; moderation: ModerationRecord; delivery: InternalDeliveryRecord; risk: RiskRecord; staffNotes?: string; }
interface CustomerOperation { id: string; publicReference: string; customerId: string; customerStatus: CustomerOperationStatus; recipient: CustomerRecipientView; package: PackageSnapshot; delivery: CustomerDeliveryView; payment: CustomerPaymentView; createdAt: Date; updatedAt: Date; }
interface OperationActivity { id: string; type: string; actorId: string; actorRole: ActorRole; fromStatus?: InternalOperationStatus; toStatus?: InternalOperationStatus; reasonCode?: string; note?: string; timestamp: Date; correlationId: string; }
interface Ambassador { id: string; userId?: string; displayName: string; phone: string; status: 'ACTIVE' | 'INACTIVE'; availability: string; campus: string; serviceAreas: string[]; }
interface Package { id: string; slug: string; name: string; description: string; priceMinor: number; currency: 'ZAR'; active: boolean; customerVisible: boolean; }
interface Payment { id: string; operationId: string; customerId: string; status: PaymentStatus; amountMinor: number; currency: 'ZAR'; provider: string; providerReference?: string; paidAt?: Date; refundedAt?: Date; }
```

Firestore shapes use `Timestamp` and persistence-specific field names. Mappers convert them to domain types using `Date`. Customer projections are separate types assembled from an allowlist; they must never be created by omitting fields from an internal object at runtime.

## 26. Implementation Milestones

### Firebase Milestone 2 — Foundation and Auth

- Create environment/project strategy and shared client package.
- Add Firebase Auth adapters, auth-state observers, customer signup/login, private admin login, claim-based route guards, and emulator wiring.
- Add trusted admin provisioning procedure.
- Remove mock credentials after acceptance.

### Firebase Milestone 3 — Schema Foundation and Read Repositories

- Define versioned Firestore converters/types for users, packages, operations, internal records, and customer projections.
- Draft/test rules and required indexes in emulators.
- Seed non-production packages and controlled test users.
- Implement user/package repositories and read-only admin/customer operation adapters behind existing interfaces.

### Firebase Milestone 4 — Trusted Operation Creation

- Implement backend `createOperation`, validation, package snapshotting, authoritative/internal/projection creation, audit event, and idempotency.
- Connect authenticated public/customer checkout without payments.

### Firebase Milestone 5 — Secure Workflow Commands

- Move/share workflow validation with backend runtime.
- Implement moderation, preparation, assignment, delivery, cancellation, retry, and completion commands with atomic audit/projection updates.
- Replace admin mock writes while retaining frontend guards for usability.

### Firebase Milestone 6 — Customer Tracking Projections

- Complete safe status mapping and projection maintenance.
- Add safe customer events only if current-status tracking is insufficient.
- Validate privacy with emulator rule tests and projection contract tests.

### Firebase Milestone 7 — Ambassador Access

- Add invitation/auth, claims, ambassador assignment projection, limited delivery commands, and assignment-scoped rules.

### Firebase Milestone 8 — Payments

- Add provider integration, secret management, webhook verification, payment records, idempotent lifecycle updates, refunds, and customer-safe summaries.

Production migration should use scripted, repeatable, validated test-data transforms. Current mock records are fixtures, not production records, and should not be imported automatically. Each rollout should support adapter-level feature flags and rollback without allowing two writers for the same authoritative data.

## 27. Risks, Open Questions, and Deferred Decisions

- Choose Firebase regions based on supported products, latency, residency expectations, and the final privacy assessment before creating production resources.
- Decide whether customers should ever see ambassador display names; default is no.
- Define approved customer-safe rejection/cancellation/failure reason codes and wording.
- Define recipient/message/location retention windows and deletion/anonymization behavior.
- Decide whether email verification is mandatory before operation creation or only before payment.
- Select admin MFA/identity-provider requirements before production.
- Confirm whether public catalogue reads need authentication or can remain public.
- Define operational search requirements; Firestore is not full-text search.
- Define customer timeline depth before choosing embedded recent events versus a safe events subcollection.
- Establish disaster recovery, backups, budget alerts, logging redaction, and incident response before launch.

## 28. Recommended Decisions

- **Auth provider:** Firebase Authentication; email/password for customers initially, privately provisioned admin accounts, ambassadors deferred until their app exists.
- **Role strategy:** Trusted custom claims for privileged authorization plus `users` profile role mirror for presentation. Never trust a Firestore role field alone.
- **Admin authorization:** `admin: true` claim enforced by rules and every backend command; React route guards are secondary UX controls.
- **Operation storage:** Authoritative `operations` document with grouped core fields, separate one-to-one `operationInternal` sensitive document, and append-only activity subcollection.
- **Customer projection:** Top-level `customerOperations` allowlist projection owned by `customerId`, maintained only by backend code.
- **Moderation storage:** `operationInternal.moderation`; expose only a sanitized projected outcome.
- **Activity storage:** `operations/{id}/activity`; admin/backend only. Use a separate safe customer event projection only when required.
- **Delivery storage:** Safe delivery summary on authoritative/projection documents; sensitive execution detail in `operationInternal`; future assignment projection for ambassadors.
- **Payment storage:** Dedicated `payments` records plus limited authoritative/customer summaries; webhook/backend writes only.
- **Workflow write authority:** Callable functions/trusted backend validates transitions and performs atomic operation, internal, activity, and projection changes.
- **Operation creation authority:** Trusted backend function validates input and snapshots the authoritative package price; browsers cannot freely create operation documents.
- **Repository architecture:** Stable application repository interfaces with mock and Firebase/backend adapters; no Firebase types or SDK calls in page components.
- **Environment separation:** Independent development, staging, and production Firebase projects; public client config in validated environment variables, privileged credentials only in server secret storage.

