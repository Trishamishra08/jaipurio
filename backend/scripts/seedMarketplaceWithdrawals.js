/**
 * Ensure payout documents have legacyId/fee fields; create sample withdrawal
 * only when vendors + available earnings exist (no fake hard-coded rows).
 * Usage: node scripts/seedMarketplaceWithdrawals.js
 */
try {
  require('dotenv').config();
} catch {
  /* optional */
}
const mongoose = require('mongoose');
const Payout = require('../models/payoutModel');
const Earning = require('../models/earningModel');
const Vendor = require('../models/vendorModel');
const { nextPayoutNumber } = require('../utils/marketplace');

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri);

  const payouts = await Payout.find({});
  let patched = 0;
  let maxLegacy = 0;
  for (const p of payouts) {
    if (p.legacyId != null && p.legacyId > maxLegacy) maxLegacy = p.legacyId;
  }
  for (const p of payouts) {
    let dirty = false;
    if (p.legacyId == null) {
      maxLegacy += 1;
      p.legacyId = maxLegacy;
      dirty = true;
    }
    if (p.fee == null) {
      p.fee = 0;
      dirty = true;
    }
    if (p.status === 'Pending approval') {
      p.status = 'Pending';
      dirty = true;
    }
    if (p.status === 'Settled') {
      p.status = 'Completed';
      dirty = true;
    }
    if (p.status === 'Rejected') {
      p.status = 'Refused';
      dirty = true;
    }
    if (dirty) {
      await p.save();
      patched += 1;
    }
  }

  let created = 0;
  if (payouts.length === 0) {
    const vendor = await Vendor.findOne({ isApproved: true });
    if (vendor) {
      const earnings = await Earning.find({ vendor: vendor._id, status: 'Available' });
      const balance = earnings.reduce((s, e) => s + Number(e.netEarning || 0), 0);
      if (balance > 0) {
        await Payout.create({
          payoutNumber: await nextPayoutNumber(Payout),
          legacyId: 1,
          vendor: vendor._id,
          amount: balance,
          fee: 0,
          balanceAtRequest: balance,
          paymentMethod: 'Bank transfer',
          status: 'Pending',
          bankSnapshot: {
            accountHolderName: vendor.accountHolderName,
            bankName: vendor.bankName,
            accountNumber: vendor.accountNumber,
            ifscCode: vendor.ifscCode,
            upiId: vendor.upiId,
          },
          earningIds: earnings.map((e) => e._id),
        });
        created = 1;
      }
    }
  }

  console.log(
    JSON.stringify({
      total: await Payout.countDocuments(),
      patched,
      createdFromAvailableEarnings: created,
    })
  );
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
