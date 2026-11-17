export interface PublicPackage {
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

export interface DossierPresentation {
  stage: string;
  timeframe: string;
  clearance: string;
  tags: readonly string[];
}

export type PublicDossier = PublicPackage & DossierPresentation;
