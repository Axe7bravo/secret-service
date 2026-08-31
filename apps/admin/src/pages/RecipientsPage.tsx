import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OperationStatusBadge } from '../components/OperationStatusBadge';
import { useAdminDirectory } from '../hooks/useAdminDirectory';

export function RecipientsPage() {
  const { data, loading, error } = useAdminDirectory();
  const [search, setSearch] = useState('');
  const recipients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('en-ZA');
    return [...data.recipients]
      .filter(recipient => !query || [recipient.name, recipient.phone, recipient.campus, recipient.residence, ...recipient.operations.map(operation => operation.operationId)].some(value => value.toLocaleLowerCase('en-ZA').includes(query)))
      .sort((left, right) => (right.operations[0]?.createdAt ?? '').localeCompare(left.operations[0]?.createdAt ?? ''));
  }, [data.recipients, search]);
  return <main className="admin-main">
    <PageHeader eyebrow="DELIVERY DIRECTORY" title="Recipients" description="Operation-linked recipient references and delivery history." />
    {error && <div className="admin-notice is-error" role="alert">{error}</div>}
    {data.truncated && <div className="admin-notice" role="status">Recipient results reflect the bounded MVP operation window.</div>}
    <section className="filter-panel directory-filter" aria-label="Recipient search"><div className="filter-search"><label htmlFor="recipient-search">Search recipients</label><input id="recipient-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, phone, campus, residence, or operation ID" /></div></section>
    <div className="results-summary"><span>{loading ? 'Loading recipients' : `${recipients.length} of ${data.recipients.length} recipients`}</span>{search && <button type="button" onClick={() => setSearch('')}>Clear search</button>}</div>
    {loading ? <div className="repository-state panel-state" aria-live="polite">Loading recipient directory…</div> : recipients.length ? <div className="operation-table-wrap"><table className="operation-table directory-table"><thead><tr><th>Recipient</th><th>Campus / Residence</th><th>Contact</th><th>Operations</th><th>Latest state</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{recipients.map(recipient => <tr key={recipient.recipientId}><td data-label="Recipient"><strong>{recipient.name}</strong><span>{recipient.recipientId}</span></td><td data-label="Campus / Residence"><strong>{recipient.campus}</strong><span>{recipient.residence}</span></td><td data-label="Contact">{recipient.phone}</td><td data-label="Operations">{recipient.operationCount}</td><td data-label="Latest state">{recipient.operations[0] ? <OperationStatusBadge status={recipient.operations[0].status} /> : '—'}</td><td className="operation-open"><Link to={`/recipients/${recipient.recipientId}`}>Inspect <span aria-hidden="true">→</span></Link></td></tr>)}</tbody></table></div> : <div className="empty-state"><strong>{search ? 'No matching recipients' : 'No recipients found'}</strong><p>{search ? 'Adjust the recipient search criteria.' : 'Recipients appear when authoritative operations are available.'}</p></div>}
  </main>;
}
