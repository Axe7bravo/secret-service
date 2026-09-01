import type { ReactNode } from 'react';

export function CustomerPageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="client-page-header"><div><span>{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="customer-header-actions">{actions}</div>}</header>;
}
