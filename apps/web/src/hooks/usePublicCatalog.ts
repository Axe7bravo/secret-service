import { useEffect, useState } from 'react';
import { publicCatalogMode, publicCatalogRepository } from '../services/publicCatalogRepository';
import { toDossier } from '../data/dossiers';
import type { PublicDossier } from '../types/catalog';

interface CatalogState { packages: PublicDossier[]; loading: boolean; error: string | null }
export function usePublicCatalog() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CatalogState>({ packages: [], loading: true, error: null });
  useEffect(() => {
    let cancelled = false;
    void publicCatalogRepository.load().then(packages => {
      if (!cancelled) setState({ packages: packages.map(toDossier), loading: false, error: null });
    }).catch(() => {
      if (!cancelled) setState({ packages: [], loading: false, error: 'The package catalogue is temporarily unavailable. Please try again.' });
    });
    return () => { cancelled = true; };
  }, [attempt]);
  const refresh = () => {
    setState({ packages: [], loading: true, error: null });
    setAttempt(value => value + 1);
  };
  return { ...state, refresh, developmentMode: import.meta.env.DEV ? publicCatalogMode : undefined };
}
