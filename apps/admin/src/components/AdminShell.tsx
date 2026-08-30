import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { adminAuthService } from '../auth/adminAuthService';

const primaryNavigation = [
  { label: 'Dashboard', to: '/dashboard', icon: 'DB' },
  { label: 'Operations', to: '/operations', icon: 'OP' },
];
const futureNavigation = ['Customers', 'Recipients', 'Deliveries', 'Ambassadors', 'Packages', 'Payments', 'Moderation', 'Campuses', 'Settings'];

export function AdminShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return <div className="admin-layout">
    <button type="button" className={`admin-backdrop${menuOpen ? ' is-visible' : ''}`} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
    <aside className={`admin-sidebar${menuOpen ? ' is-open' : ''}`}>
      <div className="admin-brand"><span className="admin-brand-mark">S</span><div><strong>SECRET SERVICE</strong><span>ADMIN OPERATIONS</span></div></div>
      <nav aria-label="Admin navigation">
        <p className="admin-nav-label">ACTIVE WORKSPACE</p>
        <ul>{primaryNavigation.map((item) => <li key={item.to}><NavLink to={item.to} className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}><span aria-hidden="true">{item.icon}</span>{item.label}</NavLink></li>)}</ul>
        <p className="admin-nav-label admin-nav-future-label">FUTURE MODULES</p>
        <ul>{futureNavigation.map((label) => <li key={label}><span className="admin-nav-link is-disabled" aria-disabled="true"><span aria-hidden="true">—</span>{label}<small>Later</small></span></li>)}</ul>
      </nav>
      <div className="admin-profile"><div className="admin-avatar" aria-hidden="true">AU</div><div><strong>Admin User</strong><span>Operations Control</span></div><button type="button" onClick={() => { adminAuthService.logout(); navigate('/login', { replace: true }); }}>Sign out</button></div>
    </aside>
    <div className="admin-workspace">
      <header className="admin-topbar"><button type="button" className="admin-menu-button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><span /><span /><span /></button><div><span className="admin-topbar-label">INTERNAL SYSTEM</span><strong>Operations Control</strong></div><div className="admin-system-status"><span /> SYSTEM ONLINE</div></header>
      <Outlet />
    </div>
  </div>;
}
