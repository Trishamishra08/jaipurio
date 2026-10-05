const mongoose = require('mongoose');

/**
 * Admin sub-roles — a permission layer on top of the existing coarse
 * `User.role` ('admin'/'vendor'/'user') gate, only meaningful for admin
 * accounts. 'all' in `permissions` means every permission (Super Administrator).
 */
const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false }, // seeded defaults — protected from deletion
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
