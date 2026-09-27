require('dotenv').config();
const connectDB = require('./config/db');
const Ad = require('./models/adModel');

const seedAds = async () => {
  try {
    await connectDB();
    const existing = await Ad.countDocuments();
    if (existing > 0) {
      console.log(`Ad collection already has ${existing} document(s) — skipping seed.`);
      process.exit();
    }

    const ads = [
      { title: 'Jewellery', placement: 'Homepage Sidebar', link: '/products?category=jewellery', description: 'Handcrafted silver & kundan jewellery', status: 'Published' },
      { title: 'Blue Pottery Sale', placement: 'Homepage Sidebar', link: '/products?category=blue-pottery', description: 'Up to 30% off Blue Pottery this week', status: 'Published' },
    ];
    await Ad.insertMany(ads);
    console.log(`Seeded ${ads.length} ad(s).`);
    process.exit();
  } catch (error) {
    console.error('Error seeding ads:', error);
    process.exit(1);
  }
};

seedAds();
