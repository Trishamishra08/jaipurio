import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';

import SplashPage from './components/shared/SplashPage';
import Navbar from './components/user/Navbar';
import Home from './components/user/Home';
import Shop from './components/user/Shop';
import ProductDetail from './components/user/ProductDetail';
import VendorPublicStore from './components/user/VendorPublicStore';
import Checkout from './components/user/Checkout';
import UserOrders from './components/user/UserOrders';
import Wishlist from './components/user/Wishlist';
import Profile from './components/user/Profile';
import LocationPage from './components/user/LocationPage';
import CartDrawer from './components/user/CartDrawer';
import Footer from './components/user/Footer';
import BottomNavigation from './components/user/BottomNavigation';
import Auth from './components/user/Auth';
import Register from './components/user/Register';

import VendorDashboard from './components/vendor/VendorDashboard';
import AdminDashboard from './components/admin/AdminDashboard';

const PublicLayout = () => {
  const { pathname } = useLocation();
  const showFooter = pathname === '/home';
  const isLocationPage = pathname === '/location';

  return (
    <div className="flex flex-col min-h-screen font-body bg-white">
      {!isLocationPage && <Navbar />}
      <CartDrawer />
      <main className="flex-1">
        <Outlet />
      </main>
      {showFooter && <Footer />}
      {!isLocationPage && <BottomNavigation />}
    </div>
  );
};

const AuthLayout = () => {
  return (
    <div className="min-h-screen font-body bg-[#F8F1E3]">
      <Outlet />
    </div>
  );
};

function App() {
  return (
    <ShopProvider>
      <Router>
        <Routes>
          {/* App load → splash → login */}
          <Route path="/" element={<SplashPage />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Main app after login */}
          <Route element={<PublicLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/vendors" element={<Navigate to="/vendor" replace />} />
            <Route path="/store/:id" element={<VendorPublicStore />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<UserOrders />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/location" element={<LocationPage />} />
            <Route
              path="/about"
              element={
                <div className="py-12 bg-white text-center px-4">
                  <h1 className="font-playfair text-2xl font-semibold text-[#3F261B]">
                    Our Heritage Story
                  </h1>
                  <p className="font-dm text-xs text-[#806653] mt-2 max-w-lg mx-auto">
                    jaipurio connects authentic local potters and handicraft families across
                    Rajasthan with craft lovers across India.
                  </p>
                </div>
              }
            />
            <Route
              path="/contact"
              element={
                <div className="py-12 bg-white text-center px-4">
                  <h1 className="font-playfair text-2xl font-semibold text-[#3F261B]">
                    Connect with jaipurio
                  </h1>
                  <p className="font-dm text-xs text-[#806653] mt-2">
                    Email: namaste@jaipurio.com • Phone: +91 98290 12345
                  </p>
                </div>
              }
            />
            <Route
              path="/notifications"
              element={
                <div className="py-12 bg-white text-center px-4">
                  <h1 className="font-playfair text-2xl font-semibold text-[#3F261B]">
                    Notifications
                  </h1>
                  <p className="font-dm text-xs text-[#806653] mt-2">
                    No unread notifications at this time.
                  </p>
                </div>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <div className="py-12 bg-white text-center px-4">
                  <h1 className="font-playfair text-2xl font-semibold text-[#3F261B]">
                    Privacy Policy
                  </h1>
                </div>
              }
            />
            <Route
              path="/terms-conditions"
              element={
                <div className="py-12 bg-white text-center px-4">
                  <h1 className="font-playfair text-2xl font-semibold text-[#3F261B]">
                    Terms & Conditions
                  </h1>
                </div>
              }
            />
            <Route
              path="/return-policy"
              element={
                <div className="py-12 bg-white text-center px-4">
                  <h1 className="font-playfair text-2xl font-semibold text-[#3F261B]">
                    Safe Fragile Shipping Policy
                  </h1>
                </div>
              }
            />
          </Route>

          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/register" element={<VendorDashboard />} />
          <Route path="/vendor/login" element={<VendorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </ShopProvider>
  );
}

export default App;
