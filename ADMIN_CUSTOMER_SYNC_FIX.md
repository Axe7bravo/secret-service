# Admin to Customer Synchronization Fix

## Root cause

Admin repository reads were selected by `VITE_DATA_SOURCE`, but workflow writes were independently selected by `VITE_OPERATION_WRITE_MODE`. This allowed the Admin UI to read one data source and approve into another. Because Admin and Customer are separate browser applications, their mock repositories and session storage are also isolated by origin and cannot provide an end-to-end synchronized workflow.

Admin reads and writes now share `VITE_DATA_SOURCE`. All dependent admin commands—including operation transitions—therefore use Firebase whenever the admin repository uses Firestore, and use mock commands whenever it uses mock data. Both app top bars display `FIREBASE DATA` or `MOCK DATA` so an environment mismatch is visible.

## Verified projection path

The trusted approval command computes a final `OperationRecord` with `status: PAYMENT_PENDING`, `paymentSummary.status: PENDING`, preserved `customerId`, and the existing operation ID. It builds `customerOperations/{operationId}` from that final object inside the same transaction and preserves `archived` and `archivedAt` from the previous projection.

The customer Firestore repository subscribes with `onSnapshot` to `customerOperations`, constrained by `customerId == authenticated UID`. The mapper translates customer projection `PAYMENT_REQUIRED` to customer operation `PAYMENT_PENDING`. Operation Detail derives its record from this live list and exposes Pay now only when both operation status and payment summary are pending.

## End-to-end Firebase configuration

Set the following non-secret Vite mode value for both applications:

`VITE_DATA_SOURCE=firestore`

Restart both dev servers after changing environment configuration. The admin account must have the trusted `role: admin` custom claim, and the customer must be signed in as the UID stored on the operation and projection.

Mock mode remains suitable for isolated UI work only. Cross-origin Admin → Customer synchronization requires Firebase mode.
