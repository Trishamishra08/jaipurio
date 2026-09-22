/**
 * Seed marketplace stores (Botble-style) and optionally sync from vendors.
 * Usage: node scripts/seedMarketplaceStores.js
 */
try {
  require('dotenv').config();
} catch {
  /* optional */
}
const mongoose = require('mongoose');
const MarketplaceStore = require('../models/marketplaceStoreModel');
const Vendor = require('../models/vendorModel');
const { slugify, normalizeSeo } = require('../utils/seoFields');
const {
  refreshStoreStats,
  nextLegacyId,
} = require('../controllers/marketplaceAdminController');

const FALLBACK_STORES = [
  {
    legacyId: 9,
    name: 'Caz',
    email: 'caz@jaipurio.in',
    phone: '9876543210',
    logo: '/jaipurio_logo.png',
    description: 'Handcrafted heritage store on Jaipurio marketplace.',
    status: 'Published',
    vendorName: 'Caz',
    companyName: 'Caz Crafts',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    isVerified: true,
  },
  {
    legacyId: 10,
    name: 'Shyam Pottery',
    email: 'shyam@jaipurio.in',
    phone: '9876501234',
    logo: '/matka.png',
    description: 'Traditional terracotta pottery from Jaipur pottery lanes.',
    status: 'Published',
    vendorName: 'Shyam Terracotta Artisans',
    companyName: 'Shyam Terracotta Artisans',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    isVerified: true,
  },
  {
    legacyId: 11,
    name: 'Meera Mitti Works',
    email: 'meera@jaipurio.in',
    phone: '9876505678',
    logo: '/kulhad.png',
    description: 'Handmade kulhads, planters and festive clayware.',
    status: 'Published',
    vendorName: 'Meera Mitti Works',
    companyName: 'Meera Mitti Works',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    isVerified: true,
  },
];

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri);

  let upserted = 0;
  for (const row of FALLBACK_STORES) {
    const slug = slugify(row.name);
    const seo = normalizeSeo({}, row.name, row.description || '');
    const doc = await MarketplaceStore.findOneAndUpdate(
      { legacyId: row.legacyId },
      {
        $set: {
          ...row,
          slug,
          seo,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await refreshStoreStats(doc);
    upserted += 1;
  }

  const vendors = await Vendor.find({}).select('-password');
  let synced = 0;
  for (const vendor of vendors) {
    const existing = await MarketplaceStore.findOne({
      $or: [{ vendor: vendor._id }, { email: vendor.email }],
    });
    if (existing) continue;
    const legacyId = await nextLegacyId();
    const name = vendor.storeName || vendor.businessName || vendor.fullName;
    const store = await MarketplaceStore.create({
      legacyId,
      name,
      slug: slugify(name),
      email: vendor.email || '',
      phone: vendor.mobile || '',
      description: vendor.storeDescription || '',
      vendor: vendor._id,
      vendorName: vendor.fullName || vendor.storeName,
      companyName: vendor.businessName || '',
      taxId: vendor.gstNumber || '',
      address: vendor.businessAddress || '',
      city: vendor.city || '',
      state: vendor.state || '',
      status: vendor.isBlocked ? 'Blocked' : vendor.isApproved ? 'Published' : 'Pending',
      isVerified: Boolean(vendor.isApproved),
      seo: normalizeSeo({}, name, vendor.storeDescription || ''),
    });
    await refreshStoreStats(store);
    synced += 1;
  }

  console.log(JSON.stringify({ upserted, syncedFromVendors: synced, total: await MarketplaceStore.countDocuments() }));
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
