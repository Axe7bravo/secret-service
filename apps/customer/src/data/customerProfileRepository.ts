import type { CustomerProfile } from '../types/customer';
const profile:CustomerProfile={firstName:'Naledi',lastName:'Mokoena',email:'customer@secretservice.co.za',phone:'+27 71 555 0198',memberSince:'2026-07-18'};
export const customerProfileRepository={get:()=>profile};
