import { useCallback,useEffect,useState } from 'react';
import { customerCatalogRepository } from '../data/customerCatalogRepository';
import type { CustomerCatalog } from '../types/catalog';
import { DEFAULT_CUSTOMER_OPERATIONAL_SETTINGS } from '@secret-service/config';
const empty:CustomerCatalog={packages:[],campuses:[],settings:{...DEFAULT_CUSTOMER_OPERATIONAL_SETTINGS,deliveryWindows:[...DEFAULT_CUSTOMER_OPERATIONAL_SETTINGS.deliveryWindows]}};
export const useCustomerCatalog=()=>{const [data,setData]=useState<CustomerCatalog>(empty);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);const [revision,setRevision]=useState(0);const refresh=useCallback(()=>setRevision(value=>value+1),[]);useEffect(()=>{let active=true;setLoading(true);setError(null);customerCatalogRepository.load().then(result=>{if(active)setData(result)}).catch(issue=>{if(active)setError(issue instanceof Error?issue.message:'The catalogue could not be loaded.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[revision]);return{data,loading,error,refresh}};
