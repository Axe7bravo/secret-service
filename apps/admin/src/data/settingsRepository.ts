import { DEFAULT_CUSTOMER_OPERATIONAL_SETTINGS } from '@secret-service/config';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src';
import type { AdminOperationalSettings,OperationalSettingsDraft } from '../types/settings';
import { adminDataMode } from './adminReadRepository';

const STORAGE_KEY='secret-service-admin-mock-settings-v1';
const defaults=():AdminOperationalSettings=>({...DEFAULT_CUSTOMER_OPERATIONAL_SETTINGS,deliveryWindows:[...DEFAULT_CUSTOMER_OPERATIONAL_SETTINGS.deliveryWindows],updatedAt:null,updatedBy:null});
let mockSettings:AdminOperationalSettings=(()=>{try{const value=sessionStorage.getItem(STORAGE_KEY);return value?JSON.parse(value) as AdminOperationalSettings:defaults()}catch{return defaults()}})();
export const updateMockSettings=(draft:OperationalSettingsDraft)=>{mockSettings={...draft,deliveryWindows:[...draft.deliveryWindows],updatedAt:new Date().toISOString(),updatedBy:'Mock Admin'};try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(mockSettings))}catch{return mockSettings}return mockSettings};
export interface AdminSettingsRepository{load():Promise<AdminOperationalSettings>}
const mockRepository:AdminSettingsRepository={async load(){return{...mockSettings,deliveryWindows:[...mockSettings.deliveryWindows]}}};
const firebaseRepository:AdminSettingsRepository={async load(){const callable=httpsCallable<Record<string,never>,AdminOperationalSettings>(getFirebaseFunctions(),'getAdminSettings');return(await callable({})).data}};
export const adminSettingsRepository=adminDataMode==='firestore'?firebaseRepository:mockRepository;
