import { useEffect,useState } from 'react';
import { adminFulfilmentRepository } from '../data/adminFulfilmentRepository';
import type { AdminFulfilmentData } from '../types/fulfilment';
const empty:AdminFulfilmentData={ambassadors:[],campuses:[]};
export const useFulfilment=()=>{const [state,setState]=useState<{data:AdminFulfilmentData;loading:boolean;error:string}>({data:empty,loading:true,error:''});useEffect(()=>adminFulfilmentRepository.subscribe(data=>setState({data,loading:false,error:''}),error=>setState(current=>({...current,loading:false,error:error.message||'Fulfilment data could not be loaded.'}))),[]);return state};
