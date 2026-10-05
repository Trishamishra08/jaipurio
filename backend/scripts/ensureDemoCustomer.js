const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const DEMO_CUSTOMER = {
  name: 'Demo User',
  email: 'customer@gmail.com',
  password: 'customer123',
  role: 'user',
};

/**
 * Ensures the demo customer account exists with a known password (dev/demo).
 * The frontend's customerAuth.ensureCustomerAuth() logs into this account to
 * upgrade a "demo" browser session into a real JWT — safe to run on every
 * server start in non-production environments.
 */
async function ensureDemoCustomer() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO_ADMIN !== 'true') {
    return;
  }

  const email = DEMO_CUSTOMER.email.toLowerCase();
  const hashed = await bcrypt.hash(DEMO_CUSTOMER.password, 10);
  let customer = await User.findOne({ email });

  if (!customer) {
    await User.create({
      name: DEMO_CUSTOMER.name,
      email,
      password: hashed,
      role: DEMO_CUSTOMER.role,
    });
    console.log('Demo customer ready: customer@gmail.com / customer123');
    return;
  }

  let changed = false;
  if (customer.role !== 'user') {
    customer.role = 'user';
    changed = true;
  }
  if (!customer.password) {
    customer.password = hashed;
    changed = true;
  } else {
    const matches = await bcrypt.compare(DEMO_CUSTOMER.password, customer.password);
    if (!matches) {
      customer.password = hashed;
      changed = true;
    }
  }

  if (changed) {
    await customer.save();
    console.log('Demo customer account synced: customer@gmail.com / customer123');
  }
}

module.exports = ensureDemoCustomer;
