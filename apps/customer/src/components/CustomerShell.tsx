import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../auth/customerAuthContext';
import { customerDataMode } from '../data/customerReadRepository';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', end: false },
  { to: '/operations', label: 'My Operations', end: true },
  { to: '/operations/new', label: 'New Operation', end: false },
  { to: '/account', label: 'Account', end: false },
];

export function CustomerShell() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useCustomerAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const displayName = user?.displayName?.trim() || 'Private Client';
  const initials = displayName.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'PC';

  useEffect(() => setOpen(false), [location.pathname]);
  const logout = async () => { await signOut(); navigate('/login', { replace: true }); };

  return <div className="client-layout">
    <button className={`client-backdrop${open ? ' is-visible' : ''}`} type="button" aria-label="Close navigation" onClick={() => setOpen(false)} />
    <aside className={`client-sidebar${open ? ' is-open' : ''}`}>
      <div className="client-brand"><span>S</span><div><strong>SECRET SERVICE</strong><small>PRIVATE CLIENT</small></div></div>
      <nav aria-label="Customer navigation"><p>YOUR FILES</p><ul>{navigation.map(item => <li key={item.to}><NavLink to={item.to} end={item.end} className={({ isActive }) => isActive ? 'is-active' : ''}>{item.label}</NavLink></li>)}</ul><p className="future-label">FUTURE ACCESS</p><ul><li><span aria-disabled="true">Messages <small>Later</small></span></li><li><span aria-disabled="true">Support <small>Later</small></span></li></ul></nav>
      <div className="client-identity"><div>{initials}</div><p><strong>{displayName}</strong><span>Private Client</span></p><button type="button" onClick={() => void logout()}>Sign out</button></div>
    </aside>
    <div className="client-workspace"><header className="client-topbar"><button type="button" className="client-menu" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><span /><span /><span /></button><div><span>PRIVATE ACCESS</span><strong>Client Operations</strong></div><p><span /> {customerDataMode==='firestore'?'FIREBASE DATA':'MOCK DATA'}</p></header><Outlet /></div>
  </div>;
}
