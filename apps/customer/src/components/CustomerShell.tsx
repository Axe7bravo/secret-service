import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { customerAuthService } from '../auth/customerAuthService';
import { customerRepository } from '../data/customerRepository';

const navigation=[{to:'/dashboard',label:'Dashboard'},{to:'/operations',label:'My Operations'},{to:'/account',label:'Account'}];
export function CustomerShell(){
  const [open,setOpen]=useState(false);const location=useLocation();const navigate=useNavigate();const customer=customerRepository.getCurrent();
  useEffect(()=>setOpen(false),[location.pathname]);
  return <div className="client-layout"><button className={`client-backdrop${open?' is-visible':''}`} type="button" aria-label="Close navigation" onClick={()=>setOpen(false)}/><aside className={`client-sidebar${open?' is-open':''}`}><div className="client-brand"><span>S</span><div><strong>SECRET SERVICE</strong><small>PRIVATE CLIENT</small></div></div><nav aria-label="Customer navigation"><p>YOUR FILES</p><ul>{navigation.map(item=><li key={item.to}><NavLink to={item.to} className={({isActive})=>isActive?'is-active':''}>{item.label}</NavLink></li>)}</ul><p className="future-label">FUTURE ACCESS</p><ul><li><span aria-disabled="true">Messages <small>Later</small></span></li><li><span aria-disabled="true">Support <small>Later</small></span></li></ul></nav><div className="client-identity"><div>{customer.firstName[0]}{customer.lastName[0]}</div><p><strong>{customer.firstName} {customer.lastName}</strong><span>Private Client</span></p><button type="button" onClick={()=>{customerAuthService.logout();navigate('/login',{replace:true})}}>Sign out</button></div></aside><div className="client-workspace"><header className="client-topbar"><button type="button" className="client-menu" aria-label="Open navigation" aria-expanded={open} onClick={()=>setOpen(true)}><span/><span/><span/></button><div><span>PRIVATE ACCESS</span><strong>Client Operations</strong></div><p><span/> SESSION ACTIVE</p></header><Outlet/></div></div>;
}
