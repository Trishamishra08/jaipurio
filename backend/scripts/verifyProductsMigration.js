const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

async function verifyMigration() {
  await connectDB();
  console.log('MongoDB Connected.\n');

  const total = await Product.countDocuments();
  const published = await Product.countDocuments({ published: true });
  const pending = await Product.countDocuments({ published: false });
  const withVariants = await Product.countDocuments({ hasVariants: true });
  const featured = await Product.countDocuments({ isFeatured: true });
  const withImages = await Product.countDocuments({ 'images.0': { $exists: true } });
  const withCategoryRef = await Product.countDocuments({ categoryRef: { $ne: null } });

  const catBreakdown = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
    { $sort: { count: -1 } }
  ]);

  const samples = await Product.find()
    .limit(4)
    .select('name price salePrice oldPrice category sku isFeatured hasVariants variants images published')
    .lean();

  console.log('====================================================');
  console.log(' PRODUCT MIGRATION VERIFICATION AUDIT');
  console.log('====================================================');
  console.log(`Total Products in DB    : ${total}`);
  console.log(`Published Products      : ${published}`);
  console.log(`Draft / Pending         : ${pending}`);
  console.log(`Products with Variants  : ${withVariants}`);
  console.log(`Featured Products       : ${featured}`);
  console.log(`Products with Images    : ${withImages}`);
  console.log(`Products with Linked Cat: ${withCategoryRef}`);

  console.log('\n--- Breakdown by Category ---');
  catBreakdown.forEach(c => {
    console.log(`  • ${c._id || 'Unassigned'}: ${c.count} products (Avg Price: ₹${(c.avgPrice || 0).toFixed(2)})`);
  });

  console.log('\n--- Sample Records ---');
  samples.forEach((s, idx) => {
    console.log(`\n[#${idx + 1}] ${s.name}`);
    console.log(`  SKU: ${s.sku} | Cat: ${s.category} | Published: ${s.published}`);
    console.log(`  Price: ₹${s.price} | Sale Price: ₹${s.salePrice || 'N/A'} | Old Price: ₹${s.oldPrice || 'N/A'}`);
    console.log(`  Variants Count: ${(s.variants || []).length} (hasVariants: ${s.hasVariants})`);
    console.log(`  First Image: ${s.images && s.images[0] ? s.images[0] : 'None'}`);
  });

  await mongoose.disconnect();
}

verifyMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
