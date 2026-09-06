import { createContext, useContext } from 'react';
import type { AuthSession } from '../../../../packages/firebase/src';

export interface AmbassadorAuth extends AuthSession {
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
}
export const AuthContext = createContext<AmbassadorAuth | null>(null);
export const useAmbassadorAuth = (): AmbassadorAuth => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AmbassadorAuthProvider is required.');
  return value;
};
