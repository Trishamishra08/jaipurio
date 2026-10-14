/**
 * migrateLegacyCategories.js
 * ─────────────────────────────────────────────────────────────────
 * Imports the real product-category taxonomy from the Botble export
 * (old db/legacy-export.json) and re-files every product under the
 * categories it actually had in the old shop.
 *
 * Why: migrateOldProducts.js guessed categories from keywords and dumped
 * almost everything into "Idols". The export carries the true tree
 * (86 categories, up to 5 levels) and a `category_ids` list per product.
 *
 *  1. Upserts every legacy category into the Category collection
 *     (keyed by legacyId; parent / path / level rebuilt from the tree).
 *  2. For each product matched by SKU sets
 *       category     → its most specific (deepest) category name
 *       categoryRef  → that category's _id
 *       categoryIds  → all its categories + every ancestor
 *     Nothing else on the product is touched.
 *
 * The export is ~600 MB, too big for JSON.parse, so it is streamed.
 *
 * Usage:
 *   node scripts/migrateLegacyCategories.js            # dry run (default)
 *   node scripts/migrateLegacyCategories.js --apply    # write to MongoDB
 *
 * --apply first saves the previous category fields of every product it is
 * about to change to old db/category-backup-<timestamp>.json.
 */

'use strict';
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const { normalizeSeo, slugify } = require('../utils/seoFields');

const EXPORT_PATH = path.resolve(__dirname, '../../old db/legacy-export.json');
const IMAGE_BASE_URL = 'https://jaipurio.in/storage/';
const BACKSLASH = String.fromCharCode(92);

const decodeHtml = (s = '') =>
  (s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ');

const prefixImage = (p) => {
  if (!p || p === '0') return '';
  const v = String(p).trim();
  return v.startsWith('http') ? v : IMAGE_BASE_URL + v.replace(/^\//, '');
};

/**
 * Streams the export once, keeping only what this script needs: the whole
 * `categories` array, and { id, sku, category_ids } for each product.
 * Tracks JSON nesting by hand so no single huge string is ever parsed.
 */
function readLegacyExport(file) {
  return new Promise((resolve, reject) => {
    const out = { categories: [], products: [] };
    const stream = fs.createReadStream(file, { encoding: 'utf8', highWaterMark: 1 << 22 });
    let depth = 0, inStr = false, esc = false, strBuf = '', lastKey = '', topKey = null;
    let cap = null; // chunks of the element currently being captured
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
          if (depth === 2 && topKey === 'categories') { cap = []; capKind = 'categories'; segStart = i; }
        } else if (ch === '}' || ch === ']') {
          if (cap && ((capKind === 'product' && depth === 3) || (capKind === 'categories' && depth === 2))) {
            cap.push(chunk.slice(segStart, i + 1));
            const parsed = JSON.parse(cap.join(''));
            cap = null;
            if (capKind === 'categories') out.categories = parsed;
            else out.products.push({ id: parsed.id, sku: parsed.sku, name: parsed.name, status: parsed.status, categoryIds: parsed.category_ids || [] });
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
  console.log('═══════════════════════════════════════════════════════');
  console.log(' Legacy category import  │  ' + (apply ? 'APPLY (writes to MongoDB)' : 'DRY RUN (no writes)'));
  console.log('═══════════════════════════════════════════════════════');
  if (!fs.existsSync(EXPORT_PATH)) throw new Error(`Export not found: ${EXPORT_PATH}`);

  console.log('Streaming export (this takes a minute)...');
  const legacy = await readLegacyExport(EXPORT_PATH);
  console.log(`  categories: ${legacy.categories.length}   products: ${legacy.products.length}`);

  // ── Legacy tree ────────────────────────────────────────────────
  const node = new Map(legacy.categories.map((c) => [c.id, {
    id: c.id,
    parentId: c.parent_id || 0,
    title: decodeHtml(c.name).trim(),
    description: decodeHtml(c.description || '').trim(),
    slug: (c.slugs && c.slugs[0] && c.slugs[0].key) || slugify(decodeHtml(c.name)),
    image: prefixImage(c.image),
    order: c.order || 0,
    featured: !!c.is_featured,
    active: String(c.status).toLowerCase() === 'published',
  }]));
  const chain = (id) => { // root … id
    const list = [];
    for (let cur = node.get(id), n = 0; cur && n < 12; cur = node.get(cur.parentId), n++) list.unshift(cur);
    return list;
  };
  node.forEach((n) => {
    const c = chain(n.id);
    n.level = c.length;
    n.path = c.map((x) => x.title).join(' / ');
  });

  // ── Product → categories ───────────────────────────────────────
  // Bulk-tagging mistakes in the legacy shop: when a product carries the
  // `when` category, the `drop` categories on it are wrong (verified against
  // product names — e.g. 53 marble statues were also tagged "Handbags").
  const CORRECTIONS = [
    { when: 'Religious Statuary Idols', drop: ['Handbags'] },
    { when: 'Semi Hunting Jackets', drop: ['Woolen Beret Caps'] },
    { when: 'Painting', drop: ['Religious Statuary Idols'] },
    { when: 'Shoulder Bags', drop: ['Home & Living', 'Spirituality & Religion'] },
  ];
  const idByTitle = new Map([...node.values()].map((n) => [n.title, n.id]));
  let corrected = 0;
  const correct = (catIds) => {
    let out = [...catIds];
    for (const rule of CORRECTIONS) {
      if (!out.includes(idByTitle.get(rule.when))) continue;
      const dropIds = rule.drop.map((t) => idByTitle.get(t));
      const next = out.filter((cid) => !dropIds.includes(cid));
      if (next.length !== out.length) corrected++;
      out = next;
    }
    return out;
  };

  const assignment = new Map(); // sku → { primary, ids:Set(legacy ids) }
  let noCategory = 0;
  legacy.products.forEach((p) => {
    if (!p.sku) return;
    p.categoryIds = correct(p.categoryIds);
    const ids = new Set();
    p.categoryIds.forEach((cid) => chain(cid).forEach((n) => ids.add(n.id)));
    if (!ids.size) { noCategory++; return; }
    const primary = p.categoryIds
      .map((cid) => node.get(cid)).filter(Boolean)
      .sort((a, b) => b.level - a.level || a.order - b.order || a.id - b.id)[0];
    assignment.set(p.sku, { primary, ids });
  });
  console.log(`  legacy products with a category: ${assignment.size}   without: ${noCategory}   tag corrections applied: ${corrected}`);

  // ── Categories ─────────────────────────────────────────────────
  console.log('\nConnecting to MongoDB...');
  await connectDB();
  const mongoId = new Map(); // legacy id → Category._id
  let catCreated = 0, catUpdated = 0;
  const ordered = [...node.values()].sort((a, b) => a.level - b.level || a.order - b.order);

  for (const n of ordered) {
    const existing = await Category.findOne({ legacyId: n.id }).select('_id').lean();
    const seo = normalizeSeo({ title: n.title, slug: n.slug, description: n.description }, n.title, n.description);
    const fields = {
      title: n.title,
      slug: n.slug,
      description: n.description,
      legacyId: n.id,
      image: n.image,
      sortOrder: n.order,
      isFeatured: n.featured,
      isActive: n.active,
      level: n.level,
      path: n.path,
      seo,
      seoTitle: seo.general.metaTitle || n.title,
      seoDescription: seo.general.metaDescription || n.description,
    };
    const parentMongo = n.parentId ? mongoId.get(n.parentId) : null;
    if (n.parentId && !parentMongo) console.warn(`  ! parent ${n.parentId} of "${n.title}" missing in export`);
    fields.parent = parentMongo || null;

    if (!apply) { mongoId.set(n.id, existing ? existing._id : `dry:${n.id}`); existing ? catUpdated++ : catCreated++; continue; }
    if (existing) {
      await Category.updateOne({ _id: existing._id }, { $set: fields });
      mongoId.set(n.id, existing._id);
      catUpdated++;
    } else {
      const doc = await Category.create(fields);
      mongoId.set(n.id, doc._id);
      catCreated++;
    }
  }
  console.log(`Categories → created: ${catCreated}, updated: ${catUpdated}`);

  // ── Products ───────────────────────────────────────────────────
  const dbProducts = await Product.find({ sku: { $in: [...assignment.keys()] } })
    .select('_id sku category categoryRef categoryIds').lean();
  console.log(`\nMatched ${dbProducts.length} MongoDB products to legacy products by SKU`);

  const perCategory = new Map();
  const backup = [];
  const ops = [];
  dbProducts.forEach((d) => {
    const a = assignment.get(d.sku);
    const update = {
      category: a.primary.title,
      categoryRef: mongoId.get(a.primary.id),
      categoryIds: [...a.ids].map((id) => mongoId.get(id)),
    };
    perCategory.set(a.primary.title, (perCategory.get(a.primary.title) || 0) + 1);
    backup.push({ _id: d._id, category: d.category, categoryRef: d.categoryRef || null, categoryIds: d.categoryIds || [] });
    ops.push({ updateOne: { filter: { _id: d._id }, update: { $set: update } } });
  });

  console.log('Primary category after import:');
  [...perCategory.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(5)}  ${k}`));

  if (!apply) {
    console.log('\nDry run only — re-run with --apply to write.');
    process.exit(0);
  }

  const backupFile = path.resolve(__dirname, `../../old db/category-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup));
  console.log(`\nBackup of previous category fields: ${backupFile}`);
  const res = await Product.bulkWrite(ops, { ordered: false });
  console.log(`Products updated: ${res.modifiedCount} (matched ${res.matchedCount})`);
  process.exit(0);
}

main().catch((err) => {
  console.error('\nFailed:', err);
  process.exit(1);
});
