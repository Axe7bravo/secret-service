import { useMemo, useState } from 'react';
import { OperationList } from '../components/OperationList';
import { PageHeader } from '../components/PageHeader';
import { useOperations } from '../hooks/useOperations';
import { OPERATION_STATUSES } from '../types/operations';

export function OperationsPage() {
  const operations = useOperations();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [packageType, setPackageType] = useState('ALL');
  const packages = useMemo(() => [...new Set(operations.map((operation) => operation.packageType))].sort(), [operations]);
  const filtered = useMemo(() => { const query = search.trim().toLocaleLowerCase('en-ZA'); return operations.filter((operation) => (!query || [operation.operationId, operation.customerName, operation.recipientName, operation.packageType].some((value) => value.toLocaleLowerCase('en-ZA').includes(query))) && (status === 'ALL' || operation.operationStatus === status) && (packageType === 'ALL' || operation.packageType === packageType)); }, [operations, packageType, search, status]);
  const hasFilters = Boolean(search || status !== 'ALL' || packageType !== 'ALL');

  return <main className="admin-main">
    <PageHeader eyebrow="OPERATIONAL LEDGER" title="Operations" description="Search, review, and open current operation files without leaving Operations Control." />
    <section className="filter-panel" aria-label="Operation filters"><div className="filter-search"><label htmlFor="operation-search">Search operations</label><input id="operation-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Operation ID, customer, recipient, or package" /></div><div><label htmlFor="status-filter">Status</label><select id="status-filter" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option>{OPERATION_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></div><div><label htmlFor="package-filter">Package</label><select id="package-filter" value={packageType} onChange={(event) => setPackageType(event.target.value)}><option value="ALL">All packages</option>{packages.map((item) => <option key={item}>{item}</option>)}</select></div></section>
    <div className="results-summary"><span>{filtered.length} of {operations.length} operations</span>{hasFilters && <button type="button" onClick={() => { setSearch(''); setStatus('ALL'); setPackageType('ALL'); }}>Clear filters</button>}</div>
    <OperationList operations={filtered} />
  </main>;
}
