import { CAMPUS_OPERATION_PACKAGES, type CampusOperationPackageId } from '@secret-service/config';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerOperationCommands } from '../data/customerOperationCommands';
import type { CreateCustomerOperationInput } from '../types/operationCreation';

interface FormState {
  packageId: CampusOperationPackageId | '';
  recipientName: string;
  recipientPhone: string;
  campus: string;
  residence: string;
  deliveryLocation: string;
  deliveryInstructions: string;
  anonymousMessage: string;
  requestedDate: string;
  requestedWindow: string;
}

const initialForm: FormState = {
  packageId: '', recipientName: '', recipientPhone: '', campus: '', residence: '', deliveryLocation: '',
  deliveryInstructions: '', anonymousMessage: '', requestedDate: '', requestedWindow: '',
};

const validate = (form: FormState): string | null => {
  if (!form.packageId) return 'Select an operation package.';
  if (!form.recipientName.trim()) return 'Enter the recipient name.';
  if (!form.recipientPhone.trim()) return 'Enter a recipient contact number.';
  if (!form.campus.trim()) return 'Enter the campus.';
  if (!form.residence.trim()) return 'Enter the residence or building.';
  if (!form.deliveryLocation.trim()) return 'Enter a precise delivery location.';
  if (!form.anonymousMessage.trim()) return 'Enter the anonymous message.';
  if (!form.requestedDate) return 'Select a requested delivery date.';
  if (!form.requestedWindow.trim()) return 'Enter a requested delivery window.';
  return null;
};

export function CustomerNewOperationPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const selectedPackage = CAMPUS_OPERATION_PACKAGES.find(item => item.id === form.packageId);
  const update = <Key extends keyof FormState,>(key: Key, value: FormState[Key]) => setForm(current => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const validationError = validate(form);
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    setError(null);
    const input: CreateCustomerOperationInput = {
      packageId: form.packageId as CampusOperationPackageId,
      recipient: {
        name: form.recipientName,
        phone: form.recipientPhone,
        campus: form.campus,
        residence: form.residence,
        deliveryLocation: form.deliveryLocation,
        ...(form.deliveryInstructions.trim() ? { deliveryInstructions: form.deliveryInstructions } : {}),
      },
      delivery: { requestedDate: form.requestedDate, requestedWindow: form.requestedWindow },
      anonymousMessage: form.anonymousMessage,
    };

    try {
      const result = await customerOperationCommands.createOperation(input);
      navigate(`/operations/${result.operationId}`, { replace: true, state: { operationCreated: true } });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The operation could not be submitted. Please try again.');
      setSubmitting(false);
    }
  };

  return <main className="customer-page operation-create-page">
    <Link to="/operations">← Back to My Operations</Link>
    <header className="operation-create-header"><p className="customer-eyebrow">SECURE DIRECTIVE</p><h1>Initiate Operation</h1><p>Submit a private operation request for review by the Secret Service operations team.</p></header>
    <form className="operation-create-form" onSubmit={event => void submit(event)} noValidate>
      {error && <div className="operation-form-error" role="alert">{error}</div>}
      <fieldset><legend><span>01</span> Select Package</legend><div className="operation-package-grid">
        {CAMPUS_OPERATION_PACKAGES.map(item => <label className={form.packageId === item.id ? 'selected' : ''} key={item.id}>
          <input type="radio" name="packageId" value={item.id} checked={form.packageId === item.id} onChange={() => update('packageId', item.id)} required/>
          <strong>{item.name}</strong><span>{item.description}</span><b>R {(item.priceMinor / 100).toFixed(2)}</b>
        </label>)}
      </div>{selectedPackage && <p className="operation-selection-note">Selected dossier: {selectedPackage.name}. Payment is not collected in this milestone.</p>}</fieldset>

      <fieldset><legend><span>02</span> Recipient Intelligence</legend><div className="operation-form-grid">
        <label>Recipient name<input value={form.recipientName} onChange={event => update('recipientName', event.target.value)} maxLength={120} autoComplete="name" required/></label>
        <label>Recipient phone<input type="tel" value={form.recipientPhone} onChange={event => update('recipientPhone', event.target.value)} maxLength={40} autoComplete="tel" required/></label>
        <label>Campus<input value={form.campus} onChange={event => update('campus', event.target.value)} maxLength={160} required/></label>
        <label>Residence or building<input value={form.residence} onChange={event => update('residence', event.target.value)} maxLength={160} required/></label>
        <label className="full-width">Delivery location<input value={form.deliveryLocation} onChange={event => update('deliveryLocation', event.target.value)} maxLength={240} placeholder="Reception, office number, entrance or meeting point" required/></label>
        <label className="full-width">Delivery instructions <small>Optional</small><textarea value={form.deliveryInstructions} onChange={event => update('deliveryInstructions', event.target.value)} maxLength={1000} rows={3}/></label>
      </div></fieldset>

      <fieldset><legend><span>03</span> Anonymous Message</legend><label>Message content<textarea value={form.anonymousMessage} onChange={event => update('anonymousMessage', event.target.value)} maxLength={2000} rows={7} aria-describedby="message-guidance" required/></label><p id="message-guidance">Messages are reviewed before fulfilment. Do not include threats, harassment, or unsafe instructions.</p></fieldset>

      <fieldset><legend><span>04</span> Delivery Request</legend><div className="operation-form-grid">
        <label>Requested date<input type="date" value={form.requestedDate} onChange={event => update('requestedDate', event.target.value)} required/></label>
        <label>Requested window<input value={form.requestedWindow} onChange={event => update('requestedWindow', event.target.value)} maxLength={80} placeholder="For example, 14:00–16:00" required/></label>
      </div></fieldset>

      <section className="operation-submit-panel"><div><p className="customer-eyebrow">FINAL CHECK</p><h2>Submit for review</h2><p>The operations team controls moderation, payment progression, scheduling and fulfilment.</p></div><button className="customer-primary" type="submit" disabled={submitting}>{submitting ? 'Transmitting securely…' : 'Submit Operation'}</button></section>
    </form>
  </main>;
}
