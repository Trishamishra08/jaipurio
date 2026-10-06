'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const Banner = require('../models/bannerModel');
const { uploadBuffer } = require('../utils/minioStorage');

const IMAGE_PATH = path.resolve(__dirname, '../../frontend/public/image.png');

async function main() {
  await connectDB();

  const buffer = fs.readFileSync(IMAGE_PATH);
  const uploaded = await uploadBuffer(
    { originalname: 'radha-krishna-marble-idol-banner.png', mimetype: 'image/png', buffer },
    'banners'
  );
  console.log('Uploaded to MinIO:', uploaded.url);

  // Remove any previous Main Slider banners — this replaces the hardcoded
  // pottery/video hero with the DB-driven one.
  const removed = await Banner.deleteMany({ type: 'Main Slider' });
  console.log('Removed old Main Slider banners:', removed.deletedCount);

  const banner = await Banner.create({
    title: 'Divine Marble Idols, Handcrafted in Jaipur',
    subtitle: 'Blessed Radha Krishna statues carved by master artisans of Rajasthan',
    image: uploaded.url,
    link: '/shop?category=Idols',
    type: 'Main Slider',
    btnText: 'Shop Idols',
    isVideo: false,
    slot: 1,
    sequence: 1,
    status: 'active',
  });

  console.log('Created banner:', JSON.stringify(banner, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
