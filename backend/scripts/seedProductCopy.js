/**
 * Force-write rich description + content for every product (distinct fields).
 * Usage: node scripts/seedProductCopy.js
 */
try {
  require('dotenv').config();
} catch {
  /* optional */
}
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const {
  buildDescriptionHtml,
  buildContentHtml,
} = require('../utils/productCopy');

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri);

  const products = await Product.find({}).select('_id name title description content');
  let updated = 0;
  for (const p of products) {
    const name = p.title || p.name || 'Jaipurio handmade piece';
    const nextDesc = buildDescriptionHtml(name);
    const nextContent = buildContentHtml(name);
    if (p.description === nextDesc && p.content === nextContent) continue;
    p.description = nextDesc;
    p.content = nextContent;
    await p.save();
    updated += 1;
    console.log('updated', String(p._id), name.slice(0, 50));
  }

  console.log(JSON.stringify({ total: products.length, updated }));
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
