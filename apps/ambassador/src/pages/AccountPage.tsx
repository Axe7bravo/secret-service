import { useState } from 'react';
import { useAmbassadorAuth } from '../auth/authContext';

export function AccountPage() {
  const { user, refresh } = useAmbassadorAuth();
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const reload = async () => {
    if (busy) return; setBusy(true); setNotice('');
    try { await refresh(); setNotice('Account access refreshed.'); } catch { setNotice('Could not refresh access. Try signing out and back in.'); } finally { setBusy(false); }
  };
  return <main id="main" className="portal-main"><header className="page-header"><span className="eyebrow">PRIVATE IDENTITY</span><h1>Your Account</h1><p>Your provisioned ambassador identity. Contact Admin for account or roster corrections.</p></header><section className="panel"><h2>Account Details</h2><dl><div><dt>Display name</dt><dd>{user?.displayName || 'Not provided'}</dd></div><div><dt>Email</dt><dd>{user?.email || 'Not provided'}</dd></div><div><dt>Access</dt><dd>Ambassador</dd></div></dl><p className="notice">Account details are read-only. After a trusted role change, sign out and sign in again to refresh your session.</p><button disabled={busy} onClick={() => void reload()}>{busy ? 'Refreshing…' : 'Refresh access'}</button>{notice && <p role="status">{notice}</p>}</section></main>;
}
