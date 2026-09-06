import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AmbassadorAuthGuard } from './auth/AmbassadorAuthGuard';
import { Shell } from './components/Shell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OperationsPage } from './pages/OperationsPage';
import { OperationDetailPage } from './pages/OperationDetailPage';
import { AccountPage } from './pages/AccountPage';

export function App() {
  return <Routes><Route path="/login" element={<LoginPage />} /><Route element={<AmbassadorAuthGuard />}><Route element={<Shell />}><Route index element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<DashboardPage />} /><Route path="/operations" element={<OperationsPage />} /><Route path="/operations/:operationId" element={<OperationDetailPage />} /><Route path="/account" element={<AccountPage />} /><Route path="*" element={<main id="main" className="portal-main"><h1>Page not found</h1><Link to="/dashboard">Return to dashboard</Link></main>} /></Route></Route></Routes>;
}
