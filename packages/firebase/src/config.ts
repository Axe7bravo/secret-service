export interface FirebaseWebConfig { apiKey:string;authDomain:string;projectId:string;storageBucket:string;messagingSenderId:string;appId:string }
const env=(import.meta as ImportMeta&{env:Record<string,string|boolean|undefined>}).env;
const readString=(key:string):string|undefined=>{const value=env[key];return typeof value==='string'?value:undefined};
const entries={apiKey:readString('VITE_FIREBASE_API_KEY'),authDomain:readString('VITE_FIREBASE_AUTH_DOMAIN'),projectId:readString('VITE_FIREBASE_PROJECT_ID'),storageBucket:readString('VITE_FIREBASE_STORAGE_BUCKET'),messagingSenderId:readString('VITE_FIREBASE_MESSAGING_SENDER_ID'),appId:readString('VITE_FIREBASE_APP_ID')};
const missing=Object.entries(entries).filter(([,value])=>!value?.trim()).map(([key])=>key);
export const firebaseConfigurationError=missing.length?`Firebase is not configured. Missing: ${missing.join(', ')}.`:null;
export const getFirebaseWebConfig=():FirebaseWebConfig=>{if(firebaseConfigurationError)throw new Error(firebaseConfigurationError);return entries as FirebaseWebConfig};
