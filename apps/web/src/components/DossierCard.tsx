import type { Dossier } from '@secret-service/types';
import { Link } from 'react-router-dom';
import { formatPrice } from '../data/dossiers';

export function DossierCard({ dossier, onSelect, preview = false }: { dossier: Dossier; onSelect?: (dossier: Dossier) => void; preview?: boolean }) {
  return <article className="classified-card" data-id={dossier.operationId}>
    <div className="card-img-container"><img src={dossier.image} alt={`${dossier.shortTitle} Case`} /></div>
    <div className="card-content"><div>
      <div className="card-meta"><span>STAGE: {dossier.stage}</span><span className="card-price">{formatPrice(dossier.price)}</span></div>
      <h3 className="card-title">{dossier.shortTitle}</h3>
      <p className="card-desc">{preview ? dossier.previewDescription : dossier.cardDescription}</p>
      <div className="card-tags">{dossier.tags.map((tag) => <span className="card-tag" key={tag}>{tag}</span>)}</div>
    </div><div className="card-action">
      {preview ? <Link to="/dossiers" className="btn btn-secondary">[ View Dossier ]</Link> : <button className="btn btn-secondary" onClick={() => onSelect?.(dossier)}>[ Add To Dispatch ]</button>}
    </div></div>
  </article>;
}
