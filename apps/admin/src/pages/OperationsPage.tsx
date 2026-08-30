import { useMemo, useState } from 'react';
import { OperationList } from '../components/OperationList';
import { PageHeader } from '../components/PageHeader';
import { operationsRepository } from '../data/operationsRepository';
import { OPERATION_STATUSES, type PackageType } from '../types/operations';

export function OperationsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [packageType, setPackageType] = useState('ALL');
  const operations = operationsRepository.list();
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('en-ZA');
    return operations.filter((operation) => {
      const matchesSearch = !query || [operation.operationId, operation.customerName, operation.recipientName].some((value) => value.toLocaleLowerCase('en-ZA').includes(query));
      return matchesSearch && (status === 'ALL' || operation.operationStatus === status) && (packageType === 'ALL' || operation.packageType === packageType);
    });
  }, [operations, packageType, search, status]);

  return <main className="admin-main">
    <PageHeader eyebrow="OPERATIONAL LEDGER" title="Operations" description="Search, review, and open active physical delivery files." />
    <section className="filter-panel" aria-label="Operation filters">
      <div className="filter-search"><label htmlFor="operation-search">Search operations</label><input id="operation-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Operation ID, customer, or recipient" /></div>
      <div><label htmlFor="status-filter">Status</label><select id="status-filter" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option>{OPERATION_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></div>
      <div><label htmlFor="package-filter">Package</label><select id="package-filter" value={packageType} onChange={(event) => setPackageType(event.target.value)}><option value="ALL">All packages</option>{(['Soft Revenge', 'Office Prank Kit', 'Anonymous Apology'] satisfies PackageType[]).map((item) => <option key={item}>{item}</option>)}</select></div>
    </section>
    <div className="results-summary"><span>{filtered.length} of {operations.length} operations</span>{(search || status !== 'ALL' || packageType !== 'ALL') && <button type="button" onClick={() => { setSearch(''); setStatus('ALL'); setPackageType('ALL'); }}>Clear filters</button>}</div>
    <OperationList operations={filtered} />
  </main>;
}
