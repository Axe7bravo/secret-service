# Admin Dashboard Completion

## Architecture

The admin application is protected by Firebase Authentication and `AdminAuthGuard`. Authorization is based on the trusted `role: "admin"` ID-token custom claim, never on an email address. The restored `cec8e64` interface remains the presentation layer.

Operational reads go through `adminOperationReadRepository`. `VITE_DATA_SOURCE=firestore` selects Firestore realtime subscriptions; otherwise the existing mock repository is used. Operational writes go through `adminOperationCommands`. `VITE_OPERATION_WRITE_MODE=firebase` selects callable Functions; otherwise the mock command implementation is used.

## Operations

The dashboard and operation ledger derive their metrics and rows from the selected repository. They expose loading, error, empty, and filtered-empty states. Firestore list subscriptions are ordered by creation time and clean up when their hooks unmount.

Operation detail subscribes to the authoritative `operations` record, its `operationInternal` record, and matching `operationActivity` records. Admin-only moderation notes, delivery-failure details, assignment references, and activity remain outside `customerOperations`.

## Workflow commands

The React application never writes authoritative operation status to Firestore. It calls `adminOperationCommands.transitionOperation`, which invokes the trusted `transitionOperation` callable in Firebase mode. The Function:

1. requires authentication and `role === "admin"`;
2. reads persisted authoritative state in a transaction;
3. validates the canonical transition and required metadata;
4. updates only the authoritative operation fields affected by the transition;
5. updates internal moderation or delivery metadata;
6. appends an admin-only activity record;
7. rebuilds the customer-safe projection in the same transaction.

The interface disables workflow controls during submission and displays safe command errors.

## Lifecycle behavior

- Moderation: a paid operation can be sent to `REVIEW_REQUIRED`, then approved or rejected. Rejection requires a reason.
- Preparation: `APPROVED → PREPARING → READY_FOR_DELIVERY` uses canonical domain actions.
- Assignment: an available ambassador reference is required for `AMBASSADOR_ASSIGNED`. The MVP source is mock-backed behind `ambassadorRepository`; no contact details are projected to customers.
- Delivery: assignment, dispatch, delivery, and completion remain explicit validated actions.
- Failure and retry: delivery failure requires a reason. Retry requires confirmation that delivery details were reviewed, clears the active assignment, increments retry count, and retains the prior reason in activity history.
- Cancellation: only domain-approved non-terminal states expose cancellation, and a reason is mandatory.
- Terminal states expose no invalid follow-up actions.

## Activity and customer projection

Workflow activity records contain the transition, actor, timestamp, and relevant admin-only reason/assignment/retry context. Firestore rules limit activity reads to admins.

The trusted transition transaction rebuilds `customerOperations` with the existing safe mapping. Raw moderation notes, failure details, staff notes, safety flags, phone numbers, and ambassador details are not copied to the customer projection.

## Packages

`/packages` provides catalogue loading, error, empty, no-active, success, list, create, and edit states. Package documents contain:

- `packageId` and immutable stable `code`;
- name, short description, and optional longer description;
- integer `priceMinor` and `currency: "ZAR"`;
- active state and display order;
- server timestamps for creation and update.

Package writes use the `savePackage` callable. It requires the trusted admin claim, validates all input server-side, prevents stable-code mutation, assigns server timestamps, and never destructively deletes catalogue records. Deactivation uses `active: false`; inactive records remain visible to admins and historically referenceable.

Customer operation creation reads the selected active package inside the same transaction that creates the operation. The operation stores an immutable package ID/name/price/currency snapshot, so later catalogue edits do not change historical operation values. Inactive packages are rejected by the creation command.

Mock mode includes example catalogue records but does not constrain future package additions. Firebase mode requires package records to exist in Firestore; no production seeding utility is included.

## Dates

Current admin scheduling dates are read-only operational values, so they remain formatted display fields. No editable admin calendar field currently exists. When rescheduling is introduced, date-only values should use a native `input[type=date]` and remain `YYYY-MM-DD` strings without UTC conversion. Server validation remains authoritative.

## Firestore security

The browser has no direct writes to operations, internal records, activity, projections, or packages. Admin reads require the trusted claim. Signed-in customers may read only active package catalogue records and their own customer projections. Inactive packages remain admin-readable.

## Current limitations

- Ambassador availability remains mock-backed; a full Ambassador Dashboard is intentionally deferred.
- Package catalogue records must be created through the admin UI before Firebase customer creation can use them.
- The current customer package chooser remains part of the deferred Customer Dashboard milestone; newly added catalogue items are supported by the backend but are not automatically surfaced by that existing UI yet.
- Payment capture, refund integration, and payment-state automation are intentionally deferred.
- No admin rescheduling command exists, so scheduling dates are currently read-only.
- Read and write modes are independently configurable and should both be set to Firebase for production-like verification.

## Deferred work

Payments, notifications, customer dashboard completion, full ambassador management, recipient messaging, QR response flows, promotions, analytics, production seeding, and deployment are outside this milestone.

## Manual verification

From the repository root, run:

```text
npm run typecheck
npm run lint
npm run build
```

Then manually verify mock mode and Firebase mode, including authorization denial, realtime refresh after a callable transition, required workflow reasons, package creation/edit/deactivation/reactivation, historical operation snapshots, mobile table reflow, and loading/error/empty states.
