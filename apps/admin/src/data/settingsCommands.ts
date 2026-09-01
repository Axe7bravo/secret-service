import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src';
import type { OperationalSettingsDraft } from '../types/settings';
import { adminWriteMode } from './adminOperationCommands';
import { updateMockSettings } from './settingsRepository';

export interface AdminSettingsCommands{save(draft:OperationalSettingsDraft):Promise<void>}
const safeError=(error:unknown)=>{const code=typeof error==='object'&&error&&'code'in error?String(error.code):'';if(code.includes('unauthenticated'))return new Error('Sign in again before saving settings.');if(code.includes('permission-denied'))return new Error('This account cannot manage operational settings.');if(code.includes('invalid-argument'))return new Error('Review the settings values and try again.');return new Error('Operational settings could not be saved.')};
const firebaseCommands:AdminSettingsCommands={async save(draft){try{await httpsCallable(getFirebaseFunctions(),'saveAdminSettings')(draft)}catch(error){throw safeError(error)}}};
const mockCommands:AdminSettingsCommands={async save(draft){updateMockSettings(draft)}};
export const adminSettingsCommands=adminWriteMode==='firebase'?firebaseCommands:mockCommands;
