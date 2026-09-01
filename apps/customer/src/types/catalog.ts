import type { CustomerOperationalSettings } from '@secret-service/config';
export interface CustomerCatalogPackage { packageId:string;code:string;name:string;description:string;priceMinor:number;currency:'ZAR';displayOrder:number }
export interface CustomerCatalogCampus { campusId:string;code:string;name:string;city:string;displayOrder:number }
export interface CustomerCatalog { packages:readonly CustomerCatalogPackage[];campuses:readonly CustomerCatalogCampus[];settings:CustomerOperationalSettings }
