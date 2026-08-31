# Operation Creation Milestone

## Architecture

Authenticated customers initiate an operation from the protected customer route `/operations/new`. The React form sends an allowlisted command input through the customer operation command repository. In Firebase mode that repository invokes the trusted `createOperation` callable. The browser never writes an authoritative Firestore document.

The callable obtains ownership from the verified Firebase callable auth context, validates and normalizes the request, resolves package display data and price from its server catalogue, assigns the initial lifecycle and payment state, and commits all related documents in one Firestore transaction.

## Customer creation flow

1. The existing customer auth guard protects the route.
2. The customer selects one of the supported Campus Edition packages and enters recipient, message, and requested-delivery information.
3. Client validation provides immediate usability feedback; it is not treated as a security boundary.
4. The customer repository invokes the trusted callable without a customer UID, price, status, moderation data, timestamps, or internal metadata.
5. The backend uses `request.auth.uid`, validates every accepted field, and creates the operation atomically.
6. After success, the UI navigates to `/operations/{operationId}`. Firestore-backed customer screens reload from `customerOperations`; mock mode inserts a deterministic local projection first.

## Backend trust boundary

The backend rejects unauthenticated calls and unsupported package identifiers. It trims expected strings, validates required fields, validates the requested-date shape, and applies bounded storage lengths. Package names and prices are never accepted from the browser. Operation IDs and timestamps are generated server-side.

The customer cannot select status, payment state, moderation state, assignment, internal notes, safety flags, activity metadata, or ownership. Email is not used for authorization.

## Collection writes

The callable transaction creates:

- `operations/{operationId}` — authoritative operation owned by the verified UID.
- `operationInternal/{operationId}` — pending moderation, zero delivery retries, and an empty safety-flag list.
- `customerOperations/{operationId}` — allowlisted customer-safe read projection.
- `operationActivity/{activityId}` — initial `OPERATION_CREATED` audit event attributed to the authenticated customer.

The initial authoritative status is `PAYMENT_PENDING`, with payment summary status `PENDING`. Payments and lifecycle advancement are intentionally not implemented here. Existing admin workflow commands remain responsible for trusted transitions.

## Customer-safe projection

The existing projection builder explicitly selects operation ID, owner UID, package name and amount, customer-safe mapped status, recipient name/campus/residence, requested delivery date/window/location, anonymous message, customer-safe payment summary, tracking status/timestamp, and creation/update timestamps.

It omits recipient phone, delivery instructions, moderation records, safety flags, staff notes, ambassador assignment/contact details, internal failure reasons, and privileged activity information. Customers continue reading only `customerOperations`.

## Repository boundary

React components call `customerOperationCommands.createOperation(input)` and do not know callable configuration details. `VITE_DATA_SOURCE=firestore` selects the callable implementation. Mock mode creates a predictable `SS-MOCK-####` operation and inserts it into the existing in-memory customer repository. Read screens use the existing repository selector for both modes.

## Validation

The form requires a supported package, recipient name and contact, campus, residence/building, precise delivery location, anonymous message, requested date, and requested window. Delivery instructions are optional. The callable repeats authoritative validation and normalization and does not trust the form.

## Security considerations

Firestore rules were not loosened. Browser writes to `operations`, `operationInternal`, `operationActivity`, and `customerOperations` remain denied. Customer projection reads remain owner-scoped by `request.auth.uid`. The Admin SDK callable is the only creation authority.

## Files changed

- `apps/functions/src/auth/requireAuthenticatedCustomer.ts`
- `apps/functions/src/commands/createOperation.ts`
- `apps/customer/src/types/operationCreation.ts`
- `apps/customer/src/data/customerOperationCommands.ts`
- `apps/customer/src/data/customerOperationsRepository.ts`
- `apps/customer/src/hooks/useCustomerOperations.ts`
- `apps/customer/src/pages/CustomerNewOperationPage.tsx`
- `apps/customer/src/pages/CustomerDashboardPage.tsx`
- `apps/customer/src/pages/CustomerOperationsPage.tsx`
- `apps/customer/src/pages/CustomerOperationDetailPage.tsx`
- `apps/customer/src/components/CustomerShell.tsx`
- `apps/customer/src/styles/operation-creation.css`
- `apps/customer/src/App.tsx`
- `apps/customer/src/main.tsx`
- `apps/admin/src/data/adminOperationCommands.ts`
- `packages/config/src/index.ts`
- `packages/firebase/src/firestore/documents.ts`
- `OPERATION_CREATION_MILESTONE.md`

## Intentionally deferred

Payments, checkout, refunds, notifications, email/SMS, uploads, ambassador tooling, recipient messaging, QR responses, promo codes, analytics, cancellation controls, and deployment are out of scope.

## Manual verification

Run the repository typecheck, lint, and build commands. In mock mode, submit each supported package and confirm the new operation opens and appears first in My Operations. In Firebase mode, authenticate as a customer, submit once, and confirm the four documents are created with the same operation ID where applicable; confirm the customer can read only their projection and the admin can read the authoritative operation. Verify unauthenticated callable invocation fails and direct client writes remain denied.
