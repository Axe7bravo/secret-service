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

The payment document records `attemptNumber` and `idempotencyKey`. The key is deterministic: `<operationId>:checkout:<attemptNumber>`. Concurrent or repeated calls for the same pending attempt reuse the stored key, so Yoco converges them onto the same checkout. A completed checkout URL is returned directly. A retry after a failed provider attempt increments the attempt number and receives a new key. The stable payment document remains `payments/{operationId}`.

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

Only `payment.succeeded` and `payment.failed` are processed. Other verified events receive 2xx without mutation. The handler reconciles `metadata.checkoutId` against the uniquely stored `providerCheckoutId`; amount and currency are checked when present. It does not trust an operation ID in metadata as settlement authority.

## Settlement and failure

A successful verified event calls `confirmOperationPayment`. That transaction rechecks provider, checkout ID, amount, currency, ownership, immutable operation snapshot, payment state, and canonical transition. It atomically updates payment and operation state, writes activity, and rebuilds the customer projection while preserving `archived` and `archivedAt`. Duplicate success delivery returns 2xx without duplicate activity.

Yoco payment webhook content is read from the documented top-level `payload` shape. The parser retains compatibility with a payload nested below `data`, but top-level `payload.metadata.checkoutId` is the primary reconciliation source. A provider-verified success can recover a matching local `FAILED` attempt as well as a `PENDING` attempt; checkout ID, amount, currency, operation state, and ownership must still reconcile before settlement.

A verified `payment.failed` event marks only the matching pending payment attempt failed and writes a safe activity record. The operation remains `PAYMENT_PENDING`, and a later customer retry creates a new attempt key. Raw provider diagnostics are not exposed to customers.

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
- Return URLs cannot settle payment.
- Webhook verification uses raw bytes, constant-time comparison, and replay protection.
- Settlement requires an exact stored checkout match and is idempotent.
- Card details are collected only by Yoco's hosted checkout and are never stored by Secret Service.

## Known limitations

Refund initiation, accounting exports, notifications, stored cards, subscriptions, discounts, and historical attempt subcollections remain deferred. The current single payment document retains the current attempt plus its monotonically increasing attempt number rather than a full provider-attempt ledger.

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
