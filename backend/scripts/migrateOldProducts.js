/**
 * migrateOldProducts.js
 * ─────────────────────────────────────────────────────────────────
 * Migrates ec_products.csv (Botble CMS export) to MongoDB Product model.
 *
 * Uses line-by-line streaming parsing for memory efficiency with large CSV files.
 *
 * Strategy:
 *  - Parent products (is_variation=0) → Product documents
 *  - Variant rows (is_variation=1) → grouped into variants[] of their parent
 *  - Upsert by SKU: existing products updated, new ones created
 *  - Prices: paise → ÷100 → INR
 *  - Images: prefixed with IMAGE_BASE_URL
 *  - Category: keyword-matched to MongoDB Category collection
 *
 * Usage:
 *   node scripts/migrateOldProducts.js
 *   node scripts/migrateOldProducts.js --dry-run --limit=10
 *   node scripts/migrateOldProducts.js --limit=100
 *   node scripts/migrateOldProducts.js --batch=50
 */

'use strict';
const fs = require('fs');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const { normalizeSeo, slugify } = require('../utils/seoFields');

// ─── Config ────────────────────────────────────────────────────────
const IMAGE_BASE_URL = 'https://jaipurio.in/storage/';
const DEFAULT_BRAND = 'Jaipurio Heritage';
const DEFAULT_WAREHOUSE = 'Jaipur WH-1';
const CSV_PATH = path.resolve(__dirname, '../../old db/ec_products.csv');

// ─── Helpers ───────────────────────────────────────────────────────
function decodeHtml(s = '') {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ');
}

function stripHtml(s = '') {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function fromPaise(val) {
  if (val === null || val === undefined || val === '' || val === 'NULL') return null;
  const n = parseFloat(val);
  return isNaN(n) || n === 0 ? null : parseFloat((n / 100).toFixed(2));
}

function prefixImage(p) {
  if (!p || p === 'NULL' || p === '0') return '';
  p = p.trim();
  if (p.startsWith('http')) return p;
  return IMAGE_BASE_URL + p.replace(/^\//, '');
}

function parseImages(raw) {
  if (!raw) return [];
  try {
    // Botble: ["product-categories\/4-2.png","product-categories\/2-1.png"]
    const cleaned = raw.replace(/\\"/g, '"').replace(/\\\//g, '/');
    const arr = JSON.parse(cleaned);
    return Array.isArray(arr) ? arr.map(prefixImage).filter(Boolean) : [];
  } catch { return []; }
}

function parseDate(s) {
  if (!s || s === 'NULL' || !s.trim()) return null;
  const d = new Date(s.trim().replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? null : d;
}

function parseDim(v) {
  const n = parseFloat(v);
  return isNaN(n) || n === 0 ? null : n;
}

function toStockStatus(v) {
  if ((v || '').toLowerCase().includes('out')) return 'Out of Stock';
  return 'In Stock';
}

// ─── Fast Line-by-Line CSV Parser ─────────────────────────────────
// Splits a single CSV line respecting quoted fields
function splitCsvLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      result.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

// Read CSV line by line, handling multi-line quoted fields
function readCsvLines(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let headers = null;
    let buffer = '';
    let inQuote = false;

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    rl.on('line', rawLine => {
      // Count unescaped quotes in buffer + current line
      for (const ch of rawLine) {
        if (ch === '"') inQuote = !inQuote;
      }
      if (buffer) buffer += '\n' + rawLine;
      else buffer = rawLine;

      if (!inQuote) {
        // Complete row
        const parts = splitCsvLine(buffer);
        buffer = '';
        if (!headers) {
          headers = parts.map(h => h.trim());
        } else {
          const obj = {};
          headers.forEach((h, i) => {
            let v = parts[i] !== undefined ? parts[i].trim() : '';
            if (v === 'NULL' || v === 'null') v = null;
            obj[h] = v;
          });
          rows.push(obj);
        }
      }
    });

    rl.on('close', () => resolve(rows));
    rl.on('error', reject);
  });
}

// ─── Category Resolution ───────────────────────────────────────────
const KEYWORD_MAP = [
  { keywords: ['idol', 'murti', 'statue', 'figure', 'deity', 'god ', 'goddess', 'hanuman', 'krishna', 'ganesha', 'ganesh', 'lakshmi', 'shiva', 'durga', 'saraswati', 'radha', 'ram ', 'sita', 'balaji', 'vishnu', 'brahma', 'kalash', 'brass ', 'marble'], cat: 'Idols' },
  { keywords: ['diya', 'deeya', 'lamp', 'deepak', 'candle'], cat: 'Diyas' },
  { keywords: ['matka', 'ghada', 'water pot', 'clay pot', 'earthen pot'], cat: 'Matkas' },
  { keywords: ['kulhad', 'kulhar', 'kulher', 'chai cup', 'tea cup', 'clay cup'], cat: 'Kulhads' },
  { keywords: ['planter', 'plant pot', 'flower pot', 'succulent', 'cactus pot', 'garden pot'], cat: 'Planters' },
  { keywords: ['home decor', 'decoration', 'showpiece', 'figurine', 'vase', 'bowl'], cat: 'Home Decor' },
];

function resolveCategory(name, categoryDocs) {
  const lc = (name || '').toLowerCase();
  for (const { keywords, cat } of KEYWORD_MAP) {
    if (keywords.some(k => lc.includes(k))) {
      const doc = categoryDocs.find(c => c.title === cat);
      if (doc) return { name: cat, ref: doc._id };
    }
  }
  // Default
  const idols = categoryDocs.find(c => c.title === 'Idols');
  return { name: idols ? 'Idols' : 'Uncategorized', ref: idols ? idols._id : null };
}

// ─── Main ──────────────────────────────────────────────────────────
async function migrateProducts() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const batchArg = args.find(a => a.startsWith('--batch='));
  const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : null;
  const BATCH_SIZE = batchArg ? parseInt(batchArg.split('=')[1]) : 50;

  console.log('═══════════════════════════════════════════════════════');
  console.log(' Jaipurio Old DB → MongoDB  │  Product Migration');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Mode    : ${isDryRun ? 'DRY RUN (no DB writes)' : 'LIVE'}`);
  if (LIMIT) console.log(`Limit   : ${LIMIT} parent products`);
  console.log(`Batch   : ${BATCH_SIZE}`);
  console.log(`CSV     : ${CSV_PATH}\n`);

  if (!fs.existsSync(CSV_PATH)) {
    console.error('ERROR: ec_products.csv not found at:', CSV_PATH);
    process.exit(1);
  }

  // ── 1. Read CSV (streaming) ────────────────────────────────────
  console.log('Reading CSV (streaming)...');
  const rows = await readCsvLines(CSV_PATH);
  console.log(`  Total rows : ${rows.length}`);

  const parents = rows.filter(r => r.is_variation === '0');
  const variants = rows.filter(r => r.is_variation === '1');
  console.log(`  Parents    : ${parents.length}`);
  console.log(`  Variants   : ${variants.length}`);

  // ── 2. Build variant map: parentSku → variant rows ────────────
  const parentSkus = new Set(parents.map(p => p.sku).filter(Boolean));
  const variantMap = new Map();

  for (const v of variants) {
    if (!v.sku) continue;
    let matched = null;
    for (const pSku of parentSkus) {
      if (v.sku.startsWith(pSku) && v.sku.length > pSku.length) {
        matched = pSku; break;
      }
    }
    if (matched) {
      if (!variantMap.has(matched)) variantMap.set(matched, []);
      variantMap.get(matched).push(v);
    }
  }
  console.log(`  Parents with variants: ${variantMap.size}\n`);

  // ── 3. Connect DB ──────────────────────────────────────────────
  if (!isDryRun) {
    console.log('Connecting to MongoDB...');
    await connectDB();
  }

  // ── 4. Load categories ─────────────────────────────────────────
  let categoryDocs = [];
  if (!isDryRun) {
    categoryDocs = await Category.find({}, 'title slug _id').lean();
    console.log(`Loaded ${categoryDocs.length} categories from MongoDB\n`);
  }

  // ── 5. Process ─────────────────────────────────────────────────
  const toProcess = LIMIT ? parents.slice(0, LIMIT) : parents;
  let created = 0, updated = 0, skipped = 0, errors = 0;

  console.log(`Migrating ${toProcess.length} parent products (batch=${BATCH_SIZE})...\n`);

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, Math.min(i + BATCH_SIZE, toProcess.length));

    for (const row of batch) {
      try {
        const rawName = decodeHtml(row.name || '').trim();
        if (!rawName) { skipped++; continue; }

        const price = fromPaise(row.price);
        if (!price) { skipped++; continue; }

        const productSlug = slugify(rawName);
        const salePrice = fromPaise(row.sale_price);
        const costPerItem = fromPaise(row.cost_per_item);
        const oldPrice = (salePrice && salePrice < price) ? price : null;

        // Images
        const primaryImg = prefixImage(row.image);
        const imgArr = parseImages(row.images);
        if (primaryImg && !imgArr.includes(primaryImg)) imgArr.unshift(primaryImg);

        // Variants
        const variantRows = row.sku ? (variantMap.get(row.sku) || []) : [];
        const hasVariants = variantRows.length > 0;
        const variantDocs = variantRows.map(v => ({
          sku: v.sku || '',
          price: fromPaise(v.price) || price,
          oldPrice: fromPaise(v.sale_price) ? fromPaise(v.price) : null,
          salePrice: fromPaise(v.sale_price),
          stock: v.quantity && v.quantity !== 'NULL' ? (parseInt(v.quantity) || 0) : 0,
          weight: parseDim(v.weight),
          barcode: v.barcode || '',
          images: parseImages(v.images),
          status: (v.status || '').toLowerCase() === 'published' ? 'Published' : 'Draft',
        }));

        // Status / Lifecycle
        const isPublished = (row.status || '').toLowerCase() === 'published';
        const lifecycle = isPublished ? 'Published' : 'Pending Approval';

        // Stock
        const trackQuantity = row.with_storehouse_management === '1';
        const stockStatus = toStockStatus(row.stock_status);

        // Category
        const { name: catName, ref: catRef } = resolveCategory(rawName, categoryDocs);

        // SEO
        const descText = stripHtml(decodeHtml(row.description || '')).substring(0, 320);
        const seo = normalizeSeo(
          { title: rawName, slug: productSlug, description: descText },
          rawName, descText.substring(0, 160)
        );

        const isFeatured = row.is_featured === '1';
        const hasSale = !!(salePrice && salePrice < price);

        const productData = {
          name: rawName,
          title: rawName,
          slug: productSlug,
          description: row.description || '',
          content: row.content || '',
          price,
          oldPrice,
          salePrice,
          costPerItem,
          saleStartDate: parseDate(row.start_date),
          saleEndDate: parseDate(row.end_date),
          barcode: row.barcode || '',
          brand: DEFAULT_BRAND,
          image: primaryImg,
          images: imgArr,
          category: catName,
          categoryRef: catRef || null,
          sku: row.sku || '',
          isFeatured,
          collections: { newArrival: false, bestSellers: isFeatured, specialOffer: hasSale },
          labels: { hot: isFeatured, new: false, sale: hasSale },
          hasVariants,
          variants: variantDocs,
          trackQuantity,
          stockStatus,
          lifecycle,
          published: isPublished,
          weight: parseDim(row.weight),
          length: parseDim(row.length),
          width: parseDim(row.wide),
          height: parseDim(row.height),
          minQty: (row.minimum_order_quantity && row.minimum_order_quantity !== '0') ? parseInt(row.minimum_order_quantity) : null,
          maxQty: (row.maximum_order_quantity && row.maximum_order_quantity !== '0') ? parseInt(row.maximum_order_quantity) : null,
          warehouse: DEFAULT_WAREHOUSE,
          codAvailable: true,
          seoTitle: seo.general.metaTitle || rawName,
          seoDescription: seo.general.metaDescription || descText.substring(0, 160),
          seo,
        };

        if (isDryRun) {
          console.log(`  [DRY] "${rawName.substring(0, 65)}"`);
          console.log(`        ₹${price}${salePrice ? ` (sale ₹${salePrice})` : ''} | cat: ${catName} | variants: ${variantDocs.length} | featured: ${isFeatured}`);
          created++;
          continue;
        }

        // Upsert by SKU (or slug if no SKU)
        const query = row.sku
          ? { $or: [{ sku: row.sku }, { slug: productSlug }] }
          : { slug: productSlug };

        const existing = await Product.findOne(query).select('_id sku').lean();

        if (existing) {
          await Product.updateOne({ _id: existing._id }, { $set: productData });
          updated++;
        } else {
          await Product.create(productData);
          created++;
        }
      } catch (err) {
        errors++;
        console.error(`\n  [ERROR] id:${row.id} "${(row.name || '').substring(0, 50)}":`, err.message);
      }
    }

    const done = Math.min(i + BATCH_SIZE, toProcess.length);
    console.log(`  Batch ${String(Math.floor(i / BATCH_SIZE) + 1).padStart(3)} │ ${String(done).padStart(5)} / ${toProcess.length}  ✓ new: ${created}  ↑ upd: ${updated}  ⊘ skip: ${skipped}  ✗ err: ${errors}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Migration Complete');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  ✓ Created  : ${created}`);
  console.log(`  ↑ Updated  : ${updated}`);
  console.log(`  ⊘ Skipped  : ${skipped} (no name / no price)`);
  console.log(`  ✗ Errors   : ${errors}`);
  console.log(`  Total      : ${toProcess.length}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (!isDryRun) {
    const finalCount = await Product.countDocuments();
    console.log(`  MongoDB Product collection total: ${finalCount}`);
  }

  process.exit(errors > 0 ? 1 : 0);
}

migrateProducts().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
