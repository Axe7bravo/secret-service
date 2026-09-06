import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { firebaseAuthService, mapFirebaseAuthError, type AuthSession } from '../../../../packages/firebase/src';
import { AuthContext, type AmbassadorAuth } from './authContext';

const initial: AuthSession = { user: null, claims: { admin: false, ambassador: false }, loading: true, error: null };
export function AmbassadorAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(initial);
  useEffect(() => {
    let live = true;
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = firebaseAuthService.observeAuthState(next => {
        if (!live) return;
        // Ignore a delayed claim response for a previous signed-in account.
        const current = firebaseAuthService.getCurrentUser();
        if (next.user && current?.uid !== next.user.uid) return;
        setSession(next);
      });
    } catch (error) { setSession({ ...initial, loading: false, error: mapFirebaseAuthError(error) }); }
    return () => { live = false; unsubscribe?.(); };
  }, []);
  const value = useMemo<AmbassadorAuth>(() => ({
    ...session,
    async signIn(email, password) { await firebaseAuthService.signIn(email, password); },
    async signOut() { await firebaseAuthService.signOut(); setSession({ ...initial, loading: false }); },
    async refresh() {
      const uid = firebaseAuthService.getCurrentUser()?.uid;
      const claims = await firebaseAuthService.refreshClaims();
      if (uid && firebaseAuthService.getCurrentUser()?.uid === uid) setSession(previous => previous.user?.uid === uid ? { ...previous, claims, error: null } : previous);
    },
  }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
