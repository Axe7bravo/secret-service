import { useEffect, useRef, useState, type FormEvent } from 'react';
import { operationRepository } from '../data/repository';
import type { DeliveryAction } from '../types';
import { actionLabels } from '../presentation';

export function ActionDialog({ operationId, action, close }: { operationId: string; action: DeliveryAction; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), back = useRef<HTMLButtonElement>(null), locked = useRef(false);
  const [reason, setReason] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement;
    element?.showModal(); back.current?.focus();
    return () => { element?.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked.current) return;
    if (action === 'DELIVERY_FAILED' && !reason.trim()) { setError('Describe the delivery issue.'); return; }
    locked.current = true; setBusy(true); setError('');
    try { await operationRepository.transition(operationId, action, action === 'DELIVERY_FAILED' ? reason.trim() : undefined); close(); }
    catch (issue) { setError(issue instanceof Error ? issue.message : 'Action could not be confirmed.'); }
    finally { locked.current = false; setBusy(false); }
  };
  return <dialog ref={dialog} className="action-dialog" aria-labelledby="action-title" onCancel={event => { event.preventDefault(); if (!locked.current) close(); }}><form onSubmit={submit}><span className="eyebrow">{operationId}</span><h2 id="action-title">{actionLabels[action]}</h2><p>{action === 'DELIVERED' ? 'Confirm the recipient delivery has taken place. Admin retains final completion authority.' : action === 'OUT_FOR_DELIVERY' ? 'Confirm you are starting this assigned delivery.' : 'Provide a short operational explanation. Admin can review and arrange a retry; the raw reason is not shown to the customer.'}</p>{action === 'DELIVERY_FAILED' && <label>Delivery issue<textarea required maxLength={500} rows={4} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /><small>{reason.length}/500 characters</small></label>}{error && <p role="alert" className="notice is-error">{error}</p>}<div className="actions"><button ref={back} type="button" disabled={busy} onClick={close}>Back</button><button type="submit" className="primary" disabled={busy}>{busy ? 'Confirming…' : `Confirm ${actionLabels[action]}`}</button></div></form></dialog>;
}
