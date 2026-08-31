import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAdminDirectory } from '../hooks/useAdminDirectory';

const date = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' });

export function CustomersPage() {
  const { data, loading, error } = useAdminDirectory();
  const [search, setSearch] = useState('');
  const customers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('en-ZA');
    return [...data.customers]
      .filter(customer => !query || [customer.customerId, customer.email ?? '', customer.displayName ?? '', ...customer.operations.map(operation => operation.operationId)].some(value => value.toLocaleLowerCase('en-ZA').includes(query)))
      .sort((left, right) => (right.operations[0]?.createdAt ?? right.joinedAt ?? '').localeCompare(left.operations[0]?.createdAt ?? left.joinedAt ?? ''));
  }, [data.customers, search]);
  return <main className="admin-main">
    <PageHeader eyebrow="ACCOUNT DIRECTORY" title="Customers" description="Authenticated customer references and their operational history." />
    {error && <div className="admin-notice is-error" role="alert">{error}</div>}
    {data.truncated && <div className="admin-notice" role="status">Showing the most recent bounded directory result. Refine future queries before the directory exceeds the MVP limit.</div>}
    <section className="filter-panel directory-filter" aria-label="Customer search"><div className="filter-search"><label htmlFor="customer-search">Search customers</label><input id="customer-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, email, customer reference, or operation ID" /></div></section>
    <div className="results-summary"><span>{loading ? 'Loading customers' : `${customers.length} of ${data.customers.length} customers`}</span>{search && <button type="button" onClick={() => setSearch('')}>Clear search</button>}</div>
    {loading ? <div className="repository-state panel-state" aria-live="polite">Loading customer directory…</div> : customers.length ? <div className="operation-table-wrap"><table className="operation-table directory-table"><thead><tr><th>Customer</th><th>Account</th><th>Operations</th><th>Latest operation</th><th>First seen</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{customers.map(customer => <tr key={customer.customerId}><td data-label="Customer"><strong>{customer.displayName ?? customer.email ?? 'Customer account'}</strong><span>{customer.email ?? customer.customerId}</span></td><td data-label="Account"><span className={`status-badge ${customer.accountState === 'ACTIVE' ? 'status-success' : customer.accountState === 'DISABLED' ? 'status-danger' : 'status-neutral'}`}>{customer.accountState}</span></td><td data-label="Operations">{customer.operationCount} total · {customer.activeOperationCount} active</td><td data-label="Latest operation">{customer.operations[0]?.operationId ?? '—'}</td><td data-label="First seen">{customer.joinedAt ? date.format(new Date(customer.joinedAt)) : customer.operations.at(-1)?.createdAt ? date.format(new Date(customer.operations.at(-1)!.createdAt)) : '—'}</td><td className="operation-open"><Link to={`/customers/${encodeURIComponent(customer.customerId)}`}>Inspect <span aria-hidden="true">→</span></Link></td></tr>)}</tbody></table></div> : <div className="empty-state"><strong>{search ? 'No matching customers' : 'No customers found'}</strong><p>{search ? 'Adjust the customer search criteria.' : 'Customer accounts will appear when they are available to the trusted directory.'}</p></div>}
  </main>;
}
