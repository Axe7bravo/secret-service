import { CAMPUS_OPERATION_PACKAGES } from '@secret-service/config';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src/functionsClient';
import type { PublicPackage } from '../types/catalog';

export interface PublicCatalogRepository { load(): Promise<PublicPackage[]> }
const unavailable = 'The package catalogue is temporarily unavailable. Please try again.';

// Match the Customer app and current web .env.local; legacy flag is a fallback.
const configuredMode = (import.meta.env.VITE_DATA_SOURCE?.trim()
  || import.meta.env.VITE_FIREBASE_MODE?.trim() || 'firestore').toLowerCase();
export const publicCatalogMode = import.meta.env.DEV && configuredMode === 'mock' ? 'mock' : 'firebase';
const invalidMode = !['mock', 'firestore', 'firebase'].includes(configuredMode);

function diagnose(stage: 'loading' | 'loaded' | 'empty' | 'failed' | 'invalid-response' | 'invalid-mode', count?: number, code?: string) {
  if (!import.meta.env.DEV) return;
  console.info('[Public catalogue]', {
    mode: publicCatalogMode, stage,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'not-configured', region: 'us-central1',
    ...(count !== undefined ? { count } : {}), ...(code ? { code } : {}),
  });
}

function isPackage(value: unknown): value is PublicPackage {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.packageId === 'string' && typeof item.code === 'string'
    && typeof item.name === 'string' && typeof item.shortDescription === 'string'
    && typeof item.description === 'string' && item.currency === 'ZAR'
    && typeof item.priceMinor === 'number' && Number.isSafeInteger(item.priceMinor) && item.priceMinor >= 0
    && typeof item.displayOrder === 'number' && Number.isSafeInteger(item.displayOrder) && item.displayOrder >= 0;
}

const firebaseRepository: PublicCatalogRepository = {
  async load() {
    try {
      if (invalidMode) {
        diagnose('invalid-mode');
        throw new Error(unavailable);
      }
      diagnose('loading');
      const { data } = await httpsCallable<Record<string, never>, unknown>(getFirebaseFunctions(), 'getPublicCatalog')({});
      if (typeof data !== 'object' || data === null || !('packages' in data)
        || !Array.isArray(data.packages) || data.packages.length > 200 || !data.packages.every(isPackage)) {
        diagnose('invalid-response');
        throw new Error(unavailable);
      }
      diagnose(data.packages.length ? 'loaded' : 'empty', data.packages.length);
      return data.packages;
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
        && /^(functions|auth)\/[a-z-]+$/.test(error.code) ? error.code : 'catalogue-unavailable';
      diagnose('failed', undefined, code);
      throw new Error(unavailable);
    }
  },
};

const mockRepository: PublicCatalogRepository = {
  async load() {
    diagnose('loaded', CAMPUS_OPERATION_PACKAGES.length);
    return CAMPUS_OPERATION_PACKAGES.map((item, index) => ({
      packageId: item.id, code: item.id, name: item.name,
      shortDescription: item.description, description: item.description,
      priceMinor: item.priceMinor, currency: item.currency, displayOrder: (index + 1) * 10,
    }));
  },
};

// Fixtures require explicit development opt-in. Production always uses Firebase.
export const publicCatalogRepository = publicCatalogMode === 'mock' ? mockRepository : firebaseRepository;
