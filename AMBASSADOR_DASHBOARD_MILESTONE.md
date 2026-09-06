# Ambassador Dashboard MVP

## Architecture and audit findings

The separate `apps/ambassador` Vite/React/TypeScript workspace uses existing
Firebase Auth, lazy client initialization and default-region callable services.
The existing apps and their presentation are not replaced. Port: **3003**.
Root wildcard workspaces integrate installation, build, typecheck and lint.

Pre-implementation inspection found that `ambassadors/{rosterId}` is an
operational roster, not an Auth user directory. Admin assigns roster IDs.
Those IDs must never be assumed to equal Firebase Auth UIDs. The roster now has
an optional operator-linked `authUid`, preserved by normal Admin roster edits.
Assignment retains `assignedAmbassadorId` for current Admin functionality and
also stores the trusted `assignedAmbassadorUid`, copied only from that roster.
Existing unlinked ambassadors remain usable by Admin but have no portal access
to operations until explicitly linked. No email-based matching is performed.

## Routes and authentication

- `/login`: existing-account Firebase email/password sign-in; no public signup.
- `/dashboard`: assigned-work briefing and repository-derived counts.
- `/operations`: search, status filters, live history window.
- `/operations/:operationId`: safe delivery details and trusted actions.
- `/account`: read-only Auth name/email, role label, access refresh.
- `/`: guarded redirect to dashboard. Unknown protected routes show not found.

The guard checks **claims.role === 'ambassador'**, not the legacy boolean claim,
email, route or profile role. Token observation, sign-out, claim refresh and
cleanup reuse the shared Auth service. Non-ambassadors receive a restricted
access view with refresh and sign-out. The backend is the security boundary.

## Read boundary / Firestore rule design

New collection: `ambassadorOperations/{operationId}`. Every document is a
server-written, full-replacement allowlist: operation ID, assigned roster ID and
UID, package name, fulfilment status, recipient name/phone/campus/residence/
location/instructions, requested date/window, assignment/start/delivered/update
timestamps and role-specific available actions. No sender identity, prices,
payment details, anonymous message, moderation data, safety flags or raw audit
notes are copied. No direct authoritative collection reads are added to the app.

The operator also maintains `ambassadorAccounts/{authUid}` containing only
`ambassadorId`. This server-only identity lookup is not a second roster or a
browser profile. It provides a deterministic rule dependency and a transactional
lock preventing two simultaneous roster links to the same UID. Its browser reads
and writes are denied; Firestore rules may still use it for authorization.

List query: `ambassadorUid == authenticatedUid`, `updatedAt desc`, limit 50–200.
Detail uses a document listener with the same rule ownership enforcement.
The new composite index supports the list. Filters/search apply to the loaded
window, and the UI explicitly labels this limitation. Dashboard counts cover
the latest 200 assignments, not global/lifetime metrics. Realtime list expansion
supports 50, 100, 150 and 200 documents. Older history remains with Admin.

Rules require signed-in `role == 'ambassador'`, matching projection UID and an
active linked roster whose `authUid` matches that UID, resolved through the
caller-fixed `ambassadorAccounts/{uid}` lookup rather than a variable result field.
Roster reads within rules do not grant the browser roster access. The new collection denies all browser
writes. Existing collection access remains unchanged for role-based Admin and
Customer users. The shared `isAdmin()` helper now requires `role == 'admin'`,
matching trusted Functions; a leftover `admin: true` boolean cannot grant an
ambassador account Admin reads. Legacy boolean-only administrators must obtain
the existing approved admin role claim before this rules deployment.

## Assignment / reassignment and projection synchronization

Both Admin assignment entry points (`assignAmbassador` and `transitionOperation`)
copy trusted UID linkage and write the ambassador projection **in the same
transaction** as assignment, customer projection and audit. Reassignment replaces
the single projection document, so the old UID loses ownership and the new UID
gains it atomically. Reassigning to an unlinked roster deletes the projection.
Retry resets assignment, UID and current-attempt timestamps and deletes the
projection; the old ambassador no longer sees that operation. Admin cancellation,
delivery and completion also rewrite the projection through the shared helper.

No asynchronous trigger is used for ownership changes. This avoids a window in
which an old projection remains readable after trusted reassignment. All present
assignment writers were inspected. Future privileged writers must call
`writeAmbassadorOperationProjection` in their transaction. Direct console edits
to assignment fields are outside the supported workflow.

## Trusted lifecycle actions

New callable: `ambassadorTransitionOperation`. It requires authenticated role
`ambassador`, derives UID from `request.auth.uid`, loads the operation and active
linked roster transactionally and matches both assignment UID and roster link.
It rejects unsupported input fields and never accepts authoritative identity,
amount, timestamp, current status or assignment from the browser.

Role capabilities filter the **existing canonical transition table**:

- `AMBASSADOR_ASSIGNED → OUT_FOR_DELIVERY` (Start Delivery)
- `OUT_FOR_DELIVERY → DELIVERED` (Mark Delivered)
- `OUT_FOR_DELIVERY → DELIVERY_FAILED` (Report Delivery Issue)

Delivery failure is an existing canonical edge; this milestone explicitly
authorizes the assigned ambassador to report it. It requires 1–500 characters
after trimming and stores the reason in internal delivery metadata and privileged
activity only. Admin retains retry, reassignment, cancellation and completion.
Availability controls new assignments, not an already assigned delivery; active
roster state is required for portal access and actions.

The callable reuses `validateTransition`, writes server timestamps, attributes
audit to `AMBASSADOR` and the caller UID, updates the authoritative operation,
and rebuilds customer and ambassador projections atomically. Customer archive
metadata is preserved. Customer safe statuses remain the existing In Progress,
Delivered and Delivery Issue mappings. Existing Admin operation/internal/activity
listeners and Customer projection listeners receive those committed updates.
No component writes authoritative state. A repeated action fails persisted-state
validation instead of recording a second successful transition.

## Trusted account linking / existing assignments

`apps/functions/scripts/linkAmbassadorAccount.mjs` is a local/operator utility,
not a callable, HTTP endpoint or deployed export. It uses Application Default
Credentials, requires explicit project plus matching confirmation, and verifies
the existing Auth user is enabled and has `role: "ambassador"`. It does not
grant roles, create users, reset passwords or authorize by email. Provision the
Auth identity/claim separately through your trusted administrative process.

It links an existing roster record without changing its ID, atomically records
the UID-keyed account lookup, rejects link replacement and duplicate UID links,
and refreshes existing assignments in
bounded pages. Each operation is re-read transactionally to handle concurrent
Admin reassignment. Previously missing UID links get a system audit entry;
reruns repair projections without duplicating link activity. If interrupted,
rerun with the same arguments. Do not edit generated `lib` files. Build first.

Run manually from repository root, replacing both project values and IDs:

```text
node apps/functions/scripts/linkAmbassadorAccount.mjs --project <project-id> --confirm-project <same-project-id> --ambassador <roster-id> --uid <existing-auth-uid>
```

Use an appropriately privileged operator's ADC credentials. If using a service
account file, keep it outside the repository and point ADC at it; never commit
credentials. Project selection is checked explicitly. Identity corrections after
linking require a separate reviewed migration; this utility intentionally refuses
to silently transfer an account's historical access.

## UI, mobile and data modes

Visual references: `apps/web/src/pages/HomePage.tsx`, public `src/styles/main.css`,
`apps/customer/src/styles/customer.css`, Customer shell/login, and current
`apps/admin/src/styles/restored-ui.css`. Local CSS mirrors the private portal's
`#080808` background, `#101010` surfaces, `#f0eee8` text, `#dad5c9` bone,
`#a09e98` secondary text, `#292827` borders and restrained `#ba2929` crimson.
Inter, Space Grotesk and Space Mono remain the typography system. No gradients,
gold palette, new icon dependency or app-global stylesheet coupling is added.
Desktop compact sidebar becomes visible three-link navigation on phones; cards
never require a horizontal table. Controls have 46px minimum touch targets,
visible keyboard focus and native modal focus management. Recipient contact and
location are prominent. Calendar dates are formatted as strings, not UTC Dates.
Read-only recorded timestamps use local display formatting.

Firebase is the production default. `VITE_DATA_SOURCE=mock` works only in Vite
development mode. Mock mode still requires real ambassador Firebase Auth, uses
UID-separated synthetic in-memory records and never calls backend writes.
Reload resets demonstration data; cross-app mock synchronization is not claimed.
React uses one repository interface, with no mock/Firebase branch in pages.

Listeners clean up on route/account change and retry. Errors clear displayed
records, and cache-only snapshots hide delivery data until server access is
verified; offline delivery work is intentionally unsupported. Reassignment while
detail is open yields a safe unavailable/error state and removes action controls.
Native confirmation dialogs block duplicate submits. An uncertain network result
asks the ambassador to inspect the latest status before retrying.

## Static security review (not executed tests)

- Unauthenticated and wrong-role list/get: denied by the new role condition.
- Unscoped query or another UID filter: cannot satisfy UID ownership rules.
- Another ambassador's detail: denied; UI clears records on listener failure.
- Create/update/delete, ownership hijack, schema pollution, oversized client
  writes, timestamp manipulation and direct lifecycle edits: all new browser
  writes are denied, including subcollections by the existing default deny.
- Claim/roster spoofing: no browser claim writer or roster write permission.
- Privileged endpoint calls: role checked before data; assignment verified from
  persisted operation and roster. Unsupported actions/fields are rejected.
- Lifecycle replay/race: transactional current-state validation; all successful
  effects commit together. Reassignment touches the same operation record.
- Failure data leak: reasons only enter operationInternal and admin-only activity.
- Old-owner access: atomic projection replacement/removal; no old-owner copy.
- New query/index shape: equality UID + descending updatedAt + bounded limit;
  detail ownership uses the document's assigned UID. The account/roster lookup
  paths are fixed for the authenticated UID and cached across query results.
- No new `any`, TS suppression, Firebase Admin imports in browser, direct browser
  authoritative writes or email-based authorization were intended.

These are static reasoning checks only. Emulator/device verification remains
required before exposing recipient details to real ambassador accounts. The
legacy Admin boolean-only rule path was removed to align with strict role-based
authorization. Existing Auth mechanics were not replaced.

Security-rules-auditor assessment (static, not an executed emulator audit):

```json
{
  "score": 4,
  "summary": "Strict role and assigned-UID reads; all new browser writes denied. Legacy boolean Admin bypass corrected. Runtime verification is still required.",
  "findings": [
    {
      "check": "Business Logic vs. Rules",
      "severity": "minor",
      "issue": "Rules/query behavior and deployed identity provisioning have only been reviewed statically.",
      "recommendation": "Run the two-account ownership, reassignment, inactive-roster and wrong-role checks before real recipient data is exposed."
    }
  ]
}
```

## Manual verification and deployment

No install/build/test/Firebase/Git commands were run for this milestone.

```text
npm install
npm run typecheck
npm run lint
npm run build
npm run dev:ambassador
```

Copy `apps/ambassador/.env.example` to an uncommitted `apps/ambassador/.env.local`
and fill only public Firebase web config for the existing project. Port 3003
is fixed with strictPort; no other app port or ngrok security setting changes.
`npm install` updates the lockfile/workspace links; it was not edited manually.

Deploy trusted writers before linking accounts. Based on current firebase.json:

```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT="30"
firebase deploy --only functions --project secret-service-37f6b
firebase deploy --only firestore:rules,firestore:indexes --project secret-service-37f6b
```

Wait for the index to finish building. Link the intended existing roster/Auth
accounts with the utility above, then sign out and back in after role changes.
No Hosting target/site or deployment is created; hosting the separate app is a
deliberate follow-up requiring the target site choice.

Manual checklist:

1. Confirm customer/admin/anonymous users cannot open protected ambassador pages
   or call the ambassador transition. A legacy boolean ambassador claim alone
   must not grant access.
2. Link two distinct accounts and rosters. Assign a READY_FOR_DELIVERY operation
   to A; verify it appears live only for A, including direct-detail access checks.
3. Start delivery as A. Confirm Admin sees OUT_FOR_DELIVERY and Customer sees
   In Progress. Mark delivered and verify Delivered; COMPLETED remains Admin-only.
4. Reassign a still-assigned operation A→B while A has detail open. Confirm A
   loses access/actions and B gains it. Attempt A's stale action directly.
5. Report failure with blank/oversized reason (reject), then valid reason. Verify
   Admin audit/internal details, Customer-safe Delivery Issue, and no reason leak.
   Admin retry should remove the old assignment and projection.
6. Deactivate roster or revoke claim; verify access is denied after token refresh,
   and active roster checks reject commands. Test network loss, retry, double-click,
   already-delivered action and concurrent Admin actions.
7. Verify loading/no assignments/no matches/detail not found states, 50–200 history
   loading, phone layout, keyboard-only modal use, focus return and sign-out errors.
8. Confirm package pricing/payment/moderation/staff fields cannot be read through
   the projection and direct operations/roster/activity browser reads are denied.
9. Verify old unlinked Admin assignments still work, then link/backfill them.
   Test interrupted utility rerun and mismatched project/link rejection.

## Limits / deliberately deferred

No offline delivery mode, historical access after reassignment, inferred missing
assignment timestamps, lifetime analytics, self-service account linkage, signup,
profile editing, GPS/maps, route optimization, messaging, uploads, OTP/signatures,
notifications, payouts, payroll, ratings, self-assignment or scheduling platform.
No Payments, Moderation, Settings, Customer completion or unrelated Admin UI work.

## File inventory

Created:

```text
apps/ambassador/
  .env.example
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  src/App.tsx
  src/main.tsx
  src/types.ts
  src/presentation.ts
  src/auth/authContext.ts
  src/auth/AmbassadorAuthProvider.tsx
  src/auth/AmbassadorAuthGuard.tsx
  src/components/Shell.tsx
  src/components/DeliveryCard.tsx
  src/components/LoadState.tsx
  src/components/ActionDialog.tsx
  src/data/repository.ts
  src/data/operationMapper.ts
  src/data/mockRepository.ts
  src/hooks/useAssignments.ts
  src/pages/LoginPage.tsx
  src/pages/DashboardPage.tsx
  src/pages/OperationsPage.tsx
  src/pages/OperationDetailPage.tsx
  src/pages/AccountPage.tsx
  src/styles/ambassador.css
apps/functions/src/commands/ambassadorTransitionOperation.ts
apps/functions/src/projection/ambassadorOperationProjection.ts
apps/functions/scripts/linkAmbassadorAccount.mjs
AMBASSADOR_DASHBOARD_MILESTONE.md
```

Modified:

```text
package.json
firestore.rules
firestore.indexes.json
packages/firebase/src/firestore/documents.ts
apps/functions/src/domain/operationTypes.ts
apps/functions/src/domain/operationWorkflow.ts
apps/functions/src/commands/assignAmbassador.ts
apps/functions/src/commands/transitionOperation.ts
apps/functions/src/commands/saveAmbassador.ts
apps/functions/src/index.ts
```

No current Admin, Customer or public UI files, generated Functions output, lockfile,
payment provider code, Firebase initialization or Hosting targets were edited.
## Operator provisioning: Ambassador Auth role

The operator-only `apps/functions/scripts/ambassadorClaims.mjs` grants or revokes the trusted `role: "ambassador"` custom claim on an **existing** Firebase Auth user selected by email. It is not a deployed Function or a browser API. It uses only Firebase Admin and Application Default Credentials (ADC); it does not require compiled Functions output itself.

### Complete provisioning sequence

1. Create an enabled Firebase Auth user through the approved trusted account-creation process in the intended project. This script does not create users or passwords. Obtain the user's UID and the existing Admin-managed ambassador roster ID.
2. Configure operator ADC with permission to manage Firebase Auth in the intended project. The later linking step also needs appropriate Firestore access. Firebase CLI login alone is not this utility's credential strategy. Never commit credentials or service-account files.
3. Grant the role using the user's email:

   ```powershell
   node apps/functions/scripts/ambassadorClaims.mjs grant --email "<ambassador-email>" --project secret-service-37f6b --confirm-project secret-service-37f6b
   ```

4. After the Functions build is current and the updated assignment writers have been deployed, link the Auth UID to the existing roster record:

   ```powershell
   node apps/functions/scripts/linkAmbassadorAccount.mjs --project secret-service-37f6b --confirm-project secret-service-37f6b --ambassador "<roster-id>" --uid "<firebase-auth-uid>"
   ```

5. Sign out and sign back in to refresh the Firebase ID token.
6. Log into the Ambassador Dashboard. The roster must be active, and linked assignments/projections must exist for work to appear.

### CLI and safeguards

```text
node apps/functions/scripts/ambassadorClaims.mjs <grant|revoke> --email <email> --project <project-id> --confirm-project <same-project-id>
```

Email is the only identity selector; there is no UID selector or force flag. The script preserves unrelated existing custom claims. Grant refuses `role: "admin"`, legacy `admin: true`, any other existing non-Ambassador role (including `customer`), and disabled users. It never silently converts an account belonging to another role. Granting an existing Ambassador role is a no-op.

Both project flags must match, and the initialized Admin app must target that project. An operator must still independently verify the project: repeating the same wrong project ID cannot be detected automatically. Use least-privilege credentials scoped to the intended project. Do not run concurrent custom-claim writers for the same user: the Auth claims API replaces the claims object and does not offer a transaction for the read/merge/write sequence.

### Revocation

```powershell
node apps/functions/scripts/ambassadorClaims.mjs revoke --email "<ambassador-email>" --project secret-service-37f6b --confirm-project secret-service-37f6b
```

Revocation deletes `role` **only** when it equals `ambassador`; other roles and unrelated claims are preserved. It does not disable the user, change passwords/email, delete roster records, unlink `ambassadorAccounts`, or modify Firestore. Existing ID tokens are not invalidated immediately; authorization reflects the removed claim after token refresh/expiry. For immediate operational suspension, use the existing trusted roster-deactivation process as well. Do not treat this utility as an immediate session-revocation mechanism.

### Manual verification

No verification commands were executed as part of this addition. From the repository root, run:

```powershell
npm run typecheck
npm run lint
npm run build
```

The build is required before using `linkAmbassadorAccount.mjs`, which imports compiled Functions helpers. The new claim utility is not exported from the deployed Functions index and requires no deployment itself.
