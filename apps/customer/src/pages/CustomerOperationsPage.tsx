import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerOperationCard } from '../components/CustomerOperationCard';
import { CustomerPageHeader } from '../components/CustomerPageHeader';
import { useCustomerOperations } from '../hooks/useCustomerOperations';
import { isClosedStatus } from '../utils/status';

type Filter = 'ALL' | 'ACTIVE' | 'HISTORY' | 'ARCHIVED';

export function CustomerOperationsPage() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const { operations: allOperations, loading, error, refresh } = useCustomerOperations();
  const operations = allOperations.filter(item => filter === 'ARCHIVED' ? item.archived : !item.archived && (filter === 'ALL' || (filter === 'HISTORY' ? isClosedStatus(item.status) : !isClosedStatus(item.status))));
  const countFor=(item:Filter)=>allOperations.filter(operation=>item==='ARCHIVED'?operation.archived:!operation.archived&&(item==='ALL'||(item==='HISTORY'?isClosedStatus(operation.status):!isClosedStatus(operation.status)))).length;

  return <main className="client-main">
    <CustomerPageHeader eyebrow="PRIVATE OPERATION ARCHIVE" title="My Operations" description="Review progress and open the private file for each experience." actions={<Link className="customer-primary" to="/operations/new">New Operation</Link>} />
    {error && <div className="customer-load-error" role="alert"><p>{error}</p><button type="button" onClick={refresh}>Try again</button></div>}
    <div className="operation-filters" role="group" aria-label="Filter operations">{(['ALL','ACTIVE','HISTORY','ARCHIVED'] as const).map(item => <button type="button" key={item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>{item[0] + item.slice(1).toLowerCase()} <span>{countFor(item)}</span></button>)}</div>
    <p className="filter-summary">Showing {operations.length} operation{operations.length === 1 ? '' : 's'}</p>
    {loading ? <p className="customer-empty" aria-live="polite">Retrieving secure operation files…</p> : <div className="client-card-grid operations-grid">{operations.map(item => <CustomerOperationCard key={item.operationId} operation={item}/>)}</div>}
    {!loading && !operations.length && <div className="customer-empty"><p>{allOperations.length ? 'No operations match this filter.' : 'No operations have been initiated yet.'}</p>{!allOperations.length && <Link to="/operations/new">Initiate your first operation</Link>}</div>}
  </main>;
}
