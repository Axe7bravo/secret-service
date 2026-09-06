import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { mapFirebaseAuthError } from '../../../../packages/firebase/src';
import { useAmbassadorAuth } from '../auth/authContext';

export function LoginPage() {
  const { user, loading, signIn, error: authError } = useAmbassadorAuth();
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  if (user && !loading) return <Navigate to="/dashboard" replace />;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try { await signIn(email, password); } catch (issue) { setError(mapFirebaseAuthError(issue)); } finally { setBusy(false); }
  };
  return <main className="access-page"><section className="login-panel panel"><div className="brand"><span aria-hidden="true">S</span><div><strong>SECRET SERVICE</strong><small>AMBASSADOR ACCESS</small></div></div><span className="eyebrow">PRIVATE FIELD OPERATIONS</span><h1>Access Your Deliveries</h1><p>Sign in with your provisioned ambassador account. Your assigned operations remain private.</p><form className="stack" onSubmit={submit}><label>Email<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></label>{(error || authError) && <p role="alert" className="notice is-error">{error || authError}</p>}<button type="submit" className="primary" disabled={busy || loading}>{busy ? 'Authenticating…' : 'Access Deliveries'}</button></form><p className="notice">Access is provisioned by a trusted operator. There is no public ambassador signup.</p></section></main>;
}
