import { Navigate, Route, Routes } from 'react-router-dom';
import { CustomerAuthGuard } from './auth/CustomerAuthGuard';
import { CustomerLoginPage } from './pages/CustomerLoginPage';
import { CustomerSignupPage } from './pages/CustomerSignupPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { CustomerOperationsPage } from './pages/CustomerOperationsPage';
import { CustomerOperationDetailPage } from './pages/CustomerOperationDetailPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { CustomerShell } from './components/CustomerShell';

export function App() {
  return <Routes>
    <Route path="login" element={<CustomerLoginPage />} />
    <Route path="signup" element={<CustomerSignupPage />} />
    <Route element={<CustomerAuthGuard />}>
      <Route element={<CustomerShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboardPage />} />
        <Route path="operations" element={<CustomerOperationsPage />} />
        <Route path="operations/:operationId" element={<CustomerOperationDetailPage />} />
        <Route path="account" element={<CustomerAccountPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Route>
  </Routes>;
}
