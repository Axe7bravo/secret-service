export const APP_NAMES = { web: 'Secret Service', admin: 'Secret Service Admin', customer: 'Secret Service Customer' } as const;
export const PUBLIC_NAVIGATION = [
  { label: 'Home', to: '/' }, { label: 'The Directive', to: '/about' },
  { label: 'Dossiers', to: '/dossiers' }, { label: 'Protocol', to: '/protocol' },
  { label: 'Contact', to: '/contact' },
] as const;
