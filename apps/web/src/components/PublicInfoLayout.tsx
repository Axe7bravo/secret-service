import type { ReactNode } from 'react';
import './PublicInfoLayout.css';

export function PublicInfoLayout({ title, introduction, draft = false, children }: {
  title: string;
  introduction: string;
  draft?: boolean;
  children: ReactNode;
}) {
  return <main className="public-info-page">
    <article className="public-info-content">
      <p className="public-info-eyebrow">Secret Service / Information</p>
      <h1>{title}</h1>
      <p className="public-info-introduction">{introduction}</p>
      {draft && <aside className="public-info-draft" aria-label="Legal draft notice">
        <strong>Operational MVP draft — legal review required.</strong>
        <p>This document describes the current platform. It must be reviewed and approved for the business before production or commercial launch. It is not a statement of legal compliance.</p>
      </aside>}
      <div className="public-info-sections">{children}</div>
    </article>
  </main>;
}
