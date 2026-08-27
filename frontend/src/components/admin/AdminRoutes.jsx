import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminGuard from './AdminGuard';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminReports from './AdminReports';
import AdminOrderFlow from './AdminOrderFlow';
import AdminProductFlow from './AdminProductFlow';
import AdminInventory from './AdminInventory';
import AdminCategoryTree from './AdminCategoryTree';
import AdminReviews from './AdminReviews';
import AdminCoupons from './AdminCoupons';
import AdminOffers from './AdminOffers';
import AdminCustomers from './AdminCustomers';
import AdminVendors from './AdminVendors';
import AdminPayoutFlow from './AdminPayoutFlow';
import AdminBlogs from './AdminBlogs';
import AdminLocations from './AdminLocations';
import AdminSettings from './AdminSettings';
import AdminMedia from './AdminMedia';
import AdminAppearance from './AdminAppearance';
import AdminTools from './AdminTools';
import AdminCrudPage from './AdminCrudPage';
import AdminNotifications from './AdminNotifications';
import AdminSupport from './AdminSupport';
import AdminReturnFlow from './AdminReturnFlow';
import AdminLogistics from './AdminLogistics';
import AdminUsers from './AdminUsers';
import AdminSystem from './AdminSystem';
import AdminAffiliate from './AdminAffiliate';
import AdminSeoRedirects from './AdminSeoRedirects';
import AdminLocationTools from './AdminLocationTools';
import ProductEditorForm from '../shared/ProductEditorForm';
import AdminPageHeader from './AdminPageHeader';

const AdminRoutes = () => (
  <Routes>
    <Route path="login" element={<AdminLogin />} />
    <Route element={<AdminGuard />}>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="ecommerce/reports" element={<AdminReports />} />
        <Route path="orders" element={<AdminOrderFlow />} />
        <Route path="products" element={<AdminProductFlow />} />
        <Route path="products/new" element={<div><AdminPageHeader title="Create product" hideAction /><ProductEditorForm role="admin" /></div>} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="categories" element={<AdminCategoryTree />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="offers" element={<AdminOffers />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="vendors/pending" element={<AdminVendors />} />
        <Route path="vendors/blocked" element={<AdminVendors />} />
        <Route path="payouts" element={<AdminPayoutFlow />} />
        <Route path="blogs" element={<AdminBlogs />} />
        <Route path="locations" element={<AdminLocations />} />
        <Route path="locations/importer" element={<AdminLocationTools />} />
        <Route path="locations/exporter" element={<AdminLocationTools />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="media" element={<AdminMedia />} />
        <Route path="appearance/:section" element={<AdminAppearance />} />
        <Route path="tools/:section" element={<AdminTools />} />
        <Route path="system/:section" element={<AdminSystem />} />
        <Route path="platform" element={<AdminSystem />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="returns" element={<AdminReturnFlow />} />
        <Route path="logistics" element={<AdminLogistics />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="affiliates" element={<AdminAffiliate />} />
        <Route path="seo/redirects" element={<AdminSeoRedirects />} />
        <Route path="product-specification/:section" element={<AdminCrudPage />} />
        <Route path="*" element={<AdminCrudPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/admin" replace />} />
  </Routes>
);

export default AdminRoutes;
