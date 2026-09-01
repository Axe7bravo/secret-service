import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthGuard } from './auth/AdminAuthGuard';
import { AdminShell } from './components/AdminShell';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OperationDetailPage } from './pages/OperationDetailPage';
import { OperationsPage } from './pages/OperationsPage';
import { PackagesPage } from './pages/PackagesPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { RecipientsPage } from './pages/RecipientsPage';
import { RecipientDetailPage } from './pages/RecipientDetailPage';
import { DeliveriesPage } from './pages/DeliveriesPage';
import { AmbassadorsPage } from './pages/AmbassadorsPage';
import { AmbassadorDetailPage } from './pages/AmbassadorDetailPage';
import { CampusesPage } from './pages/CampusesPage';
import { CampusDetailPage } from './pages/CampusDetailPage';

export function App() {
  return <Routes>
    <Route path="login" element={<AdminLoginPage />} />
    <Route element={<AdminAuthGuard />}>
      <Route element={<AdminShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="operations/:operationId" element={<OperationDetailPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:customerId" element={<CustomerDetailPage />} />
        <Route path="recipients" element={<RecipientsPage />} />
        <Route path="recipients/:recipientId" element={<RecipientDetailPage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        <Route path="deliveries/:operationId" element={<OperationDetailPage />} />
        <Route path="ambassadors" element={<AmbassadorsPage />} />
        <Route path="ambassadors/:ambassadorId" element={<AmbassadorDetailPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="campuses" element={<CampusesPage />} />
        <Route path="campuses/:campusId" element={<CampusDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>;
}
