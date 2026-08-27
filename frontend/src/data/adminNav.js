import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Users,
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
  Server,
  BadgePercent,
  Search,
  ListChecks,
} from 'lucide-react';

export const adminNav = [
  { id: 'dashboard', title: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  {
    id: 'ecommerce',
    title: 'Ecommerce',
    icon: ShoppingBag,
    badgeKey: 'orders',
    children: [
      { title: 'Report', path: '/admin/ecommerce/reports' },
      { title: 'Orders', path: '/admin/orders' },
      { title: 'Incomplete Orders', path: '/admin/ecommerce/incomplete-orders' },
      { title: 'Order Returns', path: '/admin/returns' },
      { title: 'Shipments', path: '/admin/ecommerce/shipments' },
      { title: 'Invoices', path: '/admin/ecommerce/invoices' },
      { title: 'Products', path: '/admin/products' },
      { title: 'Product Prices', path: '/admin/ecommerce/product-prices' },
      { title: 'Product Inventory', path: '/admin/inventory' },
      { title: 'Product Categories', path: '/admin/categories' },
      { title: 'Product Tags', path: '/admin/ecommerce/tags' },
      { title: 'Product Attributes', path: '/admin/ecommerce/attribute-sets' },
      { title: 'Product Options', path: '/admin/ecommerce/options' },
      { title: 'Product Collections', path: '/admin/ecommerce/collections' },
      { title: 'Product Labels', path: '/admin/ecommerce/labels' },
      { title: 'Brands', path: '/admin/ecommerce/brands' },
      { title: 'Reviews', path: '/admin/reviews' },
      { title: 'Flash Sales', path: '/admin/offers' },
      { title: 'Discounts', path: '/admin/coupons' },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: Store,
    children: [
      { title: 'Vendors', path: '/admin/vendors' },
      { title: 'Product Specification', path: '/admin/product-specification/groups' },
    ],
  },
  { id: 'customers', title: 'Customers', path: '/admin/customers', icon: Users },
  { id: 'pages', title: 'Pages', path: '/admin/pages', icon: FileText },
  { id: 'blog', title: 'Blog', path: '/admin/blogs', icon: Newspaper },
  {
    id: 'payments',
    title: 'Payments',
    icon: CreditCard,
    children: [
      { title: 'Payments', path: '/admin/payments' },
      { title: 'Payment methods', path: '/admin/payments/methods' },
      { title: 'Commission & Payouts', path: '/admin/payouts' },
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
      { title: 'Contact Forms', path: '/admin/contact/forms' },
    ],
  },
  { id: 'slides', title: 'Simple Slides', path: '/admin/sliders', icon: Images },
  {
    id: 'faqs',
    title: 'FAQs',
    icon: HelpCircle,
    children: [
      { title: 'FAQs', path: '/admin/faqs' },
      { title: 'FAQ Categories', path: '/admin/faqs/categories' },
    ],
  },
  { id: 'newsletter', title: 'Newsletter', path: '/admin/newsletters', icon: Send },
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
    children: [{ title: 'Export/Import Data', path: '/admin/tools/import-export' }],
  },
  { id: 'settings', title: 'Settings', path: '/admin/settings', icon: Settings },
  { id: 'platform', title: 'Platform Administration', path: '/admin/platform', icon: Shield },
  {
    id: 'system',
    title: 'System',
    icon: Server,
    children: [
      { title: 'Users', path: '/admin/platform/users' },
      { title: 'Roles And Permissions', path: '/admin/system/roles' },
      { title: 'Activities Log', path: '/admin/platform/activity-logs' },
      { title: 'Backup', path: '/admin/system/backup' },
      { title: 'Cronjob', path: '/admin/system/cronjob' },
      { title: 'Cache Management', path: '/admin/system/cache' },
      { title: 'Cleanup System', path: '/admin/system/cleanup' },
      { title: 'System Information', path: '/admin/tools/system-info' },
    ],
  },
  { id: 'affiliate', title: 'Affiliate Program', path: '/admin/affiliates', icon: BadgePercent },
  { id: 'seo', title: 'SEO Redirect Mapping', path: '/admin/seo/redirects', icon: Search },
  {
    id: 'spec',
    title: 'Spec templates',
    icon: ListChecks,
    hidden: true,
    children: [
      { title: 'Specification Groups', path: '/admin/product-specification/groups' },
      { title: 'Specification Attributes', path: '/admin/product-specification/attributes' },
      { title: 'Specification Tables', path: '/admin/product-specification/tables' },
    ],
  },
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
  if (item.path) return pathname === item.path;
  return (item.children || []).some(
    (child) => pathname === child.path || pathname.startsWith(`${child.path}/`)
  );
}
