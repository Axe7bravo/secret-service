import { MOCK_CUSTOMER_CREDENTIALS, MOCK_CUSTOMER_SESSION_KEY } from './mockCustomerAuth';
const SESSION_VALUE = 'authenticated';
export const customerAuthService = {
  login(email: string, password: string) {
    const accepted = email.trim().toLocaleLowerCase('en-ZA') === MOCK_CUSTOMER_CREDENTIALS.email && password === MOCK_CUSTOMER_CREDENTIALS.password;
    if (accepted) sessionStorage.setItem(MOCK_CUSTOMER_SESSION_KEY, SESSION_VALUE);
    return accepted;
  },
  logout() { sessionStorage.removeItem(MOCK_CUSTOMER_SESSION_KEY); },
  isAuthenticated() { return sessionStorage.getItem(MOCK_CUSTOMER_SESSION_KEY) === SESSION_VALUE; },
};
