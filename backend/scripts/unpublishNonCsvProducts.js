'use strict';
require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/productModel');

const NON_CSV_SKUS = ['JAI-MIT-001', 'JAI-MIT-002', 'JAI-MIT-003', 'JAI-MIT-004'];

async function main() {
  await connectDB();

  const result = await Product.updateMany(
    { sku: { $in: NON_CSV_SKUS } },
    { $set: { lifecycle: 'Draft', status: 'pending', published: false } }
  );
  console.log('Unpublished:', JSON.stringify(result));

  const remaining = await Product.find({ sku: { $in: NON_CSV_SKUS } }).select('name sku lifecycle status');
  remaining.forEach((p) => console.log(`- ${p.sku} | ${p.name} | lifecycle=${p.lifecycle} | status=${p.status}`));

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
