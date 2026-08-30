import { Navigate, Route, Routes } from 'react-router-dom';
import { CustomerAuthGuard } from './auth/CustomerAuthGuard';
import { CustomerShell } from './components/CustomerShell';
import { AccountPage } from './pages/AccountPage';
import { CustomerLoginPage } from './pages/CustomerLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OperationDetailPage } from './pages/OperationDetailPage';
import { OperationsPage } from './pages/OperationsPage';

export function App() {
  return <Routes>
    <Route path="login" element={<CustomerLoginPage />} />
    <Route element={<CustomerAuthGuard />}>
      <Route element={<CustomerShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="operations/:operationId" element={<OperationDetailPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>;
}
