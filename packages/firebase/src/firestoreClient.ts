import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFirebaseApp } from './client';

let firestore: Firestore | undefined;
export const getFirebaseFirestore = (): Firestore => {
  firestore ??= getFirestore(getFirebaseApp());
  return firestore;
};
