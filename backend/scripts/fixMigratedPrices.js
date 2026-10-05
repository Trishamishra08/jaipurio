/**
 * fixMigratedPrices.js
 * ─────────────────────────────────────────────────────────────────
 * One-time corrective pass for the ÷100 price bug introduced by the
 * old fromPaise() helper in migrateOldProducts.js (now fixed).
 *
 * For every DB product whose SKU exists in ec_products.csv AND whose
 * current price/salePrice exactly matches (csvValue / 100), reset
 * price/salePrice/oldPrice to the correct CSV values.
 *
 * Products whose price does NOT match that ÷100 pattern are left
 * untouched (they were hand-edited after migration, or aren't from
 * the CSV at all).
 *
 * Usage:
 *   node scripts/fixMigratedPrices.js --dry-run   (report only, no writes)
 *   node scripts/fixMigratedPrices.js             (apply the fix)
 */

'use strict';
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const Product = require('../models/productModel');

const CSV_PATH = path.resolve(__dirname, '../../old db/ec_products.csv');
const DRY_RUN = process.argv.includes('--dry-run');

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

function parsePrice(val) {
  if (val === null || val === undefined || val === '' || val === 'NULL') return null;
  const n = parseFloat(val);
  return isNaN(n) || n === 0 ? null : n;
}

async function main() {
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCsv(text);
  const header = rows[0];
  const idx = {};
  header.forEach((h, i) => (idx[h] = i));

  const csvBySku = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 20) continue;
    const sku = r[idx.sku];
    if (sku && !csvBySku.has(sku)) {
      csvBySku.set(sku, { price: r[idx.price], sale_price: r[idx.sale_price] });
    }
  }

  await connectDB();
  const products = await Product.find({}).select('sku price salePrice oldPrice');

  let fixed = 0, skippedNoCsv = 0, skippedNotAffected = 0;
  const bulkOps = [];
  const changeLog = [];

  for (const doc of products) {
    const csvRow = csvBySku.get(doc.sku);
    if (!csvRow) { skippedNoCsv++; continue; }

    const csvPrice = parsePrice(csvRow.price);
    const csvSale = parsePrice(csvRow.sale_price);
    if (!csvPrice) { skippedNoCsv++; continue; }

    const expectedPriceDiv100 = parseFloat((csvPrice / 100).toFixed(2));
    const expectedSaleDiv100 = csvSale ? parseFloat((csvSale / 100).toFixed(2)) : null;

    const isAffected =
      doc.price === expectedPriceDiv100 || doc.salePrice === expectedSaleDiv100;

    if (!isAffected) { skippedNotAffected++; continue; }

    const newOldPrice = csvSale && csvSale < csvPrice ? csvPrice : null;

    changeLog.push({
      sku: doc.sku,
      before: { price: doc.price, salePrice: doc.salePrice, oldPrice: doc.oldPrice },
      after: { price: csvPrice, salePrice: csvSale, oldPrice: newOldPrice },
    });

    bulkOps.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { price: csvPrice, salePrice: csvSale, oldPrice: newOldPrice } },
      },
    });
    fixed++;
  }

  console.log(`Matched & affected (to fix): ${fixed}`);
  console.log(`Skipped - no CSV match: ${skippedNoCsv}`);
  console.log(`Skipped - not matching /100 pattern (hand-edited, left alone): ${skippedNotAffected}`);
  console.log('Sample changes:', JSON.stringify(changeLog.slice(0, 5), null, 2));

  if (DRY_RUN) {
    console.log('\nDRY RUN - no writes performed.');
  } else if (bulkOps.length) {
    const result = await Product.bulkWrite(bulkOps);
    console.log('\nBulkWrite result:', JSON.stringify({ matched: result.matchedCount, modified: result.modifiedCount }));
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
