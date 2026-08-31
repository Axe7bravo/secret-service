# Admin custom-claim provisioning

Secret Service authorizes administrators with the trusted Firebase Authentication custom claim:

```json
{
  "role": "admin"
}
```

The operator utility at `scripts/adminClaims.mjs` uses only the Firebase Admin SDK. It is a local server-side script: it is not exported from the Functions index, deployed as a callable or HTTP function, or exposed to either frontend.

## Credentials and project safety

Run the utility from `apps/functions` with Application Default Credentials belonging to a trusted operator. For local use, authenticate Application Default Credentials through your approved Google Cloud workflow or set `GOOGLE_APPLICATION_CREDENTIALS` outside the repository to the path of an authorized service-account file. Never commit credentials, service-account JSON, passwords, API keys, user identifiers, or project IDs.

Every invocation requires an explicit `--project` value. The Admin SDK is initialized with that project ID, and the script refuses to continue if the initialized app does not report the same project. Check the project ID carefully before confirming an operator action.

## Grant admin

From `apps/functions`, run:

```text
node scripts/adminClaims.mjs grant --email admin@example.com --project your-firebase-project-id
```

Replace both example values. The utility finds the existing Firebase Authentication user by email, preserves all current custom claims, and sets `role` to `admin`.

## Revoke admin

From `apps/functions`, run:

```text
node scripts/adminClaims.mjs revoke --email admin@example.com --project your-firebase-project-id
```

Replace both example values. If the user's `role` is `admin`, the utility removes only that property and preserves every unrelated custom claim. It does not clear the user's complete claim set.

## Token refresh

Custom-claim changes are reflected when Firebase issues a new ID token. After either operation, the affected user must sign out and sign back in before testing authorization again.

This utility is intentionally operator-only. Email is used solely to locate the Firebase Authentication record; application authorization continues to depend on the trusted `role: "admin"` custom claim and never on an email allowlist.
