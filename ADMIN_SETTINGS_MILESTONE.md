# Admin Settings Milestone

## Purpose and route

Admin Settings contains only operational configuration that is currently consumed by customer operation creation. The protected route is `/settings`, and Settings is an active Admin sidebar module. Payments remains the only deferred sidebar module.

No API keys, credentials, environment variables, service accounts, webhooks, custom claims, authentication-provider configuration, deployment controls, or infrastructure settings are exposed.

## Implemented settings

The MVP supports:

- `operationCreationEnabled` — temporarily enables or disables new customer submissions.
- `minimumLeadTimeDays` — minimum number of Johannesburg calendar days before requested delivery.
- `maximumFutureDays` — maximum scheduling horizon from the Johannesburg date.
- `deliveryWindows` — the allowlisted customer-selectable delivery-window options.
- `availabilityMessage` — optional customer-safe text displayed when creation is unavailable.

Every setting is consumed by both customer UX and trusted creation validation. No decorative or placeholder settings were added.

## Data model and defaults

Firebase stores one stable document at `systemSettings/operations`:

```text
operationCreationEnabled: boolean
minimumLeadTimeDays: integer
maximumFutureDays: integer
deliveryWindows: string[]
availabilityMessage: string
updatedAt: server timestamp
updatedBy: trusted admin UID
```

Defaults allow creation, permit same-day requests, use a 90-day future horizon, provide four bounded delivery windows, and leave the availability message empty. Missing or malformed settings fall back safely, so no manual seed is required. Frontend mock/default values are exported from `@secret-service/config`; Firebase responses always use the authoritative Functions settings parser/defaults.

## Validation

The trusted backend accepts only the five allowlisted editable fields and validates:

- creation availability is an actual boolean;
- minimum lead time is an integer from 0 through 30;
- maximum horizon is an integer from 1 through 365 and greater than lead time;
- 1 through 12 unique delivery windows are provided;
- every window is non-empty and no longer than 80 characters;
- availability message is text no longer than 280 characters.

The Admin form mirrors these checks for immediate feedback, but backend validation remains authoritative. Save uses a merge write with only known fields plus server-owned audit metadata, preserving unrelated system-managed data.

## Trusted reads and writes

`getAdminSettings` requires `requireAdmin`, reads the settings document with the Admin SDK, applies safe defaults, and returns operational fields plus ISO audit metadata.

`saveAdminSettings` requires the strict admin custom claim, parses an allowlisted schema, assigns `updatedAt` and `updatedBy` server-side, and merges the stable document. The browser never writes Firestore settings directly, and Firestore rules were not opened.

The Settings page provides loading, retryable failure, dirty-state detection, client validation, pending save, duplicate-save prevention, success feedback, save failure, update audit display, labelled inputs, and keyboard-native controls.

## Customer-safe configuration

The authenticated `getCustomerCatalog` callable now returns a deliberate `settings` projection containing only:

- creation enabled state;
- minimum lead time;
- maximum future horizon;
- delivery windows;
- customer availability message.

It never exposes `updatedBy`, audit timestamps, staff-only metadata, secrets, or infrastructure configuration.

## New Operation integration

New Operation:

- disables submission and form editing when creation is unavailable;
- presents the allowlisted customer-safe availability message;
- calculates native date-input `min` and `max` values without UTC form conversion;
- keeps date-only `YYYY-MM-DD` values;
- replaces free-text delivery-window entry with an allowlisted dropdown;
- preserves package/campus catalogue loading, selection, trusted IDs, and snapshots.

The trusted `createOperation` transaction rereads `systemSettings/operations` alongside package and campus documents. It independently rejects disabled creation, dates outside configured Johannesburg-relative bounds, and delivery windows no longer allowlisted. Client guidance is never trusted.

## Mock and Firebase modes

Admin mock mode reads and saves through the same settings repository/command interfaces and persists its settings in the Admin app's existing session-storage style. Customer mock mode consumes shared safe defaults through its catalogue adapter. Because Admin and Customer development servers use separate browser origins, cross-app mock changes are not synchronized; cross-application configuration behavior is verified in Firebase mode.

Firebase mode uses trusted callables for Admin reads/writes and the existing authenticated customer catalogue callable for safe exposure. No raw Firebase settings types leak into React components.

## Security boundaries

- Admin access depends on `request.auth` and `role === "admin"` custom claims.
- Authorization never uses email or client-provided role values.
- Customers receive only the explicitly safe configuration projection.
- Settings cannot mutate authentication, roles, payment configuration, deployment state, or secrets.
- Firestore client write permissions remain denied.

## Deferred functionality and limitations

- Payments, Yoco, refunds, webhooks, and payment-provider settings remain deferred.
- Settings are a single operational document without version history or a separate audit collection.
- Mock cross-origin synchronization is intentionally unsupported.
- Scheduling rules use whole Johannesburg calendar days; holidays, blackout dates, and campus-specific windows are not modeled.

## Manual verification

Run manually from the repository root:

```text
npm run typecheck
npm run lint
npm run build
```

Verify route/claim protection, missing-document defaults, loading/retry states, every validation boundary, dirty-state behavior, pending/error/success saves, audit metadata, safe catalogue exposure, creation disablement, customer message, date min/max, delivery-window selection, backend rejection after stale configuration, mock behavior, Firebase behavior, and absence of secrets.
