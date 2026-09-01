import { CAMPUS_OPERATION_PACKAGES } from '@secret-service/config';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src';
import type { CustomerCatalog } from '../types/catalog';
import { customerDataMode } from './customerReadRepository';

export interface CustomerCatalogRepository { load():Promise<CustomerCatalog> }
const mockCatalog:CustomerCatalog={packages:CAMPUS_OPERATION_PACKAGES.map((item,index)=>({packageId:item.id,code:item.id,name:item.name,description:item.description,priceMinor:item.priceMinor,currency:item.currency,displayOrder:(index+1)*10})),campuses:[{campusId:'ufs',code:'ufs',name:'University of the Free State',city:'Bloemfontein',displayOrder:10},{campusId:'cut',code:'cut',name:'Central University of Technology',city:'Bloemfontein',displayOrder:20}]};
const mockRepository:CustomerCatalogRepository={async load(){return mockCatalog}};
const firebaseRepository:CustomerCatalogRepository={async load(){try{const callable=httpsCallable<Record<string,never>,CustomerCatalog>(getFirebaseFunctions(),'getCustomerCatalog');return(await callable({})).data}catch(error){const code=typeof error==='object'&&error&&'code'in error?String(error.code):'';if(code.includes('unauthenticated'))throw new Error('Your secure session expired. Sign in and try again.');throw new Error('The package and campus catalogue could not be loaded.')}}};
export const customerCatalogRepository=customerDataMode==='firestore'?firebaseRepository:mockRepository;
