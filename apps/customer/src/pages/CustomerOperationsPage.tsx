import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerOperationCard } from '../components/CustomerOperationCard';
import { useCustomerOperations } from '../hooks/useCustomerOperations';
import { isCompletedStatus } from '../utils/status';

type Filter = 'ALL' | 'ACTIVE' | 'COMPLETED';

export function CustomerOperationsPage() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const { operations: allOperations, loading, error, refresh } = useCustomerOperations();
  const operations = allOperations.filter(item => filter === 'ALL' || (filter === 'COMPLETED' ? isCompletedStatus(item.status) : !isCompletedStatus(item.status)));

  return <main className="customer-page">
    <header className="customer-page-header"><div><p className="customer-eyebrow">PRIVATE LEDGER</p><h1>My Operations</h1><p>A customer-safe record of your submitted operations.</p></div><Link className="customer-primary" to="/operations/new">New Operation</Link></header>
    {error && <div className="customer-load-error" role="alert"><p>{error}</p><button type="button" onClick={refresh}>Try again</button></div>}
    <div className="operation-filters" role="group" aria-label="Filter operations">{(['ALL', 'ACTIVE', 'COMPLETED'] as const).map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item[0] + item.slice(1).toLowerCase()}</button>)}</div>
    {loading ? <p className="customer-empty" aria-live="polite">Retrieving secure operation files…</p> : <div className="operation-card-grid">{operations.map(item => <CustomerOperationCard key={item.operationId} operation={item}/>)}</div>}
    {!loading && !operations.length && <div className="customer-empty"><p>No operations match this filter.</p><Link to="/operations/new">Initiate your first operation</Link></div>}
  </main>;
}
