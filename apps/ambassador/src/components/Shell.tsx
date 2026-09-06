import { NavLink, Outlet } from 'react-router-dom';
import { APP_NAMES } from '@secret-service/config';
import { useState } from 'react';
import { useAmbassadorAuth } from '../auth/authContext';
import { dataMode } from '../data/repository';

export function Shell() {
  const { signOut, user } = useAmbassadorAuth();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const logout = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await signOut(); } catch { setError('Sign out failed. Please retry.'); } finally { setBusy(false); }
  };
  return <div className="portal-layout">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="portal-sidebar">
      <div className="brand"><span aria-hidden="true">S</span><div><strong>{APP_NAMES.web.toUpperCase()}</strong><small>AMBASSADOR ACCESS</small></div></div>
      <nav aria-label="Ambassador navigation"><NavLink to="/dashboard">Dashboard</NavLink><NavLink to="/operations">My Deliveries</NavLink><NavLink to="/account">Account</NavLink></nav>
      <div className="identity"><p>{user?.displayName || 'Ambassador'}</p><button disabled={busy} onClick={() => void logout()}>{busy ? 'Signing out…' : 'Sign out'}</button>{error && <p role="alert">{error}</p>}</div>
    </aside>
    <div className="workspace"><header className="topbar"><span>FIELD OPERATIONS</span><span>{dataMode === 'mock' ? 'DEVELOPMENT · MOCK DATA' : 'PRIVATE ACCESS'}</span></header><Outlet /></div>
  </div>;
}
