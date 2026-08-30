import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { adminAuthService } from './adminAuthService';

export function AdminAuthGuard() {
  const location = useLocation();
  if (!adminAuthService.isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
