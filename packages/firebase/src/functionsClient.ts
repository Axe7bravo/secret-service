import { getFunctions,type Functions } from 'firebase/functions';
import { getFirebaseApp } from './client';
let functionsClient:Functions|undefined;
export const getFirebaseFunctions=():Functions=>{functionsClient??=getFunctions(getFirebaseApp());return functionsClient};
