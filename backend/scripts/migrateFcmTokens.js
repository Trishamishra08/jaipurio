/**
 * One-off: copies the legacy `fcmTokens` arrays on User / Vendor documents into
 * the DeviceToken collection (one row per token + role). Safe to re-run.
 *
 *   node scripts/migrateFcmTokens.js          # do it
 *   node scripts/migrateFcmTokens.js --dry    # just count
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Vendor = require('../models/vendorModel');
const DeviceToken = require('../models/deviceTokenModel');

const dry = process.argv.includes('--dry');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  let moved = 0;
  let skipped = 0;

  const copy = async (docs, role, ownerModel) => {
    for (const doc of docs) {
      for (const token of new Set((doc.fcmTokens || []).filter(Boolean))) {
        if (dry) { moved += 1; continue; }
        try {
          await DeviceToken.updateOne(
            { token, role },
            { $setOnInsert: { owner: doc._id, ownerModel, platform: 'web', app: 'web', lastSeenAt: new Date() } },
            { upsert: true }
          );
          moved += 1;
        } catch {
          skipped += 1;
        }
      }
    }
  };

  await copy(await User.find({ role: { $ne: 'admin' }, fcmTokens: { $exists: true, $ne: [] } }).select('_id fcmTokens'), 'user', 'User');
  // admins are Users with role 'admin' — file their tokens under the admin role
  const admins = await User.find({ role: 'admin', fcmTokens: { $exists: true, $ne: [] } }).select('_id fcmTokens');
  await copy(admins, 'admin', 'User');
  await copy(await Vendor.find({ fcmTokens: { $exists: true, $ne: [] } }).select('_id fcmTokens'), 'vendor', 'Vendor');

  console.log(`${dry ? 'Would copy' : 'Copied'} ${moved} token(s)${skipped ? `, ${skipped} skipped` : ''}.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
