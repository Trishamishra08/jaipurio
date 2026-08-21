import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isAuthLoading } = useShop();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-10 h-10 border-4 border-[#054425]/20 border-t-[#054425] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
