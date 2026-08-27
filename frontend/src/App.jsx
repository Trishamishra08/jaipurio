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

import VendorLayout from './components/vendor/VendorLayout';
import VendorAuthGuard from './components/vendor/VendorAuthGuard';
import VendorLogin from './components/vendor/VendorLogin';
import VendorRegister from './components/vendor/VendorRegister';
import VendorHome from './components/vendor/VendorHome';
import VendorProducts from './components/vendor/VendorProducts';
import VendorAddProduct from './components/vendor/VendorAddProduct';
import VendorInventory from './components/vendor/VendorInventory';
import VendorOrders from './components/vendor/VendorOrders';
import VendorReturns from './components/vendor/VendorReturns';
import VendorLogistics from './components/vendor/VendorLogistics';
import VendorEarnings from './components/vendor/VendorEarnings';
import VendorPayouts from './components/vendor/VendorPayouts';
import VendorCoupons from './components/vendor/VendorCoupons';
import VendorReviews from './components/vendor/VendorReviews';
import VendorNotifications from './components/vendor/VendorNotifications';
import VendorAnalytics from './components/vendor/VendorAnalytics';
import VendorSupport from './components/vendor/VendorSupport';
import VendorSettings from './components/vendor/VendorSettings';
import VendorIncompleteOrders from './components/vendor/VendorIncompleteOrders';
import VendorShipments from './components/vendor/VendorShipments';
import VendorStorefront from './components/vendor/VendorStorefront';
import AdminRoutes from './components/admin/AdminRoutes';

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
    <div className="min-h-screen font-body bg-[#F8E6E4]">
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

          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route element={<VendorAuthGuard />}>
            <Route path="/vendor" element={<VendorLayout />}>
              <Route index element={<VendorHome />} />
              <Route path="dashboard" element={<VendorHome />} />
              <Route path="products" element={<VendorProducts />} />
              <Route path="add-product" element={<VendorAddProduct />} />
              <Route path="inventory" element={<VendorInventory />} />
              <Route path="orders" element={<VendorOrders />} />
              <Route path="incomplete-orders" element={<VendorIncompleteOrders />} />
              <Route path="shipments" element={<VendorShipments />} />
              <Route path="returns" element={<VendorReturns />} />
              <Route path="logistics" element={<VendorLogistics />} />
              <Route path="earnings" element={<VendorEarnings />} />
              <Route path="payouts" element={<VendorPayouts />} />
              <Route path="coupons" element={<VendorCoupons />} />
              <Route path="reviews" element={<VendorReviews />} />
              <Route path="notifications" element={<VendorNotifications />} />
              <Route path="analytics" element={<VendorAnalytics />} />
              <Route path="support" element={<VendorSupport />} />
              <Route path="storefront" element={<VendorStorefront />} />
              <Route path="settings" element={<VendorSettings />} />
            </Route>
          </Route>
          <Route path="/admin/*" element={<AdminRoutes />} />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </ShopProvider>
  );
}

export default App;
