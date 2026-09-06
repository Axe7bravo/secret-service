import type { PublicDossier as Dossier } from '../types/catalog';
import { PackageStartLink } from './PackageStartLink';
import { formatPrice } from '../data/dossiers';

export function DossierCard({ dossier, onSelect, preview = false }: { dossier: Dossier; onSelect?: (dossier: Dossier) => void; preview?: boolean }) {
  return <article className="classified-card" data-id={dossier.packageId}>
    <div className="card-img-container"><img src={dossier.image} alt={`${dossier.name} Case`} /></div>
    <div className="card-content"><div>
      <div className="card-meta"><span>STAGE: {dossier.stage}</span><span className="card-price">{formatPrice(dossier.priceMinor, dossier.currency)}</span></div>
      <h3 className="card-title">{dossier.name}</h3>
      <p className="card-desc">{dossier.shortDescription}</p>
      <div className="card-tags">{dossier.tags.map((tag) => <span className="card-tag" key={tag}>{tag}</span>)}</div>
    </div><div className="card-action">
      <PackageStartLink packageId={dossier.packageId}/>
      {!preview && <button type="button" className="auth-text-action" onClick={() => onSelect?.(dossier)}>[ View Details ]</button>}
    </div></div>
  </article>;
}
