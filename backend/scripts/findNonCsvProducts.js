'use strict';
require('dotenv').config();
const fs = require('fs');
const connectDB = require('../config/db');
const Product = require('../models/productModel');

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') {}
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function main() {
  const text = fs.readFileSync('D:/desktop/jaipurio/old db/ec_products.csv', 'utf8');
  const rows = parseCsv(text);
  const header = rows[0];
  const idx = {};
  header.forEach((h, i) => (idx[h] = i));
  const csvSkus = new Set();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 20) continue;
    if (r[idx.sku]) csvSkus.add(r[idx.sku]);
  }
  console.log('CSV unique SKUs:', csvSkus.size);

  await connectDB();
  const products = await Product.find({}).select('name sku category price lifecycle status');
  const notInCsv = products.filter((p) => !p.sku || !csvSkus.has(p.sku));

  console.log(`\nProducts NOT found in CSV (${notInCsv.length}):`);
  notInCsv.forEach((p) =>
    console.log(`- ${p._id} | sku=${p.sku || '(none)'} | ${p.name} | category=${p.category} | price=${p.price} | lifecycle=${p.lifecycle}`)
  );

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
