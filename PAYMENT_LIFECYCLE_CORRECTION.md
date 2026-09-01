# Payment Lifecycle Correction

## Product decision

Secret Service uses **one operation = one package = one payment**. There is no cart or order aggregate. An operation is reviewed before payment becomes due so a customer is not charged for content that may be rejected.

## Lifecycle

The previous sequence placed payment before moderation:

`NEW → PAYMENT_PENDING → PAID → REVIEW_REQUIRED → APPROVED → PREPARING`

The corrected canonical sequence is:

`NEW → REVIEW_REQUIRED → APPROVED → PAYMENT_PENDING → PAID → PREPARING → READY_FOR_DELIVERY → AMBASSADOR_ASSIGNED → OUT_FOR_DELIVERY → DELIVERED → COMPLETED`

Side states remain `REJECTED`, `CANCELLED`, `DELIVERY_FAILED`, and `REFUNDED`.

## Creation and moderation

`createOperation` writes a new authoritative operation directly in `REVIEW_REQUIRED`, with internal moderation `PENDING` and payment summary `NOT_REQUIRED_YET`. The creation activity therefore records submission for review rather than a payment request.

Approval remains an explicit `REVIEW_REQUIRED → APPROVED` moderation decision. In the same trusted transaction, the backend records a separate system `APPROVED → PAYMENT_PENDING` activity and persists the final payable state. This keeps approval auditable while ensuring the browser does not manufacture a payment transition. Rejection remains `REVIEW_REQUIRED → REJECTED` and never enters a payable state.

`PAYMENT_PENDING` now means the operation passed moderation and payment is required. It does not imply that a provider session exists. No operation is marked `PAID` by this milestone.

## Fulfilment gating

The trusted workflow permits `PAYMENT_PENDING → PAID → PREPARING`. It rejects `APPROVED → PREPARING` and `PAYMENT_PENDING → PREPARING`. The future Payments milestone must perform the trusted transition to `PAID`; customers cannot do so.

## Customer-safe mapping

| Internal status | Customer status |
| --- | --- |
| `NEW`, `REVIEW_REQUIRED` | Under Review |
| `APPROVED` | Approved |
| `PAYMENT_PENDING` | Payment Required |
| `PAID` | Confirmed |
| `PREPARING`, `READY_FOR_DELIVERY` | Preparing Your Operation |
| `AMBASSADOR_ASSIGNED` | Delivery Scheduled |
| `OUT_FOR_DELIVERY` | In Progress |
| `DELIVERED` | Delivered |
| `COMPLETED` | Operation Complete |
| `REJECTED` | Requires Attention |
| `CANCELLED` | Cancelled |
| `DELIVERY_FAILED` | Delivery Issue |
| `REFUNDED` | Refunded |

Moderation notes, staff notes, failure details, and ambassador contact data remain outside the customer projection. Projection rebuilds continue carrying customer-owned `archived` and `archivedAt` metadata.

## Mock and Firebase modes

Mock creation now starts in review with payment not yet required. Mock approval mirrors Firebase behavior by recording approval and then awaiting payment. Firebase mode enforces the corrected transitions in the centralized trusted validator and writes both approval/payment-required activities atomically.

## Deferred work and limitations

This correction does not add checkout, Yoco, payment sessions, provider IDs, webhooks, capture, refunds, receipts, invoices, or a Payments admin module. Approved operations remain in `PAYMENT_PENDING` until the Payments milestone introduces a trusted payment confirmation path. Legacy persisted operations are not automatically migrated by this code change.

## Manual verification

1. Create an operation and confirm it appears in Moderation as Under Review.
2. Reject one and confirm it never becomes Payment Required.
3. Approve one and confirm the activity log contains approval followed by Payment Required.
4. Confirm approved/unpaid operations have no preparation action.
5. Confirm a `PAID` fixture exposes Start Preparation.
6. Confirm customer status labels and tracking reflect the revised order.
7. Archive and restore an eligible customer operation after a projection update.
8. Run `npm run typecheck`, `npm run lint`, and `npm run build`.
