'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const Banner = require('../models/bannerModel');
const { uploadBuffer } = require('../utils/minioStorage');

const IMAGE_PATH = path.resolve(__dirname, '../../frontend/public/banner_idol.png');

async function main() {
  await connectDB();

  const buffer = fs.readFileSync(IMAGE_PATH);
  const uploaded = await uploadBuffer(
    { originalname: 'handcrafted-marble-temple-banner.png', mimetype: 'image/png', buffer },
    'banners'
  );
  console.log('Uploaded to MinIO:', uploaded.url);

  const update = {
    image: uploaded.url,
    badge: 'Divine Spaces, Timeless Beauty',
    title: 'Handcrafted Marble Temples',
    subtitle: 'Bring home the essence of faith with exquisite marble temples and spiritual decor.',
    features: [
      'Premium Marble Craftsmanship',
      'Elegant & Durable',
      'Perfect for Home & Office',
      'Pan India Delivery',
    ],
    btnText: 'Explore Collection',
    link: '/shop?category=Idols',
    isVideo: false,
  };

  const existing = await Banner.findOne({ type: 'Main Slider' }).sort({ slot: 1 });
  let banner;
  if (existing) {
    Object.assign(existing, update);
    banner = await existing.save();
    console.log('Updated existing Main Slider banner:', banner._id.toString());
  } else {
    banner = await Banner.create({ ...update, type: 'Main Slider', slot: 1, sequence: 1, status: 'active' });
    console.log('Created new Main Slider banner:', banner._id.toString());
  }

  console.log(JSON.stringify(banner, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
