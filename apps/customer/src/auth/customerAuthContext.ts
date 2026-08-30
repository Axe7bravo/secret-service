import { createContext, useContext } from 'react';
import type { AuthSession, SignUpInput } from '../../../../packages/firebase/src';

export interface CustomerAuthContextValue extends AuthSession {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
}

export const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export const useCustomerAuth = (): CustomerAuthContextValue => {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error('useCustomerAuth must be used inside CustomerAuthProvider.');
  return context;
};
