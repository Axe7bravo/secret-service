import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { firebaseAuthService, mapFirebaseAuthError, type AuthSession } from '../../../../packages/firebase/src';
import { AdminAuthContext, type AdminAuthContextValue } from './adminAuthContext';

const initialState: AuthSession = { user: null, claims: { admin: false, ambassador: false }, loading: true, error: null };

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(initialState);
  useEffect(() => {
    try { return firebaseAuthService.observeAuthState(setSession); }
    catch (error) {
      setSession({ ...initialState, loading: false, error: mapFirebaseAuthError(error) });
      return undefined;
    }
  }, []);
  const value = useMemo<AdminAuthContextValue>(() => ({
    ...session,
    async signIn(email, password) { await firebaseAuthService.signIn(email, password); },
    signOut: () => firebaseAuthService.signOut(),
    async refreshClaims() {
      const claims = await firebaseAuthService.refreshClaims();
      setSession((current) => ({ ...current, claims }));
    },
  }), [session]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
