# Payments Milestone — Yoco Checkout

## Product and lifecycle model

Secret Service uses one operation, one immutable package snapshot, and one payment record. There is no cart. Only an owned operation in `PAYMENT_PENDING` with a pending payment summary can start checkout. The amount is read server-side from `operation.package.priceMinor`, is already an integer number of cents, and is sent to Yoco unchanged with currency `ZAR`.

The browser redirect is never proof of payment. Only a verified Yoco webhook can invoke the internal settlement primitive and move `PAYMENT_PENDING → PAID`.

## Checkout architecture

`Customer Operation Detail → createOperationPayment callable → transactional eligibility/reservation → Yoco Checkout API → hosted redirectUrl`

`createOperationPayment` requires Firebase Authentication and operation ownership. The callable is bound only to `YOCO_SECRET_KEY`; the key is read inside the handler and passed to the server-only provider adapter. The adapter posts to `https://payments.yoco.com/api/checkouts` with:

- the immutable integer `amountMinor` as `amount`;
- server-fixed `ZAR` currency;
- configured customer return URLs;
- `clientReferenceId = paymentId`;
- `externalId = operationId`;
- non-sensitive operation/payment IDs in metadata;
- a persisted `Idempotency-Key`.

The response must contain a checkout ID, HTTPS redirect URL, the expected integer amount, and `ZAR`. Safe reconciliation fields are stored on `payments/{operationId}`. No credentials or payment-instrument details are stored.

## Idempotency

The payment document records `attemptNumber` and `idempotencyKey`. The key is deterministic: `<operationId>:checkout:<attemptNumber>`. Concurrent calls and ambiguous checkout-creation failures reuse the same key and saved return URLs. A saved pending checkout URL is returned directly, including after abandonment. Only a signed failure for the saved current checkout permits a new key. Initiation errors remain pending with a diagnostic category; they are not evidence that Yoco created nothing. The stable payment document remains `payments/{operationId}`.

Every registered checkout is retained in a bounded `attempts` array (maximum 20, no eviction) and a `providerCheckoutIds` lookup array. Each attempt stores checkout ID, immutable amount/currency, outcome and optional provider payment ID; operation/customer ownership comes from the unchanged parent record. `settledCheckoutId` identifies the winner. The existing top-level checkout/payment references are aligned to that winner on settlement so Admin reads remain consistent; a different checkout's redirect is removed. Other references remain in history. `checkoutRequest` preserves non-secret return URLs and test/live mode. Mode switches and legacy unknown-mode retries require operator review. Reaching the cap blocks creation, not reconciliation. No new collection or frontend model is needed.

## Customer returns

The customer app provides:

- `/operations/:operationId/payment/success`
- `/operations/:operationId/payment/cancelled`
- `/operations/:operationId/payment/failed`

Success shows verification pending until the UID-scoped realtime customer projection reports payment as paid. Cancelled and failed returns provide safe feedback and link back to the operation. None of these routes writes payment or operation state.

## Webhook architecture

The exported public HTTP Function is `yocoWebhook`, in `us-central1`. Its deployed URL normally follows:

`https://us-central1-<project-id>.cloudfunctions.net/yocoWebhook`

It is bound only to `YOCO_WEBHOOK_SECRET` and does not require Firebase Auth because Yoco is the caller. It requires `webhook-id`, `webhook-timestamp`, and `webhook-signature`, uses the exact raw request body, removes the `whsec_` prefix, base64-decodes the secret, and calculates HMAC-SHA256 over:

`<webhook-id>.<webhook-timestamp>.<raw-body>`

Supported `v1` signatures are base64-decoded and compared with `crypto.timingSafeEqual`. Timestamps outside the 180-second replay window are rejected before JSON processing. Invalid signatures are never acknowledged with 2xx.

Only `payment.succeeded` and `payment.failed` are processed. Other verified events receive 2xx without mutation. The handler matches `payload.metadata.checkoutId` against stored checkout history, with an equality lookup for legacy current checkout records. Results are deduplicated by payment document ID and must identify exactly one document. The transaction rechecks history membership; arbitrary operation/customer metadata cannot substitute for a saved checkout.

The [Yoco Checkout API payment notification](https://developer.yoco.com/api-reference/checkout-api/webhook-events/payment-notification) documents `payload.amount`, `payload.currency`, `payload.id` and `payload.metadata.checkoutId`. Successful events must supply a positive safe-integer amount, `ZAR` and the two provider identifiers at those locations. Amount/currency must exactly match the saved payment and operation snapshot. Missing, malformed or mismatched values never settle; stored amounts are not substituted for absent event data. Unsupported nested `data` variants are no longer guessed. Failure events validate amount/currency when supplied but cannot establish successful payment.

## Settlement and failure

A successful verified event calls `confirmOperationPayment`. That transaction rechecks provider, checkout ID, amount, currency, ownership, immutable operation snapshot, payment state, and canonical transition. It atomically updates payment and operation state, writes activity, and rebuilds the customer projection while preserving `archived` and `archivedAt`. Duplicate success delivery returns 2xx without duplicate activity.

A provider-verified success can recover any retained legitimate checkout, including an older or failed attempt, while the operation remains eligible. The first success wins atomically. Same winning checkout/payment redeliveries do not change `paidAt`, projections or activity. A different successful checkout (or conflicting provider payment identifier) after settlement returns 2xx and logs `additional_payment_success`; its attempt outcome is retained without replacing the winner. Investigate a possible second provider charge manually. No automated refund or second local settlement is performed.

A verified `payment.failed` event records its attempt failure once. Only failure of the current checkout changes the parent to `FAILED`; old failures cannot fail a newer reservation. Failure after `PAID` is ignored and cannot undo settlement. A saved failure remains in history after retry. Raw provider diagnostics are not exposed to customers.

If an older success settles while a new checkout request is in flight, checkout-response persistence merges the freshly read payment rather than its stale reservation, records the new checkout for future reconciliation and does not return a redirect for the now-paid operation. A webhook received before its checkout reference is persisted receives non-2xx for later provider retry; it is never accepted solely from metadata.

Timestamp verification and settlement idempotency are separate. Yoco documents [fresh signatures/timestamps on retries](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events). The existing 180-second signed-delivery window and raw-body constant-time verification remain unchanged; the original event creation time is not used to reject a fresh delivery.

## Secrets and non-secret configuration

Required Firebase secrets:

- `YOCO_SECRET_KEY` — use a Yoco test secret beginning `sk_test_` while testing.
- `YOCO_WEBHOOK_SECRET` — the one-time webhook signing secret returned by Yoco, beginning `whsec_`.

Required parameter:

- `CUSTOMER_APP_URL` — the public origin of the deployed customer dashboard, for example `https://customer.example.com`. It is non-secret and is used only to construct return routes.

Never place either secret in a `VITE_` variable, frontend environment file, Firestore, Admin Settings, source, or logs. No Yoco public key is required for hosted Checkout.

## Operator setup

1. Store the test checkout secret:
   `firebase functions:secrets:set YOCO_SECRET_KEY --project secret-service-37f6b`
2. Deploy once and provide `CUSTOMER_APP_URL` when Firebase prompts for the parameter. Use the deployed customer dashboard HTTPS origin.
3. Register a webhook with Yoco using `POST https://payments.yoco.com/api/webhooks`, Bearer authentication with the Yoco secret key, and a payload containing a descriptive `name` and the deployed `yocoWebhook` URL. Registration is an operator action and is never performed at Functions startup.
4. Copy the webhook secret returned once by Yoco into Firebase Secret Manager:
   `firebase functions:secrets:set YOCO_WEBHOOK_SECRET --project secret-service-37f6b`
5. Deploy Functions again after both secrets are configured.
6. Sign in as a customer, pay a `PAYMENT_PENDING` operation using Yoco test checkout, and confirm that webhook settlement updates the customer projection.

Do not paste secret values into command history as arguments. The Firebase CLI secret command prompts securely for the value.

## Admin Payments

The existing Admin Payments list/detail remains read-only. It continues to show safe payment and reconciliation state, including checkout/payment identifiers, attempt number, and provider processing mode when present. No client-side settlement or refund control was added.

An Admin **Verify Payment** mutation has intentionally not been added yet. The repository currently contains a verified Yoco checkout-creation contract, but no verified checkout-retrieval/status endpoint or response contract. Inventing an endpoint or treating Firestore state as provider verification would create an unsafe manual paid path. Until a verified retrieval contract is supplied, delayed payments are recovered by replaying the signed Yoco webhook from the Yoco operator dashboard.

## Customer status refresh

The success-return page's **Check status** control refreshes the customer's UID-scoped realtime Firestore subscription. It disables repeated clicks and reports either **Payment confirmed** or **Still awaiting secure confirmation from Yoco**. It does not query an undocumented provider endpoint and cannot settle payment by itself. Normal settlement remains webhook-driven.

## Security boundaries

- Secret material exists only in secret-bound Functions.
- The browser supplies only an operation ID; amount and currency are authoritative server values.
- Customers cannot write payment documents or set `PAID`.
- Admin `transitionOperation` explicitly denies targets `PAID` and `REFUNDED` before any transaction. Canonical lifecycle validity does not grant actor authority. Ambassador commands retain their delivery-only allowlist. The internal settlement helper remains unexported from the deployed Functions index; only the verified webhook invokes it.
- Return URLs cannot settle payment.
- Webhook verification uses raw bytes, constant-time comparison, and replay protection.
- Settlement requires an exact stored checkout match and is idempotent.
- Card details are collected only by Yoco's hosted checkout and are never stored by Secret Service.

## Known limitations

Refund initiation, accounting exports, notifications, stored cards, subscriptions, discounts, and historical attempt subcollections remain deferred. The bounded in-document history is not a general ledger. Existing top-level checkout references remain reconcilable without migration, but IDs already erased by old retry code cannot be recovered automatically. Reconcile legacy records and unknown processing modes with trusted provider evidence before live cutover; do not populate history from browser metadata or delete existing payment records.

The [checkout API](https://developer.yoco.com/api-reference/checkout-api/checkout/create-checkout) documents an idempotency header, but the inspected reference does not specify its retention period. Do not assume indefinite provider deduplication or automatically rotate keys to escape an ambiguous error. Persistent ambiguity, expired/abandoned checkout recovery, merchant/key changes and a response lost before its ID was saved require operator reconciliation. No undocumented provider lookup endpoint was invented. Cancellation while payment is in flight remains a manual exception: settlement does not resurrect a cancelled operation; the verified event is logged and receives non-2xx pending reconciliation. Keep provider redelivery available and investigate promptly.

## Payment-integrity repair verification (2026-09-07)

Source reviewed and edited only; typecheck, lint, build, provider requests, tests and deployment were not run. Firebase Auth guidance informed the actor-authority restriction; no authentication setup or credentials changed. Admin action maps and payment screens already lacked manual paid/refund controls, so no UI edit was needed. Firestore client-write denials, safe customer projection and secret handling remain unchanged. The history query uses the normal single-field array index; no composite index or rules change was added. Verify the deployed index has not been disabled.

Manual test matrix before live checkout:

| Scenario | Required result |
| --- | --- |
| Admin calls `transitionOperation` to PAID/REFUNDED directly | Permission denied; no writes/activity |
| Customer/Ambassador/redirect attempts settlement | No authorized route to settlement |
| Missing/malformed/wrong success amount, currency or checkout | No settlement; non-2xx |
| Two concurrent Pay Now calls / lost response | Same reservation key/body; one saved checkout and initiation activity |
| Abandon checkout then retry | Existing pending redirect, not an invented expiry/new key |
| Signed current failure then retry | New key; old reference and failed outcome retained |
| Old checkout succeeds before new checkout | One atomic PAID update and safe CONFIRMED projection |
| Old success during retry response persistence | Winner preserved; late response reference recorded; no new redirect |
| Same success redelivered with fresh signed delivery | 2xx; same paidAt; one PAYMENT_CONFIRMED activity |
| Different checkout succeeds after PAID | 2xx; anomaly log/outcome; no resettlement; operator investigates |
| Failure after PAID / old failure during newer pending attempt | No paid regression / newer attempt remains pending |
| Failure followed by success on same checkout | Valid success settles once if operation still eligible |
| History at 20 checkouts | No new checkout; retained events still reconcile |
| Legacy current checkout / two documents claiming same checkout | Legacy match works / ambiguity rejected |
| Test/live mode switch or unknown legacy mode | New checkout refused pending review |

Confirm immutable amount/currency/customer linkage, archived projection metadata, no privileged data leakage, and normal post-payment fulfilment after each successful settlement.

## Firebase Functions deployment initialization

Firebase Admin initialization is lazy and default-app aware. `getAdminApp()` reuses the actual `[DEFAULT]` app when present and otherwise calls `initializeApp()` with Application Default Credentials. Firestore and Auth are always derived from that shared app helper.

Deployment configuration remains:

- `firebase.json` uses `apps/functions` as the Functions source.
- `apps/functions/package.json` points `main` to `lib/index.js` and declares ESM with `type: module`.
- `apps/functions/tsconfig.json` compiles `src/index.ts` to `lib/index.js` using NodeNext module semantics.
- Runtime-relative imports use `.js` extensions and resolve in emitted output.
- Real checkout and webhook processing require `YOCO_SECRET_KEY`, `YOCO_WEBHOOK_SECRET`, and `CUSTOMER_APP_URL` as documented above.

## Manual verification

Run manually:

```text
npm run typecheck
npm run lint
npm run build
```

Then deploy manually if those pass:

```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT="30"
firebase deploy --only functions --project secret-service-37f6b
```
