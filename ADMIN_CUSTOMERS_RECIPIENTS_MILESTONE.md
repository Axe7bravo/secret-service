# Admin Customers + Recipients Milestone

## Customers architecture

Customers are exposed to the admin application through the trusted `getAdminDirectory` callable. The browser does not enumerate Firebase Authentication users and no broad Firestore read permission was added. The Function requires an authenticated caller with the trusted `role: "admin"` claim.

The customer source of truth is Firebase Authentication for account identity and authoritative `operations` documents for operational history. The callable returns only an allowlisted projection: UID reference, email and display name when present, account state, creation and last-sign-in timestamps, and summarized related operations. Provider data, password state, tokens, custom claims, and security metadata are not returned.

Customers with operations but no available Auth record remain visible with an `UNAVAILABLE` account state. Auth customers without operations also appear. The list supports search and recent-activity sorting. Customer Detail shows account fields, aggregate operation counts, and links to the existing Operation Detail route.

## Recipients architecture

Recipients are not accounts and do not have a new mutable Firestore collection. The directory is derived inside the trusted callable from recipient snapshots stored on authoritative operations. This keeps historical delivery data aligned with the operation that collected it.

No stable recipient ID currently exists. The MVP recipient reference is an opaque SHA-256-derived value based on normalized recipient name, phone, and campus. It never groups by name alone. This conservative grouping can still split one person when their details change, and shared/reused details remain a limitation; it is not promoted as a permanent domain identity.

Recipient Detail displays the admin-authorized delivery/contact snapshot and summarized related operations. Full operational records remain on `/operations/:operationId` rather than being duplicated.

## Trusted read behavior

`getAdminDirectory` performs one bounded Firebase Auth listing and one bounded, ordered operations query, each limited to 500 records for the MVP. It aggregates in the trusted Functions environment and returns customer and recipient projections in one response. There are no N+1 browser reads and no direct Auth Admin SDK use in the frontend.

The response indicates when the bounded result may be truncated. Pagination tokens are intentionally not exposed in this milestone; server-backed pagination is a future scaling enhancement.

## Mock and Firebase modes

The repository boundary follows `VITE_DATA_SOURCE`. Mock mode derives directory records from the existing operation seed without Firebase branches in React. Because the existing mock operations do not define stable recipient identities, mock recipients remain operation-linked rather than being silently merged.

Firestore mode calls the trusted directory Function. The Customers and Recipients React pages receive typed admin projections and do not handle Firebase SDK document or Auth user types.

## Relationship to Operations

Both detail pages show concise operation summaries and link to `/operations/:operationId`. They do not duplicate the authoritative Operation Detail UI or workflow controls.

## Privacy and security

- Every directory read requires `request.auth` and `request.auth.token.role === "admin"` through `requireAdmin`.
- Authorization is never based on email.
- No customer-facing repository, projection, rule, or route was expanded.
- Recipient contact data remains admin-only.
- `operationInternal`, moderation details, ambassador private information, and Auth security metadata are not returned.
- Customers and recipients are read-only; no deletion, impersonation, password reset, suspension, or arbitrary identity editing was added.

## Indexes

No composite Firestore index was required. The bounded operations query orders by the existing single `createdAt` field index.

## Known MVP limitations

- Results are bounded to 500 Auth users and 500 recent operations.
- Recipient grouping is derived and conservative because no stable recipient ID exists.
- Auth users without an admin/customer role distinction are treated as customers unless they carry `role: "admin"` or `role: "ambassador"`.
- Customer profile fields are limited to allowlisted Firebase Auth fields and persisted operation history; no CRM profile collection was invented.
- Directory results are request-based rather than realtime subscriptions.

## Intentionally deferred

Payments, Yoco, Deliveries, Ambassador management, Moderation, Campuses, Settings, customer dashboard completion, messaging, marketing CRM, destructive account actions, recipient editing, and deployment remain outside this milestone.

## Manual verification checklist

Run manually from the repository root:

```text
npm run typecheck
npm run lint
npm run build
```

Then verify authorized and unauthorized callable access, mock and Firebase directory modes, all list/detail states, customer and recipient search, operation links, bounded-result notices, responsive table reflow, and that unfinished sidebar modules remain disabled.
