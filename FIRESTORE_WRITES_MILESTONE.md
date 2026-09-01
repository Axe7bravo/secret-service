# Trusted Firestore Writes Milestone

## Trusted backend structure

`apps/functions` is a separate server workspace. It imports Firebase Admin SDK and Firebase Functions only; no browser Firebase package, Vite environment, React type, or client credential crosses this boundary.

```text
apps/functions/src/
  firebaseAdmin.ts
  auth/requireAdmin.ts
  domain/operationTypes.ts
  domain/operationWorkflow.ts
  projection/customerOperationProjection.ts
  commands/commandErrors.ts
  commands/createOperation.ts
  commands/transitionOperation.ts
  index.ts
```

`firebaseAdmin.ts` initializes one Admin app using the Functions runtime's application-default identity and exposes Admin Auth/Firestore. No service-account material is stored in source.

## Command flow

```text
Admin UI
  -> callable command
  -> verify Firebase Auth
  -> require role === "admin" custom claim
  -> validate input and persisted transition
  -> Firestore transaction
  -> update authoritative operation
  -> update restricted internal record
  -> append internal activity
  -> rebuild customer-safe projection
  -> return sanitized result
```

The browser cannot set actor UID/role. Those values come from `request.auth`. Email, route visibility, client role fields, and request payload roles are never authorization signals.

## Callable commands

### `createOperation`

This admin-only callable validates customer ID, supported package slug, server-authoritative input shape, positive integer minor-unit price, recipient/delivery fields, and anonymous message. It generates an opaque Firestore document ID and always chooses `PAYMENT_PENDING` as initial lifecycle state. The caller cannot choose status, actor, timestamps, payment outcome, moderation outcome, or internal flags.

One transaction creates:

- `operations/{operationId}` authoritative record
- `operationInternal/{operationId}` restricted initial record
- `operationActivity/{activityId}` initial audit event
- `customerOperations/{operationId}` explicit safe projection

The public checkout/payment-authoritative creation path remains deferred; this callable is an internal admin command foundation.

### `transitionOperation`

This admin-only callable reads the current authoritative and internal records inside the transaction, validates an explicit edge, and rejects stale/repeated actions. Supported edges are:

- `NEW -> PAYMENT_PENDING`
- `NEW -> REVIEW_REQUIRED`
- `REVIEW_REQUIRED -> APPROVED | REJECTED | CANCELLED`
- `APPROVED -> PAYMENT_PENDING | CANCELLED`
- `PAYMENT_PENDING -> PAID | CANCELLED`
- `PAID -> PREPARING | REFUNDED | CANCELLED`
- `REVIEW_REQUIRED -> APPROVED | REJECTED | CANCELLED`
- `PREPARING -> READY_FOR_DELIVERY | CANCELLED`
- `READY_FOR_DELIVERY -> AMBASSADOR_ASSIGNED | CANCELLED`
- `AMBASSADOR_ASSIGNED -> OUT_FOR_DELIVERY | CANCELLED`
- `OUT_FOR_DELIVERY -> DELIVERED | DELIVERY_FAILED`
- `DELIVERED -> COMPLETED`
- `DELIVERY_FAILED -> READY_FOR_DELIVERY | CANCELLED`

Terminal states have no outgoing edges. Rejection, cancellation and delivery failure require a reason. Assignment requires an ambassador ID. Retry requires explicit delivery-detail review confirmation and clears the old assignment.

The server transition table is authoritative. Existing frontend workflow rules remain useful UX previews but cannot override persisted-state validation.

## Atomic writes and stale state

Each transition transaction:

1. Reads the current operation and internal record.
2. Validates the requested edge against the persisted status.
3. Applies status/delivery changes with a trusted timestamp.
4. Stores restricted moderation/failure/cancellation metadata internally.
5. Appends an immutable activity document.
6. Rebuilds and replaces the customer projection.

Concurrent or repeated commands see a different persisted state and fail with `failed-precondition`. Firestore's transaction retry behavior prevents partial authoritative/projection updates.

## Activity model

Activity documents contain operation ID, event type, trusted timestamp, authenticated actor UID, `ADMIN` role, previous/next status, and optional non-sensitive reason code. Raw notes remain in `operationInternal`; customers never read raw activity.

## Customer projection

`buildCustomerOperationProjection` constructs an allowlist from individual fields. It never spreads the authoritative operation into the projection. Customer-visible status is mapped to the safe vocabulary:

- pending, confirmed, preparing, scheduled, in progress, delivered, complete
- requires attention, cancelled, delivery issue, refunded

The projection omits phone numbers, ambassador identity/contact, moderation detail, staff notes, safety flags, internal failure detail, raw activity and provider metadata.

## Admin frontend command adapter

`apps/admin/src/data/adminOperationCommands.ts` exposes typed `createOperation` and `transitionOperation` methods. Firebase mode calls callable functions through the shared lazy Functions client and maps callable error codes to restrained admin messages. No browser `updateDoc`, `setDoc`, batch or transaction exists in this adapter.

`VITE_OPERATION_WRITE_MODE` selects `mock` (default) or `firebase` at the service-composition boundary. Mock transition commands delegate to the existing session workflow repository. Firebase command methods never fall back silently to mock after a backend error.

The existing page implementation was deliberately not rewritten because its current merged shape did not match the prior inferred module structure. The command adapter is the integration boundary; wiring its pending state into a concrete page should be done against the verified current page source, not by inventing imports. Until that final UI wiring is performed, existing mock UI behavior remains unchanged.

## Error model

Callable commands use standard `HttpsError` codes:

- `unauthenticated`
- `permission-denied`
- `not-found`
- `invalid-argument`
- `failed-precondition`
- `already-exists` when introduced by later idempotent commands
- `internal`

Unexpected server errors are collapsed to a generic internal message. The frontend mapper does not expose server stacks or internal metadata.

## Rules

Existing rules already deny browser writes to `operations`, `operationInternal`, `operationActivity`, `customerOperations`, and `payments`. Customers may read only their own projection; trusted admins may perform permitted reads. Admin SDK writes from deployed Functions bypass client rules after callable authorization and domain validation.

No permissive development fallback was added.

## Functions configuration and manual setup

The new workspace declares only Functions/Admin SDK and TypeScript dependencies. It extends the verified repository-root `tsconfig.base.json` with NodeNext server output into `apps/functions/lib`. Root npm workspaces discover `apps/functions` through the existing `apps/*` convention.

Before deployment in a later operational task, configure the Firebase project Functions runtime, ensure Firestore exists, provision admins with `role: "admin"`, and point Firebase deployment configuration at `apps/functions`. Do not put service-account keys in frontend or repository environment files.

## Deferred

- Payment provider/webhooks and server-authoritative package pricing catalogue lookup
- Public customer checkout and operation creation
- Automated refunds
- Notifications, email and SMS
- Ambassador Auth/dashboard and assignment acceptance
- Idempotency keys for externally retried creation requests
- Scheduled jobs, analytics, migrations, seed scripts and production deployment
- Final verified React pending/error/re-read wiring against the current admin page source

Future payment handlers should reuse the same transaction pattern to update payment record, operation payment summary/status, audit event and customer projection atomically after webhook signature and idempotency validation.
