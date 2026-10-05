const Role = require('../models/roleModel');
const User = require('../models/userModel');
const { DEFAULT_ROLES } = require('../constants/permissions');

/**
 * Seeds the 3 default admin sub-roles and assigns the Super Administrator
 * role to any admin account that doesn't have an adminRole yet (so existing
 * admins — including the demo admin — keep full access after this ships,
 * rather than being silently locked out of permission-gated routes).
 * Idempotent, safe to run on every server start.
 */
async function ensureDefaultRoles() {
  const roleIds = {};
  for (const def of DEFAULT_ROLES) {
    const role = await Role.findOneAndUpdate(
      { name: def.name },
      { $set: { description: def.description, permissions: def.permissions, isSystem: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    roleIds[def.name] = role._id;
  }

  const superAdminRoleId = roleIds['Super Administrator'];
  await User.updateMany(
    { role: 'admin', adminRole: null },
    { $set: { adminRole: superAdminRoleId } }
  );
}

module.exports = ensureDefaultRoles;
