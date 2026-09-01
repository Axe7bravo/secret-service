import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OperationActionDialog } from '../components/OperationActionDialog';
import { OperationStatusBadge } from '../components/OperationStatusBadge';
import { PageHeader } from '../components/PageHeader';
import { adminOperationCommands } from '../data/adminOperationCommands';
import { getAvailableActions, type WorkflowAction } from '../domain/operationWorkflow';
import { useOperationsState } from '../hooks/useOperations';
import type { Operation } from '../types/operations';
import '../styles/moderation.css';

type ModerationFilter='NEEDS_REVIEW'|'APPROVED'|'REJECTED';
interface PendingDecision { operation:Operation;action:WorkflowAction }
const filters:readonly {id:ModerationFilter;label:string}[]=[{id:'NEEDS_REVIEW',label:'Needs Review'},{id:'APPROVED',label:'Approved'},{id:'REJECTED',label:'Rejected'}];
const date=new Intl.DateTimeFormat('en-ZA',{dateStyle:'medium'});

export function ModerationPage(){
  const {data:operations,loading,error,refresh}=useOperationsState();const [filter,setFilter]=useState<ModerationFilter>('NEEDS_REVIEW');const [search,setSearch]=useState('');const [decision,setDecision]=useState<PendingDecision|null>(null);
  const cases=useMemo(()=>{const query=search.trim().toLocaleLowerCase('en-ZA');return operations.filter(operation=>{const matchesFilter=filter==='NEEDS_REVIEW'?operation.operationStatus==='REVIEW_REQUIRED':operation.moderationStatus===filter;const matchesSearch=!query||[operation.operationId,operation.customerName,operation.customerId??'',operation.recipientName,operation.packageType,operation.campus,operation.anonymousMessage].some(value=>value.toLocaleLowerCase('en-ZA').includes(query));return matchesFilter&&matchesSearch})},[filter,operations,search]);
  const count=(target:ModerationFilter)=>operations.filter(operation=>target==='NEEDS_REVIEW'?operation.operationStatus==='REVIEW_REQUIRED':operation.moderationStatus===target).length;
  const openDecision=(operation:Operation,id:'approve'|'reject')=>{const action=getAvailableActions(operation.operationStatus).find(item=>item.id===id);if(action)setDecision({operation,action})};
  const confirm=async(value:{note?:string;ambassador?:string;reviewConfirmed?:boolean})=>{if(!decision)return;await adminOperationCommands.transitionOperation(decision.operation.operationId,decision.action.toStatus,{...value,actor:'Admin User'});setDecision(null)};

  return <main className="admin-main">
    <PageHeader eyebrow="SAFETY CONTROL" title="Moderation" description="Review anonymous operation content before physical preparation and fulfilment." />
    {error&&<div className="admin-notice is-error moderation-retry" role="alert"><span>{error}</span><button type="button" onClick={refresh}>Retry queue</button></div>}
    <section className="moderation-controls" aria-label="Moderation queue controls"><div className="moderation-tabs" role="group" aria-label="Moderation status">{filters.map(item=><button key={item.id} type="button" className={filter===item.id?'is-active':''} onClick={()=>setFilter(item.id)}>{item.label}<span>{count(item.id)}</span></button>)}</div><div><label htmlFor="moderation-search">Search cases</label><input id="moderation-search" type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Operation, customer, recipient, package, campus, or message" /></div></section>
    <div className="results-summary"><span>{loading?'Loading moderation queue':`${cases.length} moderation case${cases.length===1?'':'s'}`}</span>{search&&<button type="button" onClick={()=>setSearch('')}>Clear search</button>}</div>
    {loading?<div className="repository-state panel-state" aria-live="polite">Loading moderation queue…</div>:cases.length?<div className="operation-table-wrap moderation-table-wrap"><table className="operation-table moderation-table"><thead><tr><th>Operation</th><th>Package / Recipient</th><th>Anonymous message</th><th>Delivery</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{cases.map(operation=><tr key={operation.operationId}><td data-label="Operation"><strong>{operation.operationId}</strong><span>{operation.customerId??operation.customerName}</span></td><td data-label="Package / Recipient"><strong>{operation.packageType}</strong><span>{operation.recipientName} · {operation.campus}</span></td><td data-label="Anonymous message"><p className="moderation-message-preview">{operation.anonymousMessage}</p></td><td data-label="Delivery"><strong>{date.format(new Date(`${operation.requestedDeliveryDate}T00:00:00`))}</strong><span>{operation.requestedDeliveryWindow}</span></td><td data-label="Status"><OperationStatusBadge status={operation.operationStatus}/><span>{operation.moderationStatus.replaceAll('_',' ')}</span></td><td className="operation-open moderation-actions">{operation.operationStatus==='REVIEW_REQUIRED'&&<><button type="button" onClick={()=>openDecision(operation,'approve')}>Approve</button><button type="button" className="is-danger" onClick={()=>openDecision(operation,'reject')}>Reject</button></>}<Link to={`/moderation/${operation.operationId}`} aria-label={`Review moderation case ${operation.operationId}`}>Open <span aria-hidden="true">→</span></Link></td></tr>)}</tbody></table></div>:<div className="empty-state"><strong>{filter==='NEEDS_REVIEW'?'No cases require review':`No ${filter.toLocaleLowerCase()} cases located`}</strong><p>{search?'Clear the search to inspect the full moderation view.':filter==='NEEDS_REVIEW'?'The moderation queue is clear.':'Decision history will appear here after trusted workflow actions.'}</p></div>}
    {decision&&<OperationActionDialog action={decision.action} operationId={decision.operation.operationId} campus={decision.operation.campus} onCancel={()=>setDecision(null)} onConfirm={confirm}/>} 
  </main>;
}
