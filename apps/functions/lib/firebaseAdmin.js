import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
export const getAdminApp = () => {
    const defaultAppExists = getApps().some(app => app.name === '[DEFAULT]');
    return defaultAppExists ? getApp() : initializeApp();
};
export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminFirestore = () => getFirestore(getAdminApp());
