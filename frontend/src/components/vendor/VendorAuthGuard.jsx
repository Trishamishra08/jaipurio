import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const VendorAuthGuard = () => {
  const isVendorAuthenticated = localStorage.getItem('vendor_auth') === 'true';

  if (!isVendorAuthenticated) {
    return <Navigate to="/vendor/login" replace />;
  }

  return <Outlet />;
};

export default VendorAuthGuard;
