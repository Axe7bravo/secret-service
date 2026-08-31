import { mockAmbassadors } from './mockAmbassadors';
export interface AvailableAmbassador{id:string;name:string;campus:string}
export interface AmbassadorRepository{listAvailable():readonly AvailableAmbassador[]}
export const ambassadorRepository:AmbassadorRepository={listAvailable:()=>mockAmbassadors};
