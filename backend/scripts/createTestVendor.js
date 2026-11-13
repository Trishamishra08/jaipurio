/**
 * Creates (or resets) ONE test seller account that is already approved, so you can
 * sign in at /vendor/login without going through registration + admin approval.
 *
 *   node scripts/createTestVendor.js                       # preview only, writes nothing
 *   node scripts/createTestVendor.js --yes                 # create it (random password, printed once)
 *   node scripts/createTestVendor.js --yes --password "YourOwnPass1"
 *   node scripts/createTestVendor.js --yes --email seller.test@jaipurio.in --mobile 9000000012
 *   node scripts/createTestVendor.js --yes --reset-password   # existing account: set a new password
 *
 * Needs MONGODB_URI in backend/.env. That is probably your PRODUCTION database, so the
 * script shows which database it will use and does nothing until you add --yes.
 * Nothing is hard-coded: the password is random unless you pass one, and it is never stored in plain text.
 * Delete the account from Admin → Vendors when you are done testing.
 */
require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Vendor = require('../models/vendorModel');
const { VENDOR_PLANS } = require('../constants/flow');

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};

const randomPassword = () => crypto.randomBytes(12).toString('base64url'); // 16 chars

/** The vendor document, shaped like an approved registration (see vendorController.approveVendor). */
function buildVendorDoc({ email, mobile, passwordHash, businessName }) {
  return {
    fullName: 'Test Seller',
    email: email.toLowerCase(),
    mobile,
    password: passwordHash,
    businessName,
    // Obviously fake test data — never a real GSTIN/bank account.
    gstNumber: '08ABCDE1234F1Z5',
    businessType: 'Individual',
    businessAddress: 'Test address, Johari Bazaar',
    city: 'Jaipur',
    state: 'Rajasthan',
    accountHolderName: 'Test Seller',
    bankName: 'Test Bank',
    accountNumber: '000000000000',
    ifscCode: 'TEST0000000',
    storeName: businessName,
    storeDescription: 'Test seller account for checking the seller panel. Safe to delete.',
    pickupAddress: 'Test address, Johari Bazaar, Jaipur, Rajasthan',
    // Already approved, like a vendor an admin has approved:
    isApproved: true,
    isBlocked: false,
    kycStatus: 'Verified',
    bankVerified: true,
    plan: 'Starter',
    commissionRate: VENDOR_PLANS.Starter.commissionRate,
  };
}

async function main() {
  const email = opt('email', 'test.seller@jaipurio.in');
  const mobile = opt('mobile', '9000000011');
  const businessName = opt('business-name', 'Test Seller Store');
  const given = opt('password', '');
  if (given && given.length < 8) throw new Error('--password must be at least 8 characters');

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in backend/.env');
  const host = (uri.match(/@([^/?]+)/) || [])[1] || 'unknown host';

  console.log(`Database : ${host}  (check this is the one you mean)`);
  console.log(`Account  : ${email}   mobile ${mobile}   store "${businessName}"`);
  if (!flag('yes')) {
    console.log('\nPreview only. Nothing was written. Run again with --yes to create it.');
    return;
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  try {
    const existing = await Vendor.findOne({ $or: [{ email: email.toLowerCase() }, { mobile }] });
    const password = given || randomPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      if (!flag('reset-password')) {
        console.log('\nA vendor with this email or mobile already exists. Nothing changed.');
        console.log('Add --reset-password to set a new password (and approve it), or pick another --email/--mobile.');
        return;
      }
      // The match may have come from the mobile number alone. Never touch someone else's account.
      if (existing.email.toLowerCase() !== email.toLowerCase()) {
        console.log(`\nStopped: ${existing.email} already uses mobile ${mobile}, and it is not ${email}.`);
        console.log('That looks like a real vendor, so its password was NOT changed. Pick another --mobile.');
        return;
      }
      existing.password = passwordHash;
      existing.isApproved = true;
      existing.isBlocked = false;
      await existing.save();
      console.log(`\nPassword reset for ${existing.email} (approved).`);
    } else {
      await Vendor.create(buildVendorDoc({ email, mobile, passwordHash, businessName }));
      console.log('\nTest seller created and approved.');
    }
    console.log(`\n  Login    : https://jaipurio.in/vendor/login`);
    console.log(`  Email    : ${email}`);
    console.log(`  Password : ${password}${given ? '' : '   <- shown once, copy it now'}`);
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

module.exports = { buildVendorDoc };
