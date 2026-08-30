import { MOCK_ADMIN_CREDENTIALS, MOCK_ADMIN_SESSION_KEY } from './mockAdminAuth';

const MOCK_SESSION_VALUE = 'authenticated';

export const adminAuthService = {
  login(email: string, password: string): boolean {
    const accepted = email.trim().toLocaleLowerCase('en-ZA') === MOCK_ADMIN_CREDENTIALS.email && password === MOCK_ADMIN_CREDENTIALS.password;
    if (accepted) sessionStorage.setItem(MOCK_ADMIN_SESSION_KEY, MOCK_SESSION_VALUE);
    return accepted;
  },

  logout(): void {
    sessionStorage.removeItem(MOCK_ADMIN_SESSION_KEY);
  },

  isAuthenticated(): boolean {
    return sessionStorage.getItem(MOCK_ADMIN_SESSION_KEY) === MOCK_SESSION_VALUE;
  },
};
