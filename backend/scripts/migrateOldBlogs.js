/**
 * migrateOldBlogs.js
 * ─────────────────────────────────────────────────────────────────
 * Migrates old db posts (posts.csv + post_categories.csv + categories.csv)
 * to the MongoDB Blog model.
 *
 * Distinct Architecture:
 *  - Product Categories = Category model (Matkas, Kulhads, Idols, Diyas, Planters)
 *  - Blog Categories    = BlogCategory model (Ecommerce, Fashion, Spirituality & Religion)
 *  - Blogs              = Blog model (points to BlogCategory names / subdocument faqs / seo)
 *
 * Usage:
 *   node scripts/migrateOldBlogs.js
 *   node scripts/migrateOldBlogs.js --dry-run
 */

'use strict';
const fs = require('fs');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const Blog = require('../models/blogModel');
const BlogCategory = require('../models/blogCategoryModel');
const { normalizeSeo, slugify } = require('../utils/seoFields');

const IMAGE_BASE_URL = 'https://jaipurio.in/storage/';
const POSTS_CSV = path.resolve(__dirname, '../../old db/posts.csv');
const POST_CATS_CSV = path.resolve(__dirname, '../../old db/post_categories.csv');
const CATS_CSV = path.resolve(__dirname, '../../old db/categories.csv');

function decodeHtml(s = '') {
  return (s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(s = '') {
  return (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function prefixImage(p) {
  if (!p || p === 'NULL' || p === 'null') return '';
  p = p.trim();
  if (p.startsWith('http')) return p;
  return IMAGE_BASE_URL + p.replace(/^\//, '');
}

function calcReadTime(text = '') {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

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

function readCsv(filePath) {
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
      for (const ch of rawLine) {
        if (ch === '"') inQuote = !inQuote;
      }
      if (buffer) buffer += '\n' + rawLine;
      else buffer = rawLine;

      if (!inQuote) {
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

async function migrateBlogs() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('═══════════════════════════════════════════════════════');
  console.log(' Jaipurio Old DB → MongoDB  │  Blog & BlogCategory Migration');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Mode : ${isDryRun ? 'DRY RUN (no DB writes)' : 'LIVE'}\n`);

  // 1. Read files
  console.log('Reading CSV files...');
  const catRows = await readCsv(CATS_CSV);
  const postCatRows = await readCsv(POST_CATS_CSV);
  const postRows = await readCsv(POSTS_CSV);

  console.log(`  Categories in CSV        : ${catRows.length}`);
  console.log(`  Junction links in CSV    : ${postCatRows.length}`);
  console.log(`  Posts/Blogs in CSV       : ${postRows.length}\n`);

  // 2. Build Category Lookup (id -> clean name)
  const catIdToName = new Map();
  catRows.forEach(c => {
    const cleanName = decodeHtml(c.name || '').trim();
    if (c.id && cleanName) {
      catIdToName.set(String(c.id), cleanName);
    }
  });

  // 3. Build Post -> Categories Lookup
  const postToCats = new Map(); // postId -> Array of category names
  postCatRows.forEach(link => {
    const pId = String(link.post_id);
    const catName = catIdToName.get(String(link.category_id));
    if (catName) {
      if (!postToCats.has(pId)) postToCats.set(pId, []);
      const list = postToCats.get(pId);
      if (!list.includes(catName)) list.push(catName);
    }
  });

  if (!isDryRun) {
    console.log('Connecting to MongoDB...');
    await connectDB();

    // 4. Ensure Blog Categories exist in BlogCategory collection
    console.log('\nSyncing BlogCategory collection...');
    for (const catRow of catRows) {
      const cleanName = decodeHtml(catRow.name || '').trim();
      const catSlug = slugify(cleanName);
      const desc = decodeHtml(catRow.description || '').trim();
      const isFeatured = catRow.is_featured === '1';
      const isDefault = catRow.is_default === '1';

      await BlogCategory.findOneAndUpdate(
        { slug: catSlug },
        {
          name: cleanName,
          slug: catSlug,
          description: desc,
          isFeatured,
          isDefault,
          status: 'Published',
          sortOrder: parseInt(catRow.order) || 0,
        },
        { upsert: true, new: true }
      );
      console.log(`  ✓ Blog Category: "${cleanName}" (${catSlug})`);
    }
  }

  // 5. Migrate Posts to Blog collection
  console.log(`\nMigrating ${postRows.length} Blog Posts...`);
  let created = 0, updated = 0, skipped = 0, errors = 0;

  for (let idx = 0; idx < postRows.length; idx++) {
    const row = postRows[idx];
    try {
      const legacyId = parseInt(row.id) || null;
      const rawName = decodeHtml(row.name || '').trim();
      if (!rawName) { skipped++; continue; }

      const blogSlug = slugify(rawName);
      const rawDesc = decodeHtml(row.description || '').trim();
      const content = row.content || '';
      const cleanDesc = stripHtml(rawDesc);
      const isFeatured = row.is_featured === '1';
      const imageUrl = prefixImage(row.image);
      const readTime = calcReadTime(stripHtml(content) || cleanDesc);

      const assignedCats = postToCats.get(String(row.id)) || [];
      const primaryCat = assignedCats[0] || 'Spirituality & Religion';
      if (!assignedCats.length) assignedCats.push(primaryCat);

      const seo = normalizeSeo(
        { title: rawName, slug: blogSlug, description: cleanDesc },
        rawName,
        cleanDesc.substring(0, 160)
      );

      const blogData = {
        name: rawName,
        title: rawName,
        slug: blogSlug,
        description: rawDesc,
        excerpt: rawDesc,
        content,
        image: imageUrl,
        isFeatured,
        categories: assignedCats,
        category: primaryCat,
        author: 'Jaipurio',
        status: 'Published',
        readTime,
        faqs: [],
        legacyId,
        seoTitle: seo.general.metaTitle || rawName,
        seoDescription: seo.general.metaDescription || cleanDesc.substring(0, 160),
        seo,
        createdAt: row.created_at ? new Date(row.created_at.replace(' ', 'T') + 'Z') : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at.replace(' ', 'T') + 'Z') : new Date(),
      };

      if (isDryRun) {
        if (idx < 5) {
          console.log(`  [DRY] (#${legacyId}) "${rawName.substring(0, 60)}..."`);
          console.log(`        Categories: [${assignedCats.join(', ')}] | Read: ${readTime} | Image: ${imageUrl ? 'Yes' : 'None'}`);
        }
        created++;
        continue;
      }

      // Upsert by legacyId or slug
      const existing = await Blog.findOne({
        $or: [{ legacyId: legacyId }, { slug: blogSlug }]
      }).select('_id');

      if (existing) {
        await Blog.updateOne({ _id: existing._id }, { $set: blogData });
        updated++;
      } else {
        await Blog.create(blogData);
        created++;
      }

      if ((idx + 1) % 50 === 0 || idx + 1 === postRows.length) {
        console.log(`  Progress: ${idx + 1} / ${postRows.length}  (✓ created: ${created}, ↑ updated: ${updated})`);
      }
    } catch (err) {
      errors++;
      console.error(`  [ERROR] post id ${row.id}:`, err.message);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Blog Migration Complete');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  ✓ Created  : ${created}`);
  console.log(`  ↑ Updated  : ${updated}`);
  console.log(`  ⊘ Skipped  : ${skipped}`);
  console.log(`  ✗ Errors   : ${errors}`);
  console.log(`  Total      : ${postRows.length}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (!isDryRun) {
    const totalBlogs = await Blog.countDocuments();
    const totalBlogCats = await BlogCategory.countDocuments();
    console.log(`MongoDB BlogCategory total : ${totalBlogCats}`);
    console.log(`MongoDB Blog total         : ${totalBlogs}`);
  }

  process.exit(errors > 0 ? 1 : 0);
}

migrateBlogs().catch(err => {
  console.error('Fatal error during blog migration:', err);
  process.exit(1);
});
