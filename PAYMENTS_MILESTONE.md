# Payments Milestone — Yoco Gateway Boundary

## Product and lifecycle model

Secret Service uses one operation, one package snapshot, and one payment. There is no cart, quantity, basket, or multi-operation checkout. Moderation remains before payment:

`REVIEW_REQUIRED → APPROVED → PAYMENT_PENDING → PAID → PREPARING`

The operation lifecycle and payment lifecycle remain separate. `operation.status = PAYMENT_PENDING` means the approved operation is awaiting payment. A payment record uses `PENDING`, `PAID`, `FAILED`, `CANCELLED`, or `REFUNDED`.

## Architecture

The implemented boundary is:

`Customer Operation Detail → createOperationPayment callable → payment eligibility/idempotency reservation → Yoco adapter`

Trusted settlement is:

`verified provider webhook adapter → confirmOperationPayment → payment + operation + projection + activity transaction`

The repository did not contain a verified current Yoco checkout request/response contract or webhook signature specification. In accordance with the milestone's fail-safe requirement, `yocoProvider.ts` deliberately refuses provider initiation. No endpoint, request field, minimum amount, or signature algorithm has been invented. Firebase payment initiation therefore remains closed until the provider contract is supplied and reviewed.

## Authoritative payment record

`payments/{operationId}` is the stable one-operation payment record. It stores the operation/customer relationship, `YOCO` provider, immutable amount in integer minor units, `ZAR`, safe provider identifiers, checkout URL when available, lifecycle timestamps, and a safe failure category. It never stores card numbers, CVV, credentials, secrets, or raw provider payloads.

The stable operation ID prevents uncontrolled parallel payment records. Initiation first reserves the record transactionally. Concurrent requests reuse the pending reservation rather than issuing another provider call. Failed initiation marks the attempt `FAILED`, allowing a deliberate retry against the same payment identity.

## Eligibility and price integrity

The callable derives the customer UID from Firebase Authentication and requires ownership, `PAYMENT_PENDING`, payment summary `PENDING`, an unsettled payment record, positive integer amount, and `ZAR`. Amount and currency come exclusively from the immutable operation package snapshot. The browser submits only the operation ID.

## Customer payment experience

Operation Detail shows Pay now only for an operation whose authoritative customer projection is payment pending. Duplicate clicks are disabled during initiation. Firebase mode calls the trusted Function and redirects only when the adapter returns a provider-safe checkout URL. A redirect or browser return is never treated as proof of payment. The existing realtime customer projection is the confirmation channel.

Mock mode uses the same command interface and simulates trusted confirmation by moving the mock operation from `PAYMENT_PENDING` to `PAID`. Mock identifiers are clearly prefixed and are not credentials.

## Trusted settlement

`confirmOperationPayment` is an internal settlement primitive, not a public Function export. It is intended only for a future webhook adapter after authenticity verification. It validates provider, payment ID, amount, currency, customer ownership, immutable operation snapshot, payment state, and the canonical `PAYMENT_PENDING → PAID` transition. Duplicate successful events return `ALREADY_CONFIRMED` without a second transition or activity record. A valid confirmation atomically updates the payment, operation payment summary, operation status, customer-safe projection, and activity history while preserving `archived` and `archivedAt`.

## Webhook and Yoco configuration status

No webhook endpoint is exported because the repository contains no authoritative Yoco signature contract. Shipping an endpoint with guessed verification would be less secure than keeping it closed. Before Firebase mode can process real payments, obtain current Yoco documentation/account details and implement:

1. the verified checkout endpoint and exact request/response fields in `yocoProvider.ts`;
2. the supported server-side secret mechanism using Firebase Functions secrets;
3. test/live credential selection through explicit server configuration;
4. the exact webhook signature verification algorithm and required headers;
5. a webhook handler that calls `confirmOperationPayment` only after verification;
6. provider-specific minimum-amount validation in the adapter.

No `VITE_` secret is permitted. No environment variable name is treated as active until the verified contract establishes its meaning. Test/live mode must be explicit and must not be inferred from hostname.

## Admin Payments

The Admin sidebar now activates `/payments` and `/payments/:paymentId`. The list supports status filtering and reference search, and shows safe operational fields. Detail shows linked operation, customer reference, amount, provider identifiers, timestamps, and safe failure classification. It provides visibility only: no fabricated refund or settlement controls were added.

Firestore permits authenticated custom-claim admins to read payments and denies every browser write. Customers receive payment state only through their owned customer-safe projection.

## Failure, cancellation, and refunds

Provider initiation failures leave the operation in `PAYMENT_PENDING` and mark the payment attempt failed. Checkout abandonment or payment cancellation must not cancel the operation. Refund execution is deferred because no verified Yoco refund contract exists. Existing `REFUNDED` records remain representable and visible.

## Manual verification checklist

- For an end-to-end Admin → Customer test, set `VITE_DATA_SOURCE=firestore` for both `apps/admin` and `apps/customer`, then restart both dev servers. Admin reads and trusted writes now use this single mode selector; `VITE_OPERATION_WRITE_MODE` is no longer used.
- Confirm a review/rejected operation has no Pay now action.
- Confirm an approved `PAYMENT_PENDING` operation derives its amount from the operation snapshot.
- Double-click Pay now and verify only one initiation is allowed.
- In mock mode, confirm payment changes the realtime operation state to Confirmed.
- In Firebase mode without a provider adapter, confirm initiation fails closed safely.
- Verify admin payment list/detail access with an admin custom claim and denial without it.
- After wiring verified Yoco contracts, test invalid signatures, amount/currency mismatch, duplicate webhooks, failed payment retry, checkout abandonment, and delayed success.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` manually.

## Known limitations

Real Yoco checkout and webhook processing are intentionally not enabled until verified provider contracts are supplied. No return route is needed yet because no hosted checkout can be created. Refund initiation, accounting, reconciliation, notifications, and historical attempt arrays remain deferred.
