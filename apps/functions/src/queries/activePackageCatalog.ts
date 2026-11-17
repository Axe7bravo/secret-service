import type { Firestore } from 'firebase-admin/firestore';
import { packageImageFor, publicPackageImageUrl } from '../domain/packageImages.js';

export interface CatalogPackage {
  packageId: string;
  code: string;
  name: string;
  shortDescription: string;
  description: string;
  priceMinor: number;
  currency: 'ZAR';
  displayOrder: number;
  imageUrl: string;
}

// Shared public-safe boundary. Never spread a Firestore document into the result.
export async function loadActivePackages(db: Firestore): Promise<CatalogPackage[]> {
  const snapshot = await db.collection('packages').where('active', '==', true)
    .orderBy('displayOrder', 'asc').limit(200).get();
  return snapshot.docs.flatMap(document => {
    const record: Record<string, unknown> = document.data();
    const image = packageImageFor(document.id, record.image);
    if (!image) return [];
    if (record.active !== true || record.packageId !== document.id
      || typeof record.code !== 'string' || typeof record.name !== 'string'
      || typeof record.shortDescription !== 'string'
      || (record.description !== undefined && typeof record.description !== 'string')
      || typeof record.priceMinor !== 'number' || !Number.isSafeInteger(record.priceMinor) || record.priceMinor <= 0
      || record.currency !== 'ZAR' || typeof record.displayOrder !== 'number'
      || !Number.isSafeInteger(record.displayOrder) || record.displayOrder < 0) {
      return [];
    }
    return [{
      packageId: document.id, code: record.code, name: record.name,
      shortDescription: record.shortDescription,
      description: record.description ?? record.shortDescription,
      priceMinor: record.priceMinor, currency: 'ZAR' as const, displayOrder: record.displayOrder,
      imageUrl: publicPackageImageUrl(document.id, image),
    }];
  }).sort((a, b) => a.displayOrder - b.displayOrder || (a.packageId < b.packageId ? -1 : a.packageId > b.packageId ? 1 : 0));
}
