import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAdmin } from '../auth/requireAdmin.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
const required = (value, label, max) => { if (typeof value !== 'string' || !value.trim())
    throw new HttpsError('invalid-argument', `${label} is required.`); const result = value.trim(); if (result.length > max)
    throw new HttpsError('invalid-argument', `${label} is too long.`); return result; };
const parse = (value) => { if (typeof value !== 'object' || value === null)
    throw new HttpsError('invalid-argument', 'Campus data is required.'); const input = value; const code = required(input.code, 'Campus code', 64).toLowerCase(); if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code))
    throw new HttpsError('invalid-argument', 'Campus code must use lowercase letters, numbers, and single hyphens.'); if (typeof input.active !== 'boolean' || typeof input.displayOrder !== 'number' || !Number.isInteger(input.displayOrder) || input.displayOrder < 0)
    throw new HttpsError('invalid-argument', 'Campus state or display order is invalid.'); return { ...(typeof input.campusId === 'string' && input.campusId.trim() ? { campusId: input.campusId.trim() } : {}), code, name: required(input.name, 'Campus name', 160), city: required(input.city, 'City', 120), active: input.active, ...(typeof input.serviceNotes === 'string' && input.serviceNotes.trim() ? { serviceNotes: required(input.serviceNotes, 'Service notes', 1000) } : {}), displayOrder: input.displayOrder }; };
export const saveCampus = onCall(async (request) => { requireAdmin(request); const input = parse(request.data); const db = getAdminFirestore(); const ref = db.collection('campuses').doc(input.campusId ?? input.code); const now = Timestamp.now(); await db.runTransaction(async (transaction) => { const snapshot = await transaction.get(ref); if (input.campusId && !snapshot.exists)
    throw new HttpsError('not-found', 'Campus no longer exists.'); if (!input.campusId && snapshot.exists)
    throw new HttpsError('already-exists', 'A campus with that code already exists.'); const existing = snapshot.exists ? snapshot.data() : undefined; if (existing && existing.code !== input.code)
    throw new HttpsError('failed-precondition', 'Campus code is immutable.'); const record = { campusId: ref.id, code: input.code, name: input.name, city: input.city, active: input.active, ...(input.serviceNotes ? { serviceNotes: input.serviceNotes } : {}), displayOrder: input.displayOrder, createdAt: existing?.createdAt ?? now, updatedAt: now }; transaction.set(ref, record); }); return { campusId: ref.id }; });
