export type AuthRole = 'customer' | 'admin' | 'ambassador';
export interface AuthClaims { role?: AuthRole; admin: boolean; ambassador: boolean }
export interface AuthUser { uid: string; email: string | null; displayName: string | null; emailVerified: boolean }
export interface AuthSession { user: AuthUser | null; claims: AuthClaims; loading: boolean; error: string | null }
export interface SignUpInput { email: string; password: string; displayName?: string }
