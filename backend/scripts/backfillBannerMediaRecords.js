'use strict';
require('dotenv').config();
const connectDB = require('../config/db');
const Banner = require('../models/bannerModel');
const MediaImage = require('../models/mediaImageModel');

function keyFromUrl(url) {
  const marker = '/jaipurio/';
  const i = url.indexOf(marker);
  return i === -1 ? '' : url.slice(i + marker.length);
}

async function main() {
  await connectDB();

  const banners = await Banner.find({ image: { $regex: 'minio-jaipurio' } });
  let created = 0;

  for (const b of banners) {
    const exists = await MediaImage.findOne({ url: b.image });
    if (exists) {
      console.log('Already tracked:', b.image);
      continue;
    }
    const key = keyFromUrl(b.image);
    const name = key.split('/').pop() || 'banner.webp';
    const niceLabel = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
    await MediaImage.create({
      name,
      originalName: name,
      folderId: null,
      url: b.image,
      storageKey: key,
      storageProvider: 'minio',
      mimeType: 'image/webp',
      alt: b.title || niceLabel,
      title: b.title || niceLabel,
    });
    created++;
    console.log('Tracked:', b.image);
  }

  console.log(`Done. Backfilled ${created} media record(s).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
