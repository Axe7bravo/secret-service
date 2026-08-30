import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { customerAuthService } from './customerAuthService';
export function CustomerAuthGuard() {
  const location = useLocation();
  return customerAuthService.isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
