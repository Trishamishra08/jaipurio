import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAdminAuthenticated, logoutAdmin } from '../../utils/adminAuth';

/**
 * Wraps every admin page. Without a valid admin session (unexpired admin JWT)
 * the visitor is sent to /admin/login and comes back to the page they asked
 * for after signing in. The admin APIs check the token on the server too —
 * this only stops the panel from rendering for anonymous visitors.
 */
const AdminAuthGuard = () => {
  const location = useLocation();

  if (!isAdminAuthenticated()) {
    logoutAdmin(); // clear a stale/expired session so the login page doesn't bounce back
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
};

export default AdminAuthGuard;
