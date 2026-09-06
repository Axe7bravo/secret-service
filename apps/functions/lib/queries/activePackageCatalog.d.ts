import type { Firestore } from 'firebase-admin/firestore';
export interface CatalogPackage {
    packageId: string;
    code: string;
    name: string;
    shortDescription: string;
    description: string;
    priceMinor: number;
    currency: 'ZAR';
    displayOrder: number;
}
export declare function loadActivePackages(db: Firestore): Promise<CatalogPackage[]>;
//# sourceMappingURL=activePackageCatalog.d.ts.map