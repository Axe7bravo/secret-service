import type { ReactNode } from 'react';

export function CustomerSection({ title, eyebrow, children, className = '' }: { title: string; eyebrow?: string; children: ReactNode; className?: string }) {
  return <section className={`client-section ${className}`}><header>{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2></header><div>{children}</div></section>;
}
