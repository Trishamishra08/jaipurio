import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  FileText,
  Newspaper,
  CreditCard,
  Megaphone,
  Mail,
  Images,
  HelpCircle,
  Send,
  MapPin,
  Image,
  Palette,
  Wrench,
  Settings,
  Shield,
  ListChecks,
} from 'lucide-react';

/** Sidebar structure mirrored from https://jaipurio.in/admin */
export const adminNav = [
  { id: 'dashboard', title: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  {
    id: 'ecommerce',
    title: 'Ecommerce',
    icon: ShoppingBag,
    badgeKey: 'pendingActions',
    children: [
      { title: 'Report', path: '/admin/ecommerce/reports' },
      { title: 'Orders', path: '/admin/ecommerce/orders', badgeKey: 'pendingOrders' },
      { title: 'Incomplete orders', path: '/admin/ecommerce/incomplete-orders' },
      { title: 'Order returns', path: '/admin/ecommerce/order-returns' },
      { title: 'Shipments', path: '/admin/ecommerce/shipments' },
      { title: 'Invoices', path: '/admin/ecommerce/invoices' },
      { title: 'Products', path: '/admin/ecommerce/products', badgeKey: 'pendingProducts' },
      { title: 'Product Prices', path: '/admin/ecommerce/product-prices' },
      { title: 'Product Inventory', path: '/admin/ecommerce/product-inventory' },
      { title: 'Product categories', path: '/admin/ecommerce/product-categories' },
      { title: 'Product tags', path: '/admin/ecommerce/product-tags' },
      { title: 'Product attributes', path: '/admin/ecommerce/product-attribute-sets' },
      { title: 'Product options', path: '/admin/ecommerce/options' },
      { title: 'Product collections', path: '/admin/ecommerce/product-collections' },
      { title: 'Product labels', path: '/admin/ecommerce/product-labels' },
      { title: 'Brands', path: '/admin/ecommerce/brands' },
      { title: 'Reviews', path: '/admin/ecommerce/reviews' },
      { title: 'Flash sales', path: '/admin/ecommerce/flash-sales' },
      { title: 'Discounts', path: '/admin/ecommerce/discounts' },
      { title: 'Customers', path: '/admin/customers' },
    ],
  },
  {
    id: 'product-specification',
    title: 'Product Specification',
    icon: ListChecks,
    children: [
      { title: 'Specification Groups', path: '/admin/ecommerce/specification-groups' },
      { title: 'Specification Attributes', path: '/admin/ecommerce/specification-attributes' },
      { title: 'Specification Tables', path: '/admin/ecommerce/specification-tables' },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: Store,
    children: [
      { title: 'Reports', path: '/admin/marketplaces/reports' },
      { title: 'Stores', path: '/admin/marketplaces/stores' },
      { title: 'Withdrawals', path: '/admin/marketplaces/withdrawals' },
      { title: 'Unverified vendors', path: '/admin/marketplace/unverified-vendors' },
    ],
  },
  { id: 'pages', title: 'Pages', path: '/admin/pages', icon: FileText },
  {
    id: 'blog',
    title: 'Blog',
    icon: Newspaper,
    children: [
      { title: 'Posts', path: '/admin/blogs' },
      { title: 'Categories', path: '/admin/blog/categories' },
      { title: 'Tags', path: '/admin/blog/tags' },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    icon: CreditCard,
    children: [
      { title: 'Transactions', path: '/admin/payments' },
      { title: 'Logs', path: '/admin/payments/logs' },
      { title: 'Payment methods', path: '/admin/payments/methods' },
    ],
  },
  {
    id: 'ads',
    title: 'Ads',
    icon: Megaphone,
    children: [
      { title: 'Ads', path: '/admin/ads' },
      { title: 'Ads Settings', path: '/admin/ads/settings' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: Mail,
    badgeKey: 'contacts',
    children: [
      { title: 'Submissions', path: '/admin/contacts' },
      { title: 'Custom Fields', path: '/admin/contacts/custom-fields' },
      { title: 'Contact Forms', path: '/admin/contact/forms' },
    ],
  },
  { id: 'slides', title: 'Simple Sliders', path: '/admin/simple-sliders', icon: Images },
  {
    id: 'faqs',
    title: 'FAQs',
    icon: HelpCircle,
    children: [
      { title: 'FAQs', path: '/admin/faqs' },
      { title: 'FAQ Categories', path: '/admin/faqs/categories' },
    ],
  },
  { id: 'newsletter', title: 'Newsletters', path: '/admin/newsletters', icon: Send },
  {
    id: 'locations',
    title: 'Locations',
    icon: MapPin,
    children: [
      { title: 'Countries', path: '/admin/locations/countries' },
      { title: 'States', path: '/admin/locations/states' },
      { title: 'Cities', path: '/admin/locations/cities' },
      { title: 'Location Importer', path: '/admin/locations/importer' },
      { title: 'Location Exporter', path: '/admin/locations/exporter' },
    ],
  },
  { id: 'media', title: 'Media', path: '/admin/media', icon: Image },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    children: [
      { title: 'Menus', path: '/admin/appearance/menus' },
      { title: 'Theme Options', path: '/admin/appearance/theme-options' },
      { title: 'Custom CSS', path: '/admin/appearance/custom-css' },
      { title: 'Custom JS', path: '/admin/appearance/custom-js' },
      { title: 'Custom HTML', path: '/admin/appearance/custom-html' },
      { title: 'Robots.txt Editor', path: '/admin/appearance/robots' },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    icon: Wrench,
    children: [
      { title: 'Plugins', path: '/admin/tools/plugins' },
      { title: 'Export/Import Data', path: '/admin/tools/import-export' },
      { title: 'System Information', path: '/admin/tools/system-info' },
    ],
  },
  { id: 'settings', title: 'Settings', path: '/admin/settings', icon: Settings },
  { id: 'platform', title: 'Platform Administration', path: '/admin/system', icon: Shield },
];

export function flattenAdminNav() {
  const items = [];
  adminNav.filter((item) => !item.hidden).forEach((item) => {
    if (item.path) items.push({ title: item.title, path: item.path, group: item.title });
    (item.children || []).forEach((child) => {
      items.push({ title: child.title, path: child.path, group: item.title });
    });
  });
  return items;
}

export function isNavItemActive(item, pathname) {
  if (item.path) {
    if (item.path === '/admin') return pathname === '/admin';
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  }
  return (item.children || []).some(
    (child) => pathname === child.path || pathname.startsWith(`${child.path}/`)
  );
}

export function isChildNavActive(path, pathname) {
  if (!path) return false;
  if (path === '/admin') return pathname === '/admin';
  return pathname === path || pathname.startsWith(`${path}/`);
}
