import { Navigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAmbassadorAuth } from './authContext';

export function AmbassadorAuthGuard() {
  const { user, claims, loading, error, signOut, refresh } = useAmbassadorAuth();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const perform = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setNotice('');
    try { await action(); } catch { setNotice('Unable to update your session. Please try again.'); } finally { setBusy(false); }
  };
  if (loading) return <main className="access-page"><p role="status">Verifying secure access…</p></main>;
  if (error) return <main className="access-page"><section className="panel"><h1>Access unavailable</h1><p role="alert">{error}</p><button onClick={() => window.location.reload()}>Retry connection</button></section></main>;
  if (!user) return <Navigate to="/login" replace />;
  if (claims.role !== 'ambassador') return <main className="access-page"><section className="panel"><span className="eyebrow">RESTRICTED ACCESS</span><h1>Ambassador access required</h1><p>Your signed-in account does not have access to this portal. Contact your administrator.</p>{notice && <p role="alert">{notice}</p>}<div className="actions"><button disabled={busy} onClick={() => void perform(refresh)}>Refresh access</button><button disabled={busy} onClick={() => void perform(signOut)}>Sign out</button></div></section></main>;
  return <Outlet />;
}
