# Admin Moderation Milestone

## Purpose and routes

Moderation is the human safety-control workspace for anonymous messages and physical mystery deliveries. It exposes the existing operation workflow rather than introducing a second lifecycle.

Admin-protected routes are:

- `/moderation` — moderation queue and decision history
- `/moderation/:operationId` — the existing authoritative Operation Detail composed as moderation detail

The Moderation sidebar entry is active. Payments and Settings remain deferred.

## Queue and filters

The default Needs Review view contains only authoritative operations currently in `REVIEW_REQUIRED`. Approved and Rejected views use internal `operationInternal.moderation.status` metadata. Search is bounded to the already-loaded admin operation set and supports operation ID, customer reference/name, recipient, package, campus, and anonymous message text.

Queue rows show operation reference, customer reference, package, recipient, campus, a safely rendered text preview, requested delivery date/window, lifecycle status, moderation decision, and explicit actions. The full message and operational context remain available on detail. Loading, failure with retry, no-action-required, empty history, and no-search-result states use existing Admin patterns.

## Moderation detail

Moderation detail reuses Operation Detail rather than duplicating operation architecture. It presents authoritative package, customer, recipient, campus/location, requested delivery, delivery instructions, full anonymous message, status, internal moderation state/rejection note, and operation activity. The `/moderation/:operationId` route returns to the moderation queue while the standard Operations route continues returning to the ledger.

## Approve and reject flow

Both decisions reuse `adminOperationCommands.transitionOperation`, `OperationActionDialog`, and the canonical workflow definitions:

- `REVIEW_REQUIRED → APPROVED`
- `REVIEW_REQUIRED → REJECTED`

Approve requires explicit confirmation. Reject uses the existing required-reason form; no separate policy taxonomy was introduced because the current MVP schema does not justify one. Dialogs focus the safe back action, support Escape, prevent backdrop dismissal while submitting, disable duplicate submission, and display command failures.

The trusted `transitionOperation` callable requires an authenticated strict admin custom claim, rereads persisted operation/internal/projection documents, validates the transition, updates the authoritative operation, stores `reviewedBy`, `reviewedAt`, decision, and internal rejection reason in `operationInternal`, creates `operationActivity`, and rebuilds the customer-safe projection atomically.

## Metadata and audit boundary

Moderation metadata remains in `operationInternal.moderation`:

- `status`
- `reviewedBy`
- `reviewedAt`
- optional internal `reasonCode`
- optional internal `reasonNote`

Activity remains in the existing `operationActivity` collection. No separate moderation log or collection was added. Rejected operations are preserved and remain auditable; no deletion or reopen transition exists.

## Customer-safe projection

Approval and rejection rebuild the established allowlisted `customerOperations` projection. Rejection maps only to the safe Requires Attention presentation. Raw rejection notes, moderator identity, internal policy labels, safety flags, staff notes, and privileged activity are never copied to customer documents.

The projection transaction reads and preserves the customer-owned `archived`/`archivedAt` metadata before replacing system-maintained fields. Moderation decisions cannot erase customer archive preferences.

## Read architecture and modes

Firebase list mode now subscribes to authoritative operations and `operationInternal` as two collection-level snapshots, joining by operation ID in the repository. This avoids N+1 reads and keeps Firebase SDK types outside React. Operation detail retains the existing operation/internal/activity subscriptions with cleanup.

Mock mode uses the same repository, workflow action, command, dialog, and page components. Approve/reject updates moderation status, reviewer/time metadata, required rejection reason, activity history, queue membership, and session-storage persistence through the existing mock repository.

## Authorization and security

- Routes remain behind `AdminAuthGuard`.
- Firebase commands use the existing callable protected by `requireAdmin` and trusted custom claims.
- No email-based or client-supplied role authorization exists.
- The browser does not write operations, operationInternal, operationActivity, or customerOperations.
- Firestore rules were not weakened or changed.
- Message content renders as React text, never injected HTML.
- Canonical transition validation remains the only decision authority.

## Dashboard integration

The existing Awaiting Review metric already counts `REVIEW_REQUIRED`, and Action Required already identifies review cases as classified messages awaiting review. No decorative analytics or dashboard redesign was needed.

## Deferred behavior and limitations

- `REJECTED` remains terminal; customer appeals, edits, and resubmission are unsupported.
- Rejection occurs before payment becomes due, so it does not require refund or reversal behavior. Payments remain deferred.
- No automated AI moderation, external safety API, policy CMS, notifications, email, or SMS was added.
- Approved/rejected history reflects retained operations and internal moderation documents; no pagination was added at current MVP scale.

## Manual verification

Run manually from the repository root:

```text
npm run typecheck
npm run lint
npm run build
```

Then verify admin route protection, queue loading/retry/empty states, search, each filter, full message display, approve confirmation, required rejection reason, duplicate-submit prevention, realtime queue movement, internal metadata/activity, safe customer projection, archive preservation, and responsive table cards.
