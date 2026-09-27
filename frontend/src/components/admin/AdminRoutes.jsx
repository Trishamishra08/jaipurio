import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import EcommerceLayout from './ecommerce/EcommerceLayout';
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
import AdminLocations from './AdminLocations';
import AdminSettings from './AdminSettings';
import AdminBotbleSettings from './AdminBotbleSettings';
import AdminDataSynchronize from './AdminDataSynchronize';
import AdminSystemPage from './AdminSystemPage';
import AdminMedia from './AdminMedia';
import AdminAppearance from './AdminAppearance';
import AdminThemeOptions from './AdminThemeOptions';
import AdminCodeEditorPage from './AdminCodeEditorPage';
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
import AdminLocationImporter from './AdminLocationImporter';
import AdminLocationExporter from './AdminLocationExporter';
import AdminPaymentMethods from './AdminPaymentMethods';
import AdminAds from './AdminAds';
import AdminAdsSettings from './AdminAdsSettings';
import AdminContacts from './AdminContacts';
import AdminContactEdit from './AdminContactEdit';
import AdminContactCustomFields from './AdminContactCustomFields';
import AdminContactCustomFieldEdit from './AdminContactCustomFieldEdit';
import AdminSimpleSliders from './AdminSimpleSliders';
import AdminSimpleSliderEdit from './AdminSimpleSliderEdit';
import AdminFaqs from './AdminFaqs';
import AdminFaqEdit from './AdminFaqEdit';
import AdminFaqCategories from './AdminFaqCategories';
import AdminFaqCategoryEdit from './AdminFaqCategoryEdit';
import AdminNewsletters from './AdminNewsletters';
import AdminCountries from './AdminCountries';
import AdminCountryEdit from './AdminCountryEdit';
import AdminStates from './AdminStates';
import AdminStateEdit from './AdminStateEdit';
import AdminCities from './AdminCities';
import AdminCityEdit from './AdminCityEdit';
import AdminMenus from './AdminMenus';
import AdminMenuEdit from './AdminMenuEdit';
import AdminWidgets from './AdminWidgets';
import AdminProfile from './AdminProfile';
import ProductEditorForm from '../shared/ProductEditorForm';
import AdminPageHeader from './AdminPageHeader';
import './admin.css';

const AdminRoutes = () => (
  <Routes>
    <Route path="login" element={<AdminLogin />} />
    <Route element={<EcommerceLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="ecommerce/reports" element={<AdminReports />} />
      <Route path="orders" element={<AdminOrderFlow />} />
      <Route path="products" element={<AdminProductFlow />} />
      <Route
        path="products/new"
        element={
          <div>
            <AdminPageHeader title="Create product" hideAction />
            <ProductEditorForm role="admin" />
          </div>
        }
      />
      <Route path="inventory" element={<AdminInventory />} />
      <Route path="categories" element={<AdminCategoryTree />} />
      <Route path="reviews" element={<AdminReviews />} />
      <Route path="coupons" element={<AdminCoupons />} />
      <Route path="offers" element={<AdminOffers />} />
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="vendors" element={<Navigate to="/admin/marketplaces/stores" replace />} />
      <Route path="vendors/pending" element={<AdminVendors />} />
      <Route path="vendors/blocked" element={<AdminVendors />} />
      <Route path="marketplace/unverified-vendors" element={<AdminVendors />} />
      <Route path="marketplaces/reports" element={<Navigate to="/admin/marketplaces/reports" replace />} />
      <Route path="marketplaces/stores" element={<Navigate to="/admin/marketplaces/stores" replace />} />
      <Route path="payouts" element={<Navigate to="/admin/marketplaces/withdrawals" replace />} />
      <Route path="marketplaces/withdrawals" element={<Navigate to="/admin/marketplaces/withdrawals" replace />} />
      <Route path="blogs" element={<Navigate to="/admin/blogs" replace />} />
      <Route path="blogs/*" element={<Navigate to="/admin/blogs" replace />} />
      <Route path="locations" element={<AdminLocations />} />
      <Route path="locations/importer" element={<AdminLocationImporter />} />
      <Route path="locations/exporter" element={<AdminLocationExporter />} />
      <Route path="settings" element={<AdminBotbleSettings />} />
      <Route path="settings/profile" element={<AdminSettings />} />
      <Route path="media" element={<AdminMedia />} />
      <Route path="theme/options" element={<AdminThemeOptions />} />
      <Route path="theme/options/:tab" element={<AdminThemeOptions />} />
      <Route path="appearance/theme-options" element={<AdminThemeOptions />} />
      <Route path="appearance/theme-options/:tab" element={<AdminThemeOptions />} />
      <Route path="theme/robots-txt" element={<AdminCodeEditorPage />} />
      <Route path="theme/robots" element={<Navigate to="/admin/theme/robots-txt" replace />} />
      <Route path="theme/custom-css" element={<AdminCodeEditorPage />} />
      <Route path="theme/custom-js" element={<AdminCodeEditorPage />} />
      <Route path="theme/custom-html" element={<AdminCodeEditorPage />} />
      <Route path="appearance/robots-txt" element={<AdminCodeEditorPage />} />
      <Route path="appearance/robots" element={<Navigate to="/admin/theme/robots-txt" replace />} />
      <Route path="appearance/custom-css" element={<Navigate to="/admin/theme/custom-css" replace />} />
      <Route path="appearance/custom-js" element={<Navigate to="/admin/theme/custom-js" replace />} />
      <Route path="appearance/custom-html" element={<Navigate to="/admin/theme/custom-html" replace />} />
      <Route path="appearance/:section" element={<AdminAppearance />} />
      <Route path="tools/data-synchronize" element={<AdminDataSynchronize />} />
      <Route path="tools/import-export" element={<Navigate to="/admin/tools/data-synchronize" replace />} />
      <Route path="tools/:section" element={<AdminTools />} />
      <Route path="system" element={<AdminSystemPage />} />
      <Route path="platform" element={<Navigate to="/admin/system" replace />} />
      <Route path="system/:section" element={<AdminSystemPage />} />
      <Route path="notifications" element={<AdminNotifications />} />
      <Route path="support" element={<AdminSupport />} />
      <Route path="returns" element={<AdminReturnFlow />} />
      <Route path="logistics" element={<AdminLogistics />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="affiliates" element={<AdminAffiliate />} />
      <Route path="seo/redirects" element={<AdminSeoRedirects />} />
      <Route path="payments/methods" element={<AdminPaymentMethods />} />
      <Route path="contacts" element={<AdminContacts />} />
      <Route path="contacts/edit/:id" element={<AdminContactEdit />} />
      <Route path="contacts/custom-fields" element={<AdminContactCustomFields />} />
      <Route path="contacts/custom-fields/create" element={<AdminContactCustomFieldEdit />} />
      <Route path="contacts/custom-fields/edit/:id" element={<AdminContactCustomFieldEdit />} />
      <Route path="ads" element={<AdminAds />} />
      <Route path="ads/settings" element={<AdminAdsSettings />} />
      {/* Product specification pages are mounted in App.jsx under /admin/ecommerce/specification-* */}
      <Route path="simple-sliders" element={<AdminSimpleSliders />} />
      <Route path="simple-sliders/create" element={<AdminSimpleSliderEdit />} />
      <Route path="simple-sliders/edit/:id" element={<AdminSimpleSliderEdit />} />
      <Route path="sliders" element={<Navigate to="/admin/simple-sliders" replace />} />
      <Route path="faqs" element={<AdminFaqs />} />
      <Route path="faqs/create" element={<AdminFaqEdit />} />
      <Route path="faqs/edit/:id" element={<AdminFaqEdit />} />
      <Route path="faqs/categories" element={<AdminFaqCategories />} />
      <Route path="faqs/categories/create" element={<AdminFaqCategoryEdit />} />
      <Route path="faqs/categories/edit/:id" element={<AdminFaqCategoryEdit />} />
      <Route path="newsletters" element={<AdminNewsletters />} />
      <Route path="locations/countries" element={<AdminCountries />} />
      <Route path="locations/countries/create" element={<AdminCountryEdit />} />
      <Route path="locations/countries/edit/:id" element={<AdminCountryEdit />} />
      <Route path="locations/states" element={<AdminStates />} />
      <Route path="locations/states/create" element={<AdminStateEdit />} />
      <Route path="locations/states/edit/:id" element={<AdminStateEdit />} />
      <Route path="locations/cities" element={<AdminCities />} />
      <Route path="locations/cities/create" element={<AdminCityEdit />} />
      <Route path="locations/cities/edit/:id" element={<AdminCityEdit />} />
      <Route path="menus" element={<AdminMenus />} />
      <Route path="menus/create" element={<AdminMenuEdit />} />
      <Route path="menus/edit/:id" element={<AdminMenuEdit />} />
      <Route path="appearance/menus" element={<Navigate to="/admin/menus" replace />} />
      <Route path="widgets" element={<AdminWidgets />} />
      <Route path="appearance/widgets" element={<Navigate to="/admin/widgets" replace />} />
      <Route path="profile" element={<AdminProfile />} />
      <Route path="system/users/profile/:id" element={<AdminProfile />} />
      <Route path="*" element={<AdminCrudPage />} />
    </Route>
  </Routes>
);

export default AdminRoutes;
