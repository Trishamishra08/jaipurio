/**
 * Fixes the mechanical content problems from the SEO audit at the source.
 * DRY RUN BY DEFAULT: it only reports what it would change.
 *
 *   node scripts/cleanContent.js                  # report only (products + blogs)
 *   node scripts/cleanContent.js --apply          # write the changes
 *   node scripts/cleanContent.js --only=products  # or --only=blogs
 *   node scripts/cleanContent.js --names          # ALSO shorten pipe-stuffed product names (opt-in)
 *
 * What it changes:
 *   products  description/content: remove "[specify …]" placeholders, "Meta Title (45 characters):" notes, H1 → H2
 *   products  name (only with --names): pipe-stuffed / "Meta Title" names → the first segment; the original long name is
 *             saved to seoTitle (only when seoTitle is empty) so no SEO text is lost. Slugs never change.
 *   blogs     content: repeated cross-promo links (Govindam, Travel Taxi …) → keep the first mention only
 *
 * What it does NOT touch (business decisions): duplicate products, MRP/discounts, jacket
 * products, blog categories, reviews.
 *
 * Back up first:  node scripts/backupMongo.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Blog = require('../models/blogModel');
const { cleanProductHtml, splitProductName, dedupePromoLinks } = require('../utils/contentCleanup');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const only = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1] || 'all';
// Renaming ~1000 products is a bulk change, so it is opt-in. (The storefront already shows the short names.)
const touchNames = args.includes('--names');
const PROMO_DOMAINS = ['govindam.co.in', 'govindamretreat.in', 'traveltaxi.in', 'wellbite.in', 'indiatourscabs.com'];

async function cleanProducts() {
  const stats = { checked: 0, changed: 0, html: 0, names: 0 };
  const cursor = Product.find({}).select('name description content seoTitle').cursor();
  const ops = [];
  for await (const p of cursor) {
    stats.checked += 1;
    const set = {};
    const description = cleanProductHtml(p.description);
    const content = cleanProductHtml(p.content);
    if (description !== p.description) set.description = description;
    if (content !== p.content) set.content = content;
    if (set.description !== undefined || set.content !== undefined) stats.html += 1;
    if (touchNames) {
      const { name, seoTitle } = splitProductName(p.name);
      if (name && name !== p.name) {
        set.name = name;
        if (seoTitle && !p.seoTitle) set.seoTitle = seoTitle;
        stats.names += 1;
      }
    }
    if (Object.keys(set).length) {
      stats.changed += 1;
      ops.push({ updateOne: { filter: { _id: p._id }, update: { $set: set } } });
    }
    if (apply && ops.length >= 200) await Product.bulkWrite(ops.splice(0));
  }
  if (apply && ops.length) await Product.bulkWrite(ops);
  return stats;
}

async function cleanBlogs() {
  const stats = { checked: 0, changed: 0 };
  const cursor = Blog.find({}).select('content').cursor();
  const ops = [];
  for await (const b of cursor) {
    stats.checked += 1;
    const content = dedupePromoLinks(b.content, PROMO_DOMAINS);
    if (content !== b.content) {
      stats.changed += 1;
      ops.push({ updateOne: { filter: { _id: b._id }, update: { $set: { content } } } });
    }
    if (apply && ops.length >= 50) await Blog.bulkWrite(ops.splice(0));
  }
  if (apply && ops.length) await Blog.bulkWrite(ops);
  return stats;
}

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(apply ? '== APPLYING CHANGES ==' : '== DRY RUN (nothing is written; add --apply to write) ==');
  if (only === 'all' || only === 'products') console.log('products:', await cleanProducts());
  if (only === 'all' || only === 'blogs') console.log('blogs   :', await cleanBlogs());
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
