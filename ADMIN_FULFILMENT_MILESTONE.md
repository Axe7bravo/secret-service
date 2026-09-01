# Admin Fulfilment Milestone

## Deliveries architecture

Deliveries is a focused queue over the existing authoritative `operations` collection. It does not introduce another lifecycle or delivery record. The queue includes `READY_FOR_DELIVERY`, `AMBASSADOR_ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED`, and `DELIVERY_FAILED`, with search and state filtering.

`/deliveries/:operationId` reuses the existing Operation Detail implementation. Dispatch, failure, retry, delivery, and completion therefore continue through `adminOperationCommands` and the trusted `transitionOperation` callable. Reasons and retry history remain in admin-only `operationActivity` and `operationInternal` data.

Initial assignment and reassignment use the trusted `assignAmbassador` callable. It validates persisted operation state, roster existence, active state, availability, and campus eligibility in a transaction. Initial assignment performs the canonical `READY_FOR_DELIVERY → AMBASSADOR_ASSIGNED` transition. Reassignment is permitted only while already assigned and records a separate authoritative activity event.

## Ambassador architecture

The `ambassadors` collection is the operational roster source of truth. Records contain an ID, display name, optional admin-only phone/email, service campus codes, active state, availability, and server timestamps. No HR, payroll, performance, contract, commission, or timesheet fields are included.

Roster writes use `saveAmbassador`, which requires the trusted admin claim, validates inputs, preserves creation time, and assigns update timestamps server-side. Deactivation uses `active: false`; records are never destructively deleted. Inactive or unavailable ambassadors cannot receive new assignments.

The list provides roster state, availability, service campuses, search, and current assignment counts. Detail pages show the private operational profile and current/related assignments with links to Operation Detail. Historical reassignments remain in each operation's authoritative activity trail.

Ambassador contact information is never included in `customerOperations`. Customers see only the existing safe `DELIVERY_SCHEDULED` state after assignment.

## Campus architecture

The `campuses` collection is a lightweight service-area catalogue. Records contain immutable ID/code identity, name, city, active state, optional admin service notes, display order, and server timestamps. No maps, coordinates, zones, geofencing, routing, or distance pricing were introduced.

Campus writes use `saveCampus`, which requires the trusted admin claim, validates code/name/city/order/state, prevents code mutation and duplicate creation, and uses server timestamps. Deactivation uses `active: false`; campuses are never deleted.

Operations continue storing campus, residence, and delivery-location snapshots. Catalogue renames or deactivation therefore cannot rewrite historical operations. Campus Detail relates operations conservatively by stored campus code/name.

Customer creation retains free-text campus compatibility. When a normalized campus code resolves to a catalogue record, the trusted creation transaction rejects it if inactive. Unknown legacy campus values remain accepted until the Customer Dashboard campus selector is implemented.

## Customer projection and audit behavior

All lifecycle and assignment writes rebuild the existing customer-safe projection in the trusted transaction. Safe status mappings remain unchanged. Ambassador phone/email, internal delivery failure reasons, staff notes, and roster metadata are not projected.

Assignment, reassignment, dispatch, failure, retry, delivery, and completion are recorded through authoritative Functions activity writes. Mock mode maintains local activity only inside the established mock repository.

## Mock and Firebase modes

The fulfilment repository follows the existing data-source boundary. Mock mode provides a small typed ambassador roster and campus catalogue. Firebase mode subscribes to the protected `ambassadors` and `campuses` collections. React components receive domain types rather than raw Firestore SDK records.

Writes follow the existing write-mode boundary. Firebase mode calls trusted Functions; mock mode updates the typed mock repository. No React component directly writes Firestore.

## Firestore rules and indexes

Admin reads were added for `ambassadors` and `campuses`; all browser writes remain denied. Customers receive no roster or campus-management reads. Existing operation, internal, activity, and customer-projection boundaries were not weakened.

No new composite index is required. Ambassador display-name ordering and campus display-order ordering use standard single-field indexes.

## Dashboard integration

The existing metric presentation now separates Ready for Delivery from preparation, and Action Required includes unassigned ready operations and delivery failures. The approved dashboard composition was not redesigned.

## Known MVP limitations

- There is no ambassador-facing application, shift scheduler, or automatic capacity management.
- Availability is an administrator-maintained operational flag.
- Current assignment counts derive from authoritative operation assignment state; full historical assignment lookup remains available through operation activity rather than a separate assignment ledger.
- Campus matching uses normalized stored campus text because existing operations do not carry a stable campus ID snapshot.
- Unknown legacy free-text campuses remain accepted during operation creation for compatibility.
- Delivery scheduling dates are read-only in Admin; no rescheduling command or editable date field currently exists.

## Deferred functionality

Payments, Yoco, Moderation, Settings, Customer Dashboard completion, route optimization, GPS/maps, geofencing, payroll, shifts, messaging, notifications, and deployment remain deferred.

## Manual verification

Run manually from the repository root:

```text
npm run typecheck
npm run lint
npm run build
```

Then verify mock and Firebase modes, claim denial, all list/detail states, active/inactive roster and campus changes, assignment eligibility, reassignment audit history, failure/retry history, projection safety, legacy campus compatibility, responsive tables/dialogs, and that Payments, Moderation, and Settings remain disabled.
