import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '../lib/firebaseAdmin.js';
import { writeAmbassadorOperationProjection } from '../lib/projection/ambassadorOperationProjection.js';

// Operator-only, never imported by the deployed Functions index. Build first.
const args = process.argv.slice(2);
const flags = ['--project', '--confirm-project', '--ambassador', '--uid'];
if (args.length !== 8 || args.some((value, index) => index % 2 === 0 && !flags.includes(value))) throw new Error('Usage: node scripts/linkAmbassadorAccount.mjs --project <id> --confirm-project <same-id> --ambassador <roster-id> --uid <auth-uid>');
const option = name => {
  if (args.filter(value => value === name).length !== 1) throw new Error(`Supply ${name} exactly once.`);
  const value = args[args.indexOf(name) + 1];
  if (!value || value.startsWith('--') || value !== value.trim()) throw new Error(`Invalid ${name}.`);
  return value;
};
const projectId = option('--project');
const ambassadorId = option('--ambassador');
const uid = option('--uid');
if (projectId !== option('--confirm-project')) throw new Error('Project confirmation does not match.');
if (!/^[A-Za-z0-9_-]{1,128}$/.test(ambassadorId) || !uid || uid.length > 128 || uid.includes('/')) throw new Error('Invalid roster ID or Auth UID.');
const app = getApps().find(item => item.name === '[DEFAULT]') ?? initializeApp({ credential: applicationDefault(), projectId });
if (app.options.projectId !== projectId) throw new Error('Initialized project differs from the explicit target.');
const user = await getAdminAuth().getUser(uid);
if (user.disabled || user.customClaims?.role !== 'ambassador') throw new Error('Target must be an enabled Firebase Auth user with role="ambassador". No claims were changed.');
const db = getAdminFirestore();
const rosterRef = db.collection('ambassadors').doc(ambassadorId);
// Fixed UID-keyed lookup for rule evaluation and race-safe one-account linking.
const accountRef = db.collection('ambassadorAccounts').doc(uid);
await db.runTransaction(async transaction => {
  const [roster, duplicates, account] = await Promise.all([
    transaction.get(rosterRef),
    transaction.get(db.collection('ambassadors').where('authUid', '==', uid).limit(2)),
    transaction.get(accountRef),
  ]);
  if (!roster.exists) throw new Error('Roster record does not exist.');
  if (roster.data().authUid && roster.data().authUid !== uid) throw new Error('Refusing to replace an existing account link.');
  if (duplicates.docs.some(item => item.id !== ambassadorId)) throw new Error('This UID is already linked to another roster record.');
  if (account.exists && account.data().ambassadorId !== ambassadorId) throw new Error('This UID already has a different operational account link.');
  transaction.update(rosterRef, { authUid: uid, updatedAt: Timestamp.now() });
  transaction.set(accountRef, { ambassadorId });
});

// Repair existing assignments in bounded pages. Re-read each assignment in a
// transaction so concurrent Admin reassignment cannot give the wrong user access.
let cursor;
let updated = 0;
while (true) {
  const base = db.collection('operations').where('delivery.assignedAmbassadorId', '==', ambassadorId).limit(100);
  const page = await (cursor ? base.startAfter(cursor) : base).get();
  if (page.empty) break;
  for (const item of page.docs) {
    const changed = await db.runTransaction(async transaction => {
      const [snapshot, roster] = await Promise.all([transaction.get(item.ref), transaction.get(rosterRef)]);
      const operation = snapshot.data();
      if (!operation || operation.delivery.assignedAmbassadorId !== ambassadorId) return false;
      if (roster.data()?.authUid !== uid) throw new Error('Account link changed during provisioning.');
      if (operation.delivery.assignedAmbassadorUid && operation.delivery.assignedAmbassadorUid !== uid) throw new Error('Existing assignment UID conflicts; manual review required.');
      const next = { ...operation, delivery: { ...operation.delivery, assignedAmbassadorUid: uid } };
      if (!operation.delivery.assignedAmbassadorUid) {
        transaction.update(item.ref, { delivery: next.delivery });
        transaction.create(db.collection('operationActivity').doc(), {
          operationId: item.id, type: 'AMBASSADOR_ACCOUNT_LINKED', timestamp: Timestamp.now(),
          actorId: 'trusted-operator', actorRole: 'SYSTEM', toStatus: operation.status,
          note: 'Existing roster assignment linked to its authenticated ambassador account.',
        });
      }
      writeAmbassadorOperationProjection(transaction, db, next);
      return true;
    });
    if (changed) updated += 1;
  }
  cursor = page.docs.at(-1);
}
console.log(`Linked roster ${ambassadorId} in ${projectId}; refreshed ${updated} assignment projections.`);
console.log('No Auth claims or passwords were changed. Sign out and back in after any separately provisioned claim changes.');
