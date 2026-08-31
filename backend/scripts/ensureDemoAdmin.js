const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const DEMO_ADMIN = {
  name: 'Admin Final',
  email: 'admin@gmail.com',
  password: 'admin',
  role: 'admin',
};

/**
 * Ensures the demo admin account exists with a known password (dev/demo).
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

  let changed = false;
  if (admin.role !== 'admin') {
    admin.role = 'admin';
    changed = true;
  }
  if (!admin.password) {
    admin.password = hashed;
    changed = true;
  } else {
    const matches = await bcrypt.compare(DEMO_ADMIN.password, admin.password);
    if (!matches) {
      admin.password = hashed;
      changed = true;
    }
  }

  if (changed) {
    await admin.save();
    console.log('Demo admin account synced: admin@gmail.com / admin');
  }
}

module.exports = ensureDemoAdmin;
