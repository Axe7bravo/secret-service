import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthGuard } from './auth/AdminAuthGuard';
import { AdminShell } from './components/AdminShell';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OperationDetailPage } from './pages/OperationDetailPage';
import { OperationsPage } from './pages/OperationsPage';

export function App() {
  return <Routes>
    <Route path="login" element={<AdminLoginPage />} />
    <Route element={<AdminAuthGuard />}>
      <Route element={<AdminShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="operations/:operationId" element={<OperationDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>;
}
