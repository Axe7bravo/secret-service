export type AmbassadorAvailability='AVAILABLE'|'UNAVAILABLE';
export interface AdminAmbassador { ambassadorId:string;displayName:string;phone?:string;email?:string;campusCodes:string[];active:boolean;availability:AmbassadorAvailability;createdAt:string;updatedAt:string }
export interface AmbassadorDraft { ambassadorId?:string;displayName:string;phone?:string;email?:string;campusCodes:string[];active:boolean;availability:AmbassadorAvailability }
export interface AdminCampus { campusId:string;code:string;name:string;city:string;active:boolean;serviceNotes?:string;displayOrder:number;createdAt:string;updatedAt:string }
export interface CampusDraft { campusId?:string;code:string;name:string;city:string;active:boolean;serviceNotes?:string;displayOrder:number }
export interface AdminFulfilmentData { ambassadors:readonly AdminAmbassador[];campuses:readonly AdminCampus[] }
