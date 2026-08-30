import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './client';
import type { AuthClaims, AuthSession, AuthUser, SignUpInput } from './types';

const emptyClaims: AuthClaims = { admin: false, ambassador: false };

const adaptUser = (user: User): AuthUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  emailVerified: user.emailVerified,
});

const readClaims = async (user: User, forceRefresh = false): Promise<AuthClaims> => {
  const result = await user.getIdTokenResult(forceRefresh);
  return {
    role: result.claims.role === 'admin' || result.claims.role === 'ambassador' || result.claims.role === 'customer'
      ? result.claims.role
      : undefined,
    admin: result.claims.admin === true || result.claims.role === 'admin',
    ambassador: result.claims.ambassador === true || result.claims.role === 'ambassador',
  };
};

export const mapFirebaseAuthError = (error: unknown): string => {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account already exists for this email address.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Choose a stronger password with at least six characters.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/wrong-password': 'The email or password is incorrect.',
    'auth/user-not-found': 'The email or password is incorrect.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/network-request-failed': 'Unable to reach the authentication service. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Wait a while before trying again.',
  };
  if (error instanceof Error && error.message.startsWith('Firebase is not configured.')) return error.message;
  return messages[code] ?? 'Authentication could not be completed. Please try again.';
};

export const firebaseAuthService = {
  async signIn(email: string, password: string): Promise<AuthUser> {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    return adaptUser(credential.user);
  },
  async signUp(input: SignUpInput): Promise<AuthUser> {
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), input.email.trim(), input.password);
    if (input.displayName?.trim()) await updateProfile(credential.user, { displayName: input.displayName.trim() });
    return adaptUser(credential.user);
  },
  signOut(): Promise<void> {
    return firebaseSignOut(getFirebaseAuth());
  },
  getCurrentUser(): AuthUser | null {
    const user = getFirebaseAuth().currentUser;
    return user ? adaptUser(user) : null;
  },
  async refreshClaims(): Promise<AuthClaims> {
    const user = getFirebaseAuth().currentUser;
    return user ? readClaims(user, true) : emptyClaims;
  },
  observeAuthState(listener: (session: AuthSession) => void): () => void {
    const auth = getFirebaseAuth();
    return onIdTokenChanged(auth, async (user) => {
      if (!user) {
        listener({ user: null, claims: emptyClaims, loading: false, error: null });
        return;
      }
      try {
        listener({ user: adaptUser(user), claims: await readClaims(user), loading: false, error: null });
      } catch (error) {
        listener({ user: null, claims: emptyClaims, loading: false, error: mapFirebaseAuthError(error) });
      }
    });
  },
};
