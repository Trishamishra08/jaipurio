/**
 * Brings each product's brand from the old jaipurio.in shop (legacy export)
 * across as `legacyBrand: { name, slug }`, matched by SKU, so the old
 * /brands/<slug> URLs (LeatherMart, Rangtara, …) keep listing the right products.
 * The existing `brand` field is left untouched.
 *
 *   node scripts/importLegacyBrands.js            dry run (no writes)
 *   node scripts/importLegacyBrands.js --apply    write to MongoDB
 *
 * The export is ~600 MB, so it is streamed (same approach as migrateLegacyCategories.js).
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const Product = require('../models/productModel');

const EXPORT_PATH = path.resolve(__dirname, '../../old db/legacy-export.json');
const BACKSLASH = String.fromCharCode(92);

function readLegacyExport(file) {
  return new Promise((resolve, reject) => {
    const out = { brands: [], products: [] };
    const stream = fs.createReadStream(file, { encoding: 'utf8', highWaterMark: 1 << 22 });
    let depth = 0, inStr = false, esc = false, strBuf = '', lastKey = '', topKey = null;
    let cap = null;
    let capKind = null;

    stream.on('data', (chunk) => {
      let segStart = 0;
      for (let i = 0; i < chunk.length; i++) {
        const ch = chunk[i];
        if (inStr) {
          if (esc) { esc = false; if (depth === 1) strBuf += ch; }
          else if (ch === BACKSLASH) esc = true;
          else if (ch === '"') { inStr = false; if (depth === 1) lastKey = strBuf; }
          else if (depth === 1) strBuf += ch;
          continue;
        }
        if (ch === '"') { inStr = true; strBuf = ''; continue; }
        if (ch === '{' || ch === '[') {
          depth++;
          if (depth === 2) topKey = lastKey;
          if (depth === 3 && topKey === 'products') { cap = []; capKind = 'product'; segStart = i; }
          if (depth === 2 && topKey === 'brands') { cap = []; capKind = 'brands'; segStart = i; }
        } else if (ch === '}' || ch === ']') {
          if (cap && ((capKind === 'product' && depth === 3) || (capKind === 'brands' && depth === 2))) {
            cap.push(chunk.slice(segStart, i + 1));
            const parsed = JSON.parse(cap.join(''));
            cap = null;
            if (capKind === 'brands') out.brands = parsed;
            else out.products.push({ sku: parsed.sku, brandId: parsed.brand_id });
          }
          depth--;
        }
      }
      if (cap) cap.push(chunk.slice(segStart));
    });
    stream.on('end', () => resolve(out));
    stream.on('error', reject);
  });
}

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`Legacy brand import — ${apply ? 'APPLY (writes to MongoDB)' : 'DRY RUN (no writes)'}`);
  console.log('Streaming export (this takes a minute)...');
  const legacy = await readLegacyExport(EXPORT_PATH);

  const brands = new Map(
    legacy.brands.map((b) => [b.id, { name: String(b.name).trim(), slug: (b.slugs && b.slugs[0] && b.slugs[0].key) || '' }])
  );
  console.log(`  brands: ${[...brands.values()].map((b) => `${b.name} (${b.slug})`).join(', ')}`);

  const bySku = new Map();
  legacy.products.forEach((p) => {
    const brand = brands.get(p.brandId);
    if (p.sku && brand && brand.slug) bySku.set(String(p.sku).trim(), brand);
  });
  console.log(`  legacy products with a brand: ${bySku.size} of ${legacy.products.length}`);

  await connectDB();
  const dbProducts = await Product.find({ sku: { $in: [...bySku.keys()] } }).select('_id sku legacyBrand').lean();
  const counts = {};
  const ops = dbProducts.map((p) => {
    const brand = bySku.get(String(p.sku).trim());
    counts[brand.name] = (counts[brand.name] || 0) + 1;
    return { updateOne: { filter: { _id: p._id }, update: { $set: { legacyBrand: brand } } } };
  });
  console.log(`  matched ${dbProducts.length} MongoDB products by SKU:`, counts);

  if (apply && ops.length) {
    const res = await Product.bulkWrite(ops, { ordered: false });
    console.log(`  updated: ${res.modifiedCount}`);
  } else if (!apply) {
    console.log('  dry run — re-run with --apply to write.');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
