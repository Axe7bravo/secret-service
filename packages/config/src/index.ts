export const APP_NAMES = { web: 'Secret Service', admin: 'Secret Service Admin', customer: 'Secret Service Customer' } as const;
export const PUBLIC_NAVIGATION = [
  { label: 'Home', to: '/' }, { label: 'The Directive', to: '/about' },
  { label: 'Dossiers', to: '/dossiers' }, { label: 'Protocol', to: '/protocol' },
  { label: 'Contact', to: '/contact' },
] as const;

export const CAMPUS_OPERATION_PACKAGES = [
  { id: 'soft-revenge', name: 'Soft Revenge', description: 'A discreet, harmless reminder delivered with theatrical precision.', priceMinor: 29900, currency: 'ZAR' },
  { id: 'office-prank-kit', name: 'Office Prank Kit', description: 'A controlled office prank deployment designed for maximum discretion.', priceMinor: 45000, currency: 'ZAR' },
  { id: 'anonymous-apology', name: 'Anonymous Apology', description: 'A confidential apology delivered without revealing the sender.', priceMinor: 18000, currency: 'ZAR' },
] as const;

export type CampusOperationPackageId = typeof CAMPUS_OPERATION_PACKAGES[number]['id'];
export type CampusOperationPackage = typeof CAMPUS_OPERATION_PACKAGES[number];
