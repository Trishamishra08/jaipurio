/**
 * Read-only content audit for the SEO report: lists products whose stored data
 * still has AI/template leftovers, so they can be fixed in Admin → Products.
 * (The storefront already hides these on display; this finds them at the source.)
 *
 *   node scripts/auditProductContent.js            # summary + first 50 rows
 *   node scripts/auditProductContent.js --all      # every row
 *   node scripts/auditProductContent.js --csv > product-content-issues.csv
 *
 * Changes nothing in the database.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/productModel');

const args = new Set(process.argv.slice(2));
const asCsv = args.has('--csv');
const showAll = args.has('--all') || asCsv;

const CHECKS = [
  ['placeholder', (p) => /\[(specify|insert|add|enter|mention|include|your)\b[^\]]*\]/i.test(`${p.description} ${p.content}`)],
  ['meta-note-in-text', (p) => /meta\s*(title|description)\s*(\(\s*\d+\s*characters?\s*\))?\s*:/i.test(`${p.name} ${p.description} ${p.content}`)],
  ['pipe-stuffed-name', (p) => (String(p.name || '').match(/\s\|\s/g) || []).length >= 2],
  ['brand-in-name', (p) => /\bjaipurio\b/i.test(p.name || '')],
  ['h1-in-description', (p) => /<h1[\s>]/i.test(`${p.description} ${p.content}`)],
  ['missing-slug', (p) => !p.slug && !p.seo?.general?.slug],
  ['discount-over-70pct', (p) => {
    const mrp = Number(p.price) || 0;
    const sale = Number(p.salePrice) || 0;
    return mrp > 0 && sale > 0 && sale < mrp && (mrp - sale) / mrp > 0.7;
  }],
];

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Set MONGODB_URI in backend/.env first.');
    process.exit(1);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

  const products = await Product.find({})
    .select('name slug seo.general.slug description content price salePrice')
    .lean();

  const rows = [];
  const counts = Object.fromEntries(CHECKS.map(([k]) => [k, 0]));
  for (const p of products) {
    const issues = CHECKS.filter(([, test]) => test(p)).map(([k]) => k);
    issues.forEach((k) => { counts[k] += 1; });
    if (issues.length) rows.push({ id: String(p._id), name: p.name, slug: p.slug || p.seo?.general?.slug || '', issues });
  }

  // Near-duplicate names (same first 30 normalised characters)
  const byKey = new Map();
  for (const p of products) {
    const key = String(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 30);
    if (!key) continue;
    byKey.set(key, [...(byKey.get(key) || []), p]);
  }
  const dupes = [...byKey.values()].filter((g) => g.length > 1);

  if (asCsv) {
    console.log(['id', 'name', 'slug', 'issues'].map(csvCell).join(','));
    rows.forEach((r) => console.log([r.id, r.name, r.slug, r.issues.join(' ')].map(csvCell).join(',')));
  } else {
    console.log(`Checked ${products.length} products — ${rows.length} need attention.\n`);
    Object.entries(counts).forEach(([k, n]) => console.log(`  ${k.padEnd(22)} ${n}`));
    console.log(`  ${'near-duplicate-names'.padEnd(22)} ${dupes.length} groups\n`);
    (showAll ? rows : rows.slice(0, 50)).forEach((r) => console.log(`- ${r.id}  ${r.name}\n    ${r.issues.join(', ')}`));
    if (!showAll && rows.length > 50) console.log(`\n…and ${rows.length - 50} more (use --all or --csv).`);
    if (dupes.length) {
      console.log('\nNear-duplicate product names:');
      dupes.slice(0, 20).forEach((g) => console.log(`- ${g.map((p) => `${p.name} (${p._id})`).join('\n  ')}`));
    }
  }

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
