import type { DispatchInput, DispatchResult } from '@secret-service/types';
const mockKey='secret-service-mock-db';
function mockAdd(input:DispatchInput):Promise<DispatchResult>{return new Promise(resolve=>setTimeout(()=>{const all=JSON.parse(localStorage.getItem(mockKey)??'{}') as Record<string,unknown[]>;const id=`DISPATCH_${Math.random().toString(36).slice(2,10).toUpperCase()}`;const doc={id,created_at:new Date().toISOString(),...input};all.dispatches=[...(all.dispatches??[]),doc];localStorage.setItem(mockKey,JSON.stringify(all));console.info('[Firebase Mock] Dispatch staged:',id);resolve({id})},1500))}
export async function createDispatch(input:DispatchInput):Promise<DispatchResult>{
  if((import.meta.env.VITE_FIREBASE_MODE??'mock')==='mock')return mockAdd(input);
  const [{initializeApp,getApps},{addDoc,collection,getFirestore,serverTimestamp}]=await Promise.all([import('firebase/app'),import('firebase/firestore')]);
  const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID,measurementId:import.meta.env.VITE_FIREBASE_MEASUREMENT_ID};
  if(!config.apiKey||!config.projectId)throw new Error('Firebase is not configured for real mode.');
  const app=getApps()[0]??initializeApp(config);const result=await addDoc(collection(getFirestore(app),'dispatches'),{...input,created_at:serverTimestamp()});return{id:result.id};
}
export function encodePayload(value:string){return btoa(String.fromCharCode(...new TextEncoder().encode(value)))}
