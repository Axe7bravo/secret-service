import type { ReactNode } from 'react'; import './placeholder.css';
interface Props { eyebrow: string; title: string; children: ReactNode }
export function AppPlaceholder({ eyebrow, title, children }: Props) { return <main className="shared-placeholder"><div className="shared-placeholder__panel"><span>{eyebrow}</span><h1>{title}</h1><p>{children}</p></div></main>; }
