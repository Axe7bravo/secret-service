import { useState } from 'react';

export function DossierImage({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return <div className="card-img-container" aria-busy={!loaded && !failed}>
    {failed ? <span role="status" style={{ display: 'grid', height: '100%', placeItems: 'center' }}>
      Package image unavailable
    </span> : <img src={src} alt={`${name} package`} loading="lazy" decoding="async"
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
      onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
  </div>;
}
