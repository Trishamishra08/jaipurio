/**
 * warmThumbnails.js
 * Pre-creates the WebP thumbnails the storefront asks for (see
 * ensureThumbnail in utils/minioStorage.js) so even the first visitor gets
 * small images: 400px for every product's main image, 200px for category
 * images. Already-existing thumbnails are skipped, so it is safe to re-run.
 *
 * Usage: node scripts/warmThumbnails.js [--concurrency=6]
 */
'use strict';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { extractKey, canThumbnail, ensureThumbnail } = require('../utils/minioStorage');

const concArg = process.argv.find((a) => a.startsWith('--concurrency='));
const CONCURRENCY = concArg ? parseInt(concArg.split('=')[1], 10) : 6;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}, { projection: { image: 1 } }).toArray();
  const categories = await db.collection('categories').find({}, { projection: { image: 1 } }).toArray();

  const jobs = [];
  const seen = new Set();
  const add = (url, width) => {
    const key = typeof url === 'string' ? extractKey(url) : null;
    if (!key || !canThumbnail(key) || seen.has(`${width}:${key}`)) return;
    seen.add(`${width}:${key}`);
    jobs.push({ key, width });
  };
  products.forEach((p) => add(p.image, 400));
  categories.forEach((c) => add(c.image, 200));
  console.log(`Thumbnails to ensure: ${jobs.length} (concurrency ${CONCURRENCY})`);

  let done = 0, failed = 0;
  const worker = async () => {
    while (jobs.length) {
      const job = jobs.shift();
      try {
        await ensureThumbnail(job.key, job.width);
      } catch (e) {
        failed++;
        console.warn(`  ✗ ${job.key}: ${e.message}`);
      }
      if (++done % 100 === 0) console.log(`  ${done} done, ${failed} failed`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Finished: ${done} processed, ${failed} failed`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
