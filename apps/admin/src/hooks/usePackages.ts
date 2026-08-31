import { useEffect,useState } from 'react';
import { adminPackageRepository } from '../data/packageRepository';
import type { AdminPackage } from '../types/packages';
export const usePackages=()=>{const [state,setState]=useState<{data:readonly AdminPackage[];loading:boolean;error:string}>({data:[],loading:true,error:''});useEffect(()=>adminPackageRepository.subscribe(data=>setState({data,loading:false,error:''}),error=>setState(current=>({...current,loading:false,error:error.message||'Package catalogue could not be loaded.'}))),[]);return state};
