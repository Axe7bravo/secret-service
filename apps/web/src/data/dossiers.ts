import type { DossierPresentation, PublicDossier, PublicPackage } from '../types/catalog';

// Presentation only. Names, descriptions, prices and availability come from Admin.
const defaults: DossierPresentation = {
  stage: 'STAGING', timeframe: 'Confirmed during scheduling', clearance: 'Public catalogue',
  tags: ['Hand Delivery'], image: '/assets/classified_case.jpg',
};
const presentation: Record<string, Partial<DossierPresentation>> = {
  'secret-admirer': { stage: 'STAGING', timeframe: '24-48 Hours Staging', clearance: 'Level 1 (Public)', tags: ['Level 1 Clearance', 'Hand Delivery'] },
  'soft-revenge': { stage: 'RECON', timeframe: '3-5 Days Recon', clearance: 'Level 2 (Confidential)', tags: ['Level 2 Clearance', 'Psy-Ops'] },
  'confession': { stage: 'STAGING', timeframe: '48 Hours Staging', clearance: 'Level 1 (Public)', tags: ['Level 1 Clearance', 'Secure Seal'] },
  'roast-your-friend': { stage: 'DESIGN', timeframe: '3 Days Staging', clearance: 'Level 2 (Confidential)', tags: ['Level 2 Clearance', 'Live Theatre'] },
  'office-prank-kit': { stage: 'AUDIT', timeframe: '4-6 Days Recon', clearance: 'Level 3 (Secret)', tags: ['Level 3 Clearance', 'Office Ops'] },
  'midnight-mystery': { stage: 'ACTIVE', timeframe: '24 Hours Staging', clearance: 'Level 2 (Confidential)', tags: ['Level 2 Clearance', 'Night Ops'] },
  'vip-decoy': { stage: 'PLANNING', timeframe: '7 Days Planning', clearance: 'Level 4 (Top Secret)', tags: ['Level 4 Clearance', 'Agent Team'] },
  'anonymous-apology': { stage: 'STAGING', timeframe: '48 Hours Staging', clearance: 'Level 1 (Public)', tags: ['Level 1 Clearance', 'Gift Delivery'] },
  'red-envelope': { stage: 'AUDIT', timeframe: '5 Days Planning', clearance: 'Level 3 (Secret)', tags: ['Level 3 Clearance', 'Puzzle Trail'] },
};
export const toDossier = (item: PublicPackage): PublicDossier => ({
  ...defaults, ...presentation[item.code], ...item,
});
export const formatPrice = (priceMinor: number, currency: PublicPackage['currency']) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(priceMinor / 100);
