import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { firebaseAuthService, mapFirebaseAuthError, type AuthSession } from '../../../../packages/firebase/src';
import { CustomerAuthContext, type CustomerAuthContextValue } from './customerAuthContext';

const initialState: AuthSession = { user: null, claims: { admin: false, ambassador: false }, loading: true, error: null };

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(initialState);
  useEffect(() => {
    try { return firebaseAuthService.observeAuthState(setSession); }
    catch (error) {
      setSession({ ...initialState, loading: false, error: mapFirebaseAuthError(error) });
      return undefined;
    }
  }, []);
  const value = useMemo<CustomerAuthContextValue>(() => ({
    ...session,
    async signIn(email, password) { await firebaseAuthService.signIn(email, password); },
    async signUp(input) { await firebaseAuthService.signUp(input); },
    signOut: () => firebaseAuthService.signOut(),
  }), [session]);
  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}
