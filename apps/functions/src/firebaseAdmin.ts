import { getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export const getAdminApp = (): App => getApps().length ? getApp() : initializeApp();
export const getAdminAuth = (): Auth => getAuth(getAdminApp());
export const getAdminFirestore = (): Firestore => getFirestore(getAdminApp());
