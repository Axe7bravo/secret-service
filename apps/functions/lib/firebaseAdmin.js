import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
export const getAdminApp = () => {
    const defaultApp = getApps().find(app => app.name === '[DEFAULT]');
    return defaultApp ?? initializeApp();
};
export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminFirestore = () => getFirestore(getAdminApp());
