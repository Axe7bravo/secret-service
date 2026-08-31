import { useState } from 'react';
import { PackageDialog } from '../components/PackageDialog';
import { PageHeader } from '../components/PageHeader';
import { adminPackageCommands } from '../data/packageCommands';
import { usePackages } from '../hooks/usePackages';
import type { AdminPackage,PackageDraft } from '../types/packages';

const money=new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'});
const date=new Intl.DateTimeFormat('en-ZA',{dateStyle:'medium',timeStyle:'short'});

export function PackagesPage(){
  const {data:packages,loading,error}=usePackages();
  const [selected,setSelected]=useState<AdminPackage|null|undefined>(undefined);
  const [notice,setNotice]=useState('');
  const save=async(draft:PackageDraft)=>{await adminPackageCommands.savePackage(draft);setNotice(draft.packageId?'Package updated.':'Package created.');setSelected(undefined)};
  const activeCount=packages.filter(item=>item.active).length;
  return <main className="admin-main">
    <PageHeader eyebrow="CATALOGUE CONTROL" title="Packages" description="Manage the active package catalogue used for new operation snapshots." actions={<button type="button" className="admin-button" onClick={()=>{setNotice('');setSelected(null)}}>Create package</button>}/>
    {error&&<div className="admin-notice is-error" role="alert">{error}</div>}
    {notice&&<div className="admin-notice is-success" role="status">{notice}</div>}
    {!loading&&packages.length>0&&activeCount===0&&<div className="admin-notice" role="status">No packages are active. Customers cannot create new operations until an administrator reactivates a package.</div>}
    <div className="results-summary"><span>{loading?'Loading package catalogue':`${packages.length} packages · ${activeCount} active`}</span></div>
    {loading?<div className="repository-state panel-state">Loading packages…</div>:packages.length?<PackageTable packages={packages} onEdit={item=>{setNotice('');setSelected(item)}}/>:<div className="empty-state"><strong>No packages configured</strong><p>Create the first catalogue record for future operations.</p></div>}
    {selected!==undefined&&<PackageDialog {...(selected?{packageRecord:selected}:{})} onCancel={()=>setSelected(undefined)} onSave={save}/>} 
  </main>;
}

function PackageTable({packages,onEdit}:{packages:readonly AdminPackage[];onEdit:(item:AdminPackage)=>void}){
  return <div className="operation-table-wrap"><table className="operation-table package-table"><thead><tr><th>Package</th><th>Code</th><th>Price</th><th>Order</th><th>Status</th><th>Updated</th><th><span className="sr-only">Edit</span></th></tr></thead><tbody>{packages.map(item=><tr key={item.packageId}><td data-label="Package"><strong>{item.name}</strong><span>{item.shortDescription}</span></td><td data-label="Code">{item.code}</td><td data-label="Price">{money.format(item.priceMinor/100)}</td><td data-label="Order">{item.displayOrder}</td><td data-label="Status"><span className={`status-badge ${item.active?'status-success':'status-neutral'}`}>{item.active?'Active':'Inactive'}</span></td><td data-label="Updated">{date.format(new Date(item.updatedAt))}</td><td className="operation-open"><button type="button" onClick={()=>onEdit(item)}>Edit <span aria-hidden="true">→</span></button></td></tr>)}</tbody></table></div>;
}
