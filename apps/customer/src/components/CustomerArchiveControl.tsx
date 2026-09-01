import { useState } from 'react';
import { customerOperationCommands } from '../data/customerOperationCommands';
import type { CustomerOperation } from '../types/customer';
import { isArchiveEligible } from '../utils/status';

export function CustomerArchiveControl({operation,compact=false}:{operation:CustomerOperation;compact?:boolean}){
  const [confirming,setConfirming]=useState(false);const [pending,setPending]=useState(false);const [error,setError]=useState<string|null>(null);
  if(!operation.archived&&!isArchiveEligible(operation.status))return null;
  const change=async(archived:boolean)=>{if(pending)return;setPending(true);setError(null);try{await customerOperationCommands.setArchived(operation.operationId,archived);setConfirming(false)}catch(issue){setError(issue instanceof Error?issue.message:'The archive preference could not be changed.')}finally{setPending(false)}};
  return <div className={`archive-control${compact?' archive-control--compact':''}`}>
    {operation.archived?<button type="button" className="archive-action" disabled={pending} onClick={()=>void change(false)}>{pending?'Restoring…':'Restore Operation'}</button>:<button type="button" className="archive-action" disabled={pending} onClick={()=>setConfirming(true)}>Archive</button>}
    {error&&<p className="archive-error" role="alert">{error}</p>}
    {confirming&&<div className="archive-dialog-backdrop"><section className="archive-dialog" role="dialog" aria-modal="true" aria-labelledby={`archive-title-${operation.operationId}`}><span>PRIVATE FILE MANAGEMENT</span><h2 id={`archive-title-${operation.operationId}`}>Archive this operation?</h2><p>You can restore it later from Archived Operations. Its actual lifecycle status and operational history will not change.</p><div><button autoFocus type="button" className="archive-action" disabled={pending} onClick={()=>setConfirming(false)}>Keep in History</button><button type="button" className="customer-primary" disabled={pending} onClick={()=>void change(true)}>{pending?'Archiving…':'Archive Operation'}</button></div></section></div>}
  </div>;
}
