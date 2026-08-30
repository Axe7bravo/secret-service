import { getApp,getApps,initializeApp,type FirebaseApp } from 'firebase/app';import { browserLocalPersistence,getAuth,setPersistence,type Auth } from 'firebase/auth';import { getFirebaseWebConfig } from './config';
let persistenceConfigured=false;
export const getFirebaseApp=():FirebaseApp=>getApps().length?getApp():initializeApp(getFirebaseWebConfig());
export const getFirebaseAuth=():Auth=>{const auth=getAuth(getFirebaseApp());if(!persistenceConfigured){persistenceConfigured=true;void setPersistence(auth,browserLocalPersistence)}return auth};
