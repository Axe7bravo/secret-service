import type { ReactNode } from 'react';

export function SectionCard({ title, eyebrow, children, className = '' }: { title: string; eyebrow?: string; children: ReactNode; className?: string }) {
  return <section className={`section-card ${className}`}><header>{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2></header><div className="section-card-body">{children}</div></section>;
}
