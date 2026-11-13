/**
 * Creates (or resets the password of) ONE admin account with full access
 * (Super Administrator), for when you have no working admin login.
 *
 *   node scripts/createAdmin.js --email you@yourdomain.com             # preview only, writes nothing
 *   node scripts/createAdmin.js --email you@yourdomain.com --yes       # create (random password, printed once)
 *   node scripts/createAdmin.js --email you@yourdomain.com --yes --password "YourOwnStrongPass1"
 *   node scripts/createAdmin.js --email you@yourdomain.com --yes --reset-password   # account exists: set a new password
 *
 * --email is required on purpose: an admin account is a high-privilege login, so use a real
 * address that only you control. Needs MONGODB_URI in backend/.env, which is probably your
 * PRODUCTION database: the script shows which one and does nothing until you add --yes.
 * The password is random unless you pass one and is stored only as a bcrypt hash.
 * Then turn on two-factor: Admin → Profile → Two-factor (2FA).
 */
require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Role = require('../models/roleModel');
const ensureDefaultRoles = require('./ensureDefaultRoles');

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};

const randomPassword = () => crypto.randomBytes(12).toString('base64url'); // 16 chars
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function buildAdminDoc({ name, email, passwordHash, adminRole }) {
  return { name, email: email.toLowerCase(), password: passwordHash, role: 'admin', adminRole, isActive: true };
}

async function main() {
  const email = opt('email', '');
  const name = opt('name', 'Administrator');
  const given = opt('password', '');
  if (!validEmail(email)) throw new Error('--email is required, e.g. --email you@yourdomain.com');
  if (given && given.length < 10) throw new Error('--password must be at least 10 characters');

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in backend/.env');
  const host = (uri.match(/@([^/?]+)/) || [])[1] || 'unknown host';

  console.log(`Database : ${host}  (check this is the one you mean)`);
  console.log(`Account  : ${email.toLowerCase()}  (admin, Super Administrator)`);
  if (!flag('yes')) {
    console.log('\nPreview only. Nothing was written. Run again with --yes to create it.');
    return;
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  try {
    let role = await Role.findOne({ name: 'Super Administrator' });
    if (!role) {
      await ensureDefaultRoles(); // seeds the default admin roles (same as server start)
      role = await Role.findOne({ name: 'Super Administrator' });
    }
    if (!role) throw new Error('Super Administrator role could not be found or created.');

    const password = given || randomPassword();
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      if (!flag('reset-password')) {
        console.log('\nAn account with this email already exists. Nothing changed.');
        console.log('Add --reset-password to set a new password and make it an admin, or use another --email.');
        return;
      }
      existing.password = passwordHash;
      existing.role = 'admin';
      existing.adminRole = role._id;
      existing.isActive = true;
      existing.isBlocked = false;
      await existing.save();
      console.log(`\nPassword reset for ${existing.email}. It is an admin with full access.`);
    } else {
      await User.create(buildAdminDoc({ name, email, passwordHash, adminRole: role._id }));
      console.log('\nAdmin created.');
    }
    console.log(`\n  Login    : https://jaipurio.in/admin/login`);
    console.log(`  Email    : ${email.toLowerCase()}`);
    console.log(`  Password : ${password}${given ? '' : '   <- shown once, copy it now'}`);
    console.log('\nNext: sign in and turn on Two-factor under Admin → Profile.');
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { buildAdminDoc };
