import { useEffect,useState } from 'react';
import { paymentRepository } from '../data/paymentRepository';
import type { AdminPayment } from '../types/payments';
export const usePayments=()=>{const [state,setState]=useState<{data:readonly AdminPayment[];loading:boolean;error:string}>({data:[],loading:true,error:''});useEffect(()=>paymentRepository.subscribe(data=>setState({data,loading:false,error:''}),error=>setState({data:[],loading:false,error:error.message})),[]);return state};
