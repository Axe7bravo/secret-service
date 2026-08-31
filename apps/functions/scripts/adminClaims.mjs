import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const usage = `Usage:
  node scripts/adminClaims.mjs grant --email <email> --project <project-id>
  node scripts/adminClaims.mjs revoke --email <email> --project <project-id>`;

function readOption(name) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;

  if (!value || value.startsWith("--")) {
    throw new Error(`Missing required ${name} option.\n\n${usage}`);
  }

  return value;
}

const action = process.argv[2];

if (action !== "grant" && action !== "revoke") {
  throw new Error(`Action must be either "grant" or "revoke".\n\n${usage}`);
}

const email = readOption("--email").trim();
const projectId = readOption("--project").trim();

if (!email || !projectId) {
  throw new Error(`Email and project ID must not be empty.\n\n${usage}`);
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });

if (app.options.projectId !== projectId) {
  throw new Error(
    `Refusing to continue: initialized Firebase project "${app.options.projectId ?? "unknown"}" does not match requested project "${projectId}".`,
  );
}

const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
const existingClaims = user.customClaims ?? {};
const updatedClaims = { ...existingClaims };

if (action === "grant") {
  updatedClaims.role = "admin";
} else if (updatedClaims.role === "admin") {
  delete updatedClaims.role;
}

await auth.setCustomUserClaims(user.uid, updatedClaims);

console.log(
  `${action === "grant" ? "Granted" : "Revoked"} the admin role for ${email} in Firebase project ${projectId}.`,
);
console.log("The user must sign out and sign back in to receive a refreshed ID token.");
