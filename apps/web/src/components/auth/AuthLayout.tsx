import type { ReactNode } from 'react';

interface AuthLayoutProps {
  classification: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ classification, title, subtitle, children }: AuthLayoutProps) {
  return <main className="auth-page">
    <div className="auth-backdrop" aria-hidden="true" />
    <section className="auth-shell" aria-labelledby="auth-heading">
      <aside className="auth-context" aria-hidden="true">
        <span className="auth-context-status">SYSTEM_STATUS: SECURE</span>
        <div>
          <span className="logo-icon auth-mark">S</span>
          <p>CONFIDENTIAL ACCESS NODE</p>
        </div>
        <span className="auth-context-code">AUTH_GATE // CAPE TOWN</span>
      </aside>
      <div className="auth-card">
        <div className="auth-classification"><span>{classification}</span><span>AUTHORIZED PERSONNEL</span></div>
        <h1 id="auth-heading">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </div>
    </section>
  </main>;
}
