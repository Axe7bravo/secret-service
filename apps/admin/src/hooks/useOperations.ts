import { useEffect,useState } from 'react';
import { adminOperationReadRepository } from '../data/adminReadRepository';
import type { Operation } from '../types/operations';
export interface RepositoryState<T>{data:T;loading:boolean;error:string}
const message=(error:Error)=>error.message||'Administrative operation data could not be loaded.';
export const useOperationsState=():RepositoryState<readonly Operation[]>=>{const [state,setState]=useState<RepositoryState<readonly Operation[]>>({data:[],loading:true,error:''});useEffect(()=>adminOperationReadRepository.subscribeList(data=>setState({data,loading:false,error:''}),error=>setState(current=>({...current,loading:false,error:message(error)}))),[]);return state};
export const useOperationState=(id:string|undefined):RepositoryState<Operation|undefined>=>{const [state,setState]=useState<RepositoryState<Operation|undefined>>({data:undefined,loading:Boolean(id),error:''});useEffect(()=>{if(!id){setState({data:undefined,loading:false,error:''});return}setState(current=>({...current,loading:true,error:''}));return adminOperationReadRepository.subscribeById(id,data=>setState({data,loading:false,error:''}),error=>setState(current=>({...current,loading:false,error:message(error)})))},[id]);return state};
