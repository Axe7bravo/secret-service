# Firestore Schema and Read Repositories Milestone

## Scope

This milestone adds typed Firestore client/read architecture without creating data or enabling browser writes. Authentication is Firebase-backed; admin workflow and customer records remain mock by default. Operation creation, transitions, moderation, assignment, payments, projection maintenance, Cloud Functions, migrations, and deployment are deferred.

## Conceptual flow

```text
Trusted backend (future)
  -> operations (authoritative operational state)
  -> operationInternal (restricted sensitive detail)
  -> customerOperations (strict customer-safe projection)
  -> operationActivity (append-only internal audit)

Admin with trusted claim
  -> reads operations
  -> reads operationInternal for detail

Authenticated customer
  -> reads customerOperations where customerId == request.auth.uid
  -> never reads operations or operationInternal
```

## Shared Firebase client

`getFirebaseFirestore()` reuses `getFirebaseApp()` and lazily creates one Firestore client. It does not initialize another Firebase app. Collection names and persistence document shapes are exported from `packages/firebase/src/firestore`.

The shared package distinguishes Firestore shapes from application domain models. React components do not receive `Timestamp`, snapshots, or Firestore errors directly.

## Collections

### `operations/{operationId}`

Authoritative admin business record. Key fields:

- `operationId`, `customerId`, internal lifecycle `status`
- package ID/name/price/currency snapshot
- recipient name, phone, campus, residence and requested location/instructions
- requested/scheduled delivery summary and assigned ambassador ID
- anonymous message
- safe operational payment summary
- `createdAt`, `updatedAt`

This document is not customer-readable. Package price is stored in minor units and snapshotted so later catalogue changes do not rewrite historical operations.

### `operationInternal/{operationId}`

One-to-one restricted detail containing only current workflow needs:

- moderation status, reviewer/time, reason code/note
- delivery failure code/details, retry count and internal notes
- ambassador contact detail when operationally required
- staff notes and safety flags
- `updatedAt`

It is separated because Firestore rules cannot hide fields within a readable document.

### `customerOperations/{operationId}`

Strict allowlist projection for the current customer portal:

- `operationId`, rule-critical `customerId`
- package name/amount/currency
- customer-safe projection status
- recipient name/campus/residence summary
- requested delivery date/window/location and optional delivered timestamp
- anonymous message submitted by the customer
- customer-safe payment summary
- safe tracking status/update timestamp
- `createdAt`, `updatedAt`

It deliberately contains no raw `REVIEW_REQUIRED`, moderation notes, staff notes, ambassador phone, internal failure details, safety flags, provider metadata, or admin actors.

### `operationActivity/{activityId}`

Typed internal audit shape with operation ID, event type/time, actor ID/role, optional transition, reason code and note. Customers are denied raw activity reads. A separate safe customer event projection may be introduced later if the current tracking projection is insufficient.

### `payments/{paymentId}`

Collection name is reserved and rules deny client writes. Payment document persistence and webhooks are not implemented in this milestone.

## Status boundary

Authoritative documents use the existing full internal lifecycle. Customer projection documents use only:

`PAYMENT_PENDING`, `CONFIRMED`, `PREPARING`, `DELIVERY_SCHEDULED`, `IN_PROGRESS`, `DELIVERED`, `COMPLETE`, `REQUIRES_ATTENTION`, `CANCELLED`, `DELIVERY_ISSUE`, `REFUNDED`.

The customer mapper converts these safe values into the existing presentation adapter. Firestore never needs to send raw `REVIEW_REQUIRED` to the customer application.

## Mapping and defensive parsing

Admin and customer mappers sit under each app's `data/firestore` directory. They validate required object/scalar boundaries, convert Firestore timestamps to ISO strings used by the existing UI, and map persistence shapes into application domain models. Invalid documents reject with a controlled repository error rather than leaking partial records into components.

The admin detail repository may join `operations/{id}` with `operationInternal/{id}`. Admin list reads do not fetch internal documents. Customer mapping accepts only `CustomerOperationDocument`; it has no mapper or import for authoritative operation documents.

## Read repositories

### Admin

`firestoreAdminOperationsRepository` lists authoritative operations ordered by `createdAt desc` and retrieves detail by ID with the internal record. It implements no mutation method. Trusted admin claims remain enforced by the route guard and Firestore rules.

The existing `adminOperationsRepository` remains the session-persisted mutable mock workflow. `adminReadRepository.ts` supplies an async read interface and selects the mock or Firestore read adapter at the data boundary.

### Customer

`createFirestoreCustomerOperationsRepository(authenticatedUid)` requires a non-empty authenticated UID and always constructs the query itself:

```text
customerOperations
where customerId == authenticatedUid
order by createdAt desc
```

UI input cannot provide another customer ID. Detail lookup is constrained to the already owner-filtered result. The factory contains no reference to `operations` or `operationInternal`.

## Data mode

`VITE_DATA_SOURCE` supports `mock` (default) or `firestore`. Selection occurs in `adminReadRepository.ts` and `customerReadRepository.ts`, not in React pages. A missing or unknown value resolves to mock so local development does not require a populated Firebase project.

The current screens intentionally continue consuming the established mock repositories. The new async read adapters are ready for an explicit UI-read cutover after test documents and rules are provisioned. This avoids silently disabling the admin workflow: Firestore reads are read-only and no frontend status mutation is introduced.

## Rules

`firestore.rules` is deny-by-default:

- Admin reads of `operations`, `operationInternal`, `operationActivity`, and payment metadata require `admin: true` or `role: "admin"` custom claims.
- Customer projection reads require authentication and matching `resource.data.customerId == request.auth.uid` (admins may support-read).
- Customers cannot read authoritative/internal/activity/payment collections.
- All sensitive client writes are denied. Future trusted Admin SDK/Cloud Functions bypass client rules and must validate business commands.
- All unspecified documents are denied.

These rules are a scaffold and have not been deployed.

## Indexes

The implemented customer query requires one composite index:

- `customerOperations`: `customerId ASC`, `createdAt DESC`

The admin repository only orders by `createdAt`, which uses the standard single-field index. Status/campus/schedule composites are deferred until repositories implement those compound queries.

## Ownership and assumptions

- Firebase Auth UID is the sole customer ownership key; email is never used for authorization.
- Operation document IDs are expected to match `operationId` for detail lookup.
- Prices use integer minor units and `ZAR`.
- Firestore timestamps are server-produced in the future write layer.
- Existing mock customer records are safe projections and existing admin workflow remains the local mutation source.
- Rules and indexes require explicit Firebase configuration/deployment in a later operational step.

## Deferred functionality

- Firestore writes, operation creation and data seeding
- trusted workflow/moderation/assignment/delivery commands
- atomic activity and projection updates
- payment records, webhooks and refunds
- realtime listeners and UI cutover to async Firestore reads
- migration scripts, emulator fixtures and production deployment
- ambassador access and notifications

Future backend commands must write authoritative state, sensitive internal detail, audit activity, and the customer projection atomically where possible. Projection generation must use an explicit allowlist, never object spreading from the authoritative document.

## Typecheck repair

The initial Firestore files referenced the canonical module paths from the completed Auth/Admin/Customer milestones, but an authorized filesystem inventory showed those targets were genuinely absent in the current checkout rather than renamed:

- `packages/firebase/src` contained only `index.ts`, `firestoreClient.ts`, and the `firestore` directory. The pre-existing `config.ts`, `client.ts`, `authService.ts`, and `types.ts` files were gone.
- `apps/admin/src` contained only the foundation `main.tsx` placeholder plus the new Firestore data files. Its operation domain type and mock repository were gone.
- `apps/customer/src` contained only the foundation `main.tsx` placeholder plus the new Firestore data files. Its customer-safe domain type and mock repository were gone.

There were therefore no differently named surviving modules to target and the failing relative paths themselves were not depth/casing errors. The canonical modules required by the public APIs were restored:

| Failing import | Resolved module | Repair |
|---|---|---|
| Firebase `./config` | `packages/firebase/src/config.ts` | Restored validated Vite Firebase web configuration. |
| Firebase `./client` | `packages/firebase/src/client.ts` | Restored single-app initialization and Firebase-managed Auth persistence. |
| Firebase `./authService` | `packages/firebase/src/authService.ts` | Restored signup/login/logout, ID-token observation, claims and safe errors. |
| Firebase `./types` | `packages/firebase/src/types.ts` | Restored application-facing Auth contracts. |
| Admin `../types/operations` and `../../types/operations` | `apps/admin/src/types/operations.ts` | Restored the canonical admin operation domain contract; Firestore DTOs remain separate. |
| Admin `./adminOperationsRepository` | `apps/admin/src/data/adminOperationsRepository.ts` | Restored a mock read source for repository selection. |
| Customer `../types/customer` and `../../types/customer` | `apps/customer/src/types/customer.ts` | Restored the customer-safe application contract; Firestore projection DTO remains separate. |
| Customer `./customerOperationsRepository` | `apps/customer/src/data/customerOperationsRepository.ts` | Restored a customer-safe mock read source. |

The Firestore adapters continue importing application models only at mapper boundaries, and Firestore `Timestamp` stays in shared persistence DTOs. Customer Firestore code still queries only `customerOperations` with an authenticated UID. Admin Firestore remains read-only.

The inventory also revealed that the current `apps/admin/src/main.tsx` and `apps/customer/src/main.tsx` are foundation placeholder entry points and that their prior Firebase providers, guards, routers, dashboards, workflow, and customer portal source are absent. Those broader deletions predate or sit outside the failing Firestore imports and were not disguised as an import-path repair. Restoring the complete applications requires a dedicated source-restoration scope; this milestone repair restores the shared Auth API and canonical domain/read boundaries needed by the new Firestore modules without claiming that placeholder entry points currently exercise them.
