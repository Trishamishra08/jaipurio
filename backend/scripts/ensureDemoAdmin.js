const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const DEMO_ADMIN = {
  name: 'Admin Final',
  email: 'admin@gmail.com',
  password: 'admin',
  role: 'admin',
};

/**
 * Creates the demo admin account if it does not exist yet (dev/demo).
 * Safe to run on every server start in non-production environments.
 */
async function ensureDemoAdmin() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO_ADMIN !== 'true') {
    return;
  }

  const email = DEMO_ADMIN.email.toLowerCase();
  const hashed = await bcrypt.hash(DEMO_ADMIN.password, 10);
  let admin = await User.findOne({ email });

  if (!admin) {
    await User.create({
      name: DEMO_ADMIN.name,
      email,
      password: hashed,
      role: DEMO_ADMIN.role,
    });
    console.log('Demo admin ready: admin@gmail.com / admin');
    return;
  }

  // An existing account keeps its password — a changed admin password must never be reset on restart.
  if (!admin.password) {
    admin.password = hashed;
    await admin.save();
    console.log('Demo admin had no password; set to the demo password.');
  }
}

module.exports = ensureDemoAdmin;
