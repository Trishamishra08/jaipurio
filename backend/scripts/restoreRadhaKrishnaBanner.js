'use strict';
require('dotenv').config();
const connectDB = require('../config/db');
const Banner = require('../models/bannerModel');

const RADHA_KRISHNA_IMAGE =
  'https://minio-jaipurio.sakha.cloud/jaipurio/uploads/banners/1791268980587-342be5dd-radha-krishna-marble-idol-banner.webp';

async function main() {
  await connectDB();

  // Marble Temple banner is slot 1 — push it to slot 2 so the restored one can take slot 1 or 2 cleanly.
  await Banner.updateOne({ type: 'Main Slider', title: 'Handcrafted Marble Temples' }, { $set: { slot: 1, sequence: 1 } });

  const existing = await Banner.findOne({ type: 'Main Slider', image: RADHA_KRISHNA_IMAGE });
  if (existing) {
    console.log('Radha-Krishna banner already exists:', existing._id.toString());
    process.exit(0);
  }

  const banner = await Banner.create({
    title: 'Divine Marble Idols, Handcrafted in Jaipur',
    subtitle: 'Blessed Radha Krishna statues carved by master artisans of Rajasthan',
    image: RADHA_KRISHNA_IMAGE,
    link: '/shop?category=Idols',
    type: 'Main Slider',
    btnText: 'Shop Idols',
    isVideo: false,
    slot: 2,
    sequence: 2,
    status: 'active',
  });

  console.log('Restored banner:', JSON.stringify(banner, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
