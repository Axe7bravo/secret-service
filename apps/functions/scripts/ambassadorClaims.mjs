import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Local operator utility only. Never export this from the Functions index.
const usage = 'Usage: node apps/functions/scripts/ambassadorClaims.mjs <grant|revoke> --email <email> --project <project-id> --confirm-project <same-project-id>';
const [action, ...args] = process.argv.slice(2);
const flags = ['--email', '--project', '--confirm-project'];
if (!['grant', 'revoke'].includes(action) || args.length !== 6
  || args.some((value, index) => index % 2 === 0 && !flags.includes(value))) {
  throw new Error(usage);
}
const option = name => {
  if (args.filter(value => value === name).length !== 1) throw new Error(usage);
  const value = args[args.indexOf(name) + 1];
  if (!value || value.startsWith('--') || value !== value.trim()) throw new Error(`Invalid ${name}. ${usage}`);
  return value;
};

const email = option('--email');
const projectId = option('--project');
if (projectId !== option('--confirm-project')) throw new Error('Project confirmation does not match. No claims were changed.');

const app = getApps().find(item => item.name === '[DEFAULT]')
  ?? initializeApp({ credential: applicationDefault(), projectId });
if (app.options.projectId !== projectId) throw new Error('Initialized project differs from the explicit target. No claims were changed.');

const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
const claims = { ...user.customClaims };

if (action === 'grant') {
  if (claims.role === 'admin' || claims.admin === true) {
    throw new Error('Refusing to grant Ambassador access to an Admin account. Use a separate operational account. No claims were changed.');
  }
  if (claims.role !== undefined && claims.role !== 'ambassador') {
    throw new Error('Refusing to replace an existing non-Ambassador role. Resolve the account role separately through an approved operator process. No claims were changed.');
  }
  if (user.disabled) throw new Error('Target Auth user is disabled. No claims were changed.');
  if (claims.role !== 'ambassador') {
    await auth.setCustomUserClaims(user.uid, { ...claims, role: 'ambassador' });
  }
  console.log(`Ambassador role confirmed for UID ${user.uid} in project ${projectId}.`);
} else if (claims.role === 'ambassador') {
  delete claims.role;
  await auth.setCustomUserClaims(user.uid, claims);
  console.log(`Ambassador role removed for UID ${user.uid} in project ${projectId}.`);
} else {
  console.log(`No Ambassador role to revoke for UID ${user.uid} in project ${projectId}; no claims were changed.`);
}

console.log('No users, passwords, emails, roster records, account mappings, or Firestore data were changed.');
console.log('Sign out and back in to refresh the ID token. Existing ID tokens are not revoked by this utility.');
