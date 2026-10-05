// Flat permission keys used by Role.permissions and requirePermission().
// 'all' (on a Role) bypasses this list entirely — see authMiddleware.requirePermission.
const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_AFFILIATES: 'manage_affiliates',
  VIEW_REPORTS: 'view_reports',
  MANAGE_ORDERS: 'manage_orders',
  MANAGE_SUPPORT: 'manage_support',
};

const DEFAULT_ROLES = [
  {
    name: 'Super Administrator',
    description: 'Full platform access across all modules',
    permissions: ['all'],
    isSystem: true,
  },
  {
    name: 'Vendor / Artisan Support',
    description: 'Access to product upload, inventory, orders & payouts',
    permissions: [PERMISSIONS.MANAGE_ORDERS, PERMISSIONS.VIEW_REPORTS],
    isSystem: true,
  },
  {
    name: 'Support Manager',
    description: 'Tickets, customer inquiries, and order tracking',
    permissions: [PERMISSIONS.MANAGE_SUPPORT, PERMISSIONS.MANAGE_ORDERS],
    isSystem: true,
  },
];

module.exports = { PERMISSIONS, DEFAULT_ROLES };
