const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const Category = require('../models/categoryModel');
const BlogCategory = require('../models/blogCategoryModel');
const { normalizeSeo, slugify } = require('../utils/seoFields');

// Decode common HTML entities from old CMS dumps (e.g., &amp; -> &)
function decodeHtmlEntities(str = '') {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

// Robust CSV parser supporting quotes, commas, escaped quotes
function parseCsv(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
      i++;
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.some((f) => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      i++;
    } else {
      currentField += char;
      i++;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim().replace(/^"|"$/g, ''));
  const data = [];

  for (let r = 1; r < rows.length; r++) {
    const rowObj = {};
    headers.forEach((header, index) => {
      let val = rows[r][index] !== undefined ? rows[r][index] : '';
      val = val.trim();
      if (val === 'NULL' || val === 'null') val = null;
      rowObj[header] = val;
    });
    data.push(rowObj);
  }

  return data;
}

async function migrateCategories() {
  const args = process.argv.slice(2);
  const targetBlog = args.includes('--blog') || args.includes('--blog-only');
  const targetBoth = args.includes('--both') || args.includes('--all');

  const csvPath = path.resolve(__dirname, '../../old db/categories.csv');

  console.log('----------------------------------------------------');
  console.log(' Jaipurio Old Database Category Migration');
  console.log(' Target: MongoDB Product Category (Category Model)');
  console.log('----------------------------------------------------');
  console.log(`Source CSV: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    console.error(`ERROR: CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parseCsv(csvContent);
  console.log(`Found ${records.length} category records in CSV:`);
  records.forEach((r, idx) => {
    console.log(`  [${idx + 1}] ID: ${r.id} | Name: "${r.name}" | Status: ${r.status}`);
  });

  console.log('\nConnecting to MongoDB...');
  await connectDB();

  // 1. Process Product Categories (Category model) by default
  console.log('\n>>> Migrating to Category (Product Categories) collection...');
  const oldIdToMongoCategory = new Map();

  for (const record of records) {
    const rawName = decodeHtmlEntities(record.name || '').trim();
    if (!rawName) continue;

    const slug = slugify(rawName);
    const description = decodeHtmlEntities(record.description || '').trim();
    const isActive = record.status && record.status.toLowerCase() === 'published';
    const iconUrl = record.icon && record.icon !== '0' && record.icon !== 'NULL' ? record.icon : '';

    const seo = normalizeSeo(
      {
        title: rawName,
        slug,
        description,
      },
      rawName,
      description
    );

    const updateData = {
      title: rawName,
      slug,
      description,
      path: rawName,
      level: 1,
      isActive,
      url: iconUrl,
      seo,
      seoTitle: seo.general.metaTitle || rawName,
      seoDescription: seo.general.metaDescription || description,
    };

    const existing = await Category.findOne({
      $or: [{ title: new RegExp(`^${rawName}$`, 'i') }, { slug }],
    });

    let savedDoc;
    if (existing) {
      await Category.updateOne({ _id: existing._id }, { $set: updateData });
      savedDoc = await Category.findById(existing._id);
      console.log(`  ✓ Updated Product Category: "${rawName}" (slug: ${slug}, id: ${existing._id})`);
    } else {
      savedDoc = await Category.create(updateData);
      console.log(`  + Created Product Category: "${rawName}" (slug: ${slug}, id: ${savedDoc._id})`);
    }

    if (record.id && savedDoc) {
      oldIdToMongoCategory.set(String(record.id), savedDoc._id);
    }
  }

  // Handle parent-child relationships if any exist in the CSV
  for (const record of records) {
    if (record.parent_id && record.parent_id !== '0' && oldIdToMongoCategory.has(String(record.parent_id))) {
      const parentId = oldIdToMongoCategory.get(String(record.parent_id));
      const childId = oldIdToMongoCategory.get(String(record.id));
      if (parentId && childId) {
        const parentDoc = await Category.findById(parentId);
        const childDoc = await Category.findById(childId);
        if (parentDoc && childDoc) {
          const pathLabel = `${parentDoc.path || parentDoc.title} / ${childDoc.title}`;
          const level = (parentDoc.level || 1) + 1;
          await Category.updateOne({ _id: childId }, { $set: { parent: parentId, path: pathLabel, level } });
          console.log(`  ↳ Linked parent for: "${childDoc.title}" -> "${parentDoc.title}"`);
        }
      }
    }
  }

  // 2. Optionally process Blog Categories if --blog or --both is specified
  if (targetBlog || targetBoth) {
    console.log('\n>>> Migrating to BlogCategory collection...');
    for (const record of records) {
      const rawName = decodeHtmlEntities(record.name || '').trim();
      if (!rawName) continue;

      const slug = slugify(rawName);
      const description = decodeHtmlEntities(record.description || '').trim();
      const isDefault = record.is_default === '1' || record.is_default === 'true';
      const isFeatured = record.is_featured === '1' || record.is_featured === 'true';
      const sortOrder = Number(record.order) || 0;
      const status =
        record.status && record.status.toLowerCase() === 'published' ? 'Published' : 'Draft';
      const icon = record.icon && record.icon !== '0' && record.icon !== 'NULL' ? record.icon : '';

      const seo = normalizeSeo(
        {
          name: rawName,
          slug,
          description,
        },
        rawName,
        description
      );

      const updateData = {
        name: rawName,
        slug,
        description,
        isDefault,
        isFeatured,
        sortOrder,
        status,
        icon,
        seo,
        seoTitle: seo.general.metaTitle || rawName,
        seoDescription: seo.general.metaDescription || description,
      };

      const existing = await BlogCategory.findOne({
        $or: [{ name: new RegExp(`^${rawName}$`, 'i') }, { slug }],
      });

      if (existing) {
        await BlogCategory.updateOne({ _id: existing._id }, { $set: updateData });
        console.log(`  ✓ Updated BlogCategory: "${rawName}" (slug: ${slug}, id: ${existing._id})`);
      } else {
        const created = await BlogCategory.create(updateData);
        console.log(`  + Created BlogCategory: "${rawName}" (slug: ${slug}, id: ${created._id})`);
      }
    }
  }

  console.log('\nMigration completed successfully!');
  process.exit(0);
}

migrateCategories().catch((err) => {
  console.error('\nMigration failed with error:', err);
  process.exit(1);
});
