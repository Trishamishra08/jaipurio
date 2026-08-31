const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Banner = require('./models/bannerModel');

dotenv.config();

connectDB();

const vendorBanners = [
  {
    title: 'Boost Sales By 45% with Prime Badge',
    badge: '📈 Partner Spotlight',
    description: 'Join our exclusive Prime Seller network and show up in top searches across India.',
    btnText: 'Upgrade Now',
    type: 'Vendor Dashboard',
    image: 'https://via.placeholder.com/1200x400/054425/FFFFFF?text=Vendor+Banner+1', // Fallback image since local assets can't be easily seeded as URLs
    status: 'active'
  },
  {
    title: 'Keep More Profits In Your Pocket',
    badge: '🌿 Flat 5% Platform Fees',
    description: 'Special seasonal discount: Platform fee slashed to flat 5% for all Premium Ayurvedic Sellers.',
    btnText: 'Learn More',
    type: 'Vendor Dashboard',
    image: 'https://via.placeholder.com/1200x400/054425/FFFFFF?text=Vendor+Banner+2',
    status: 'active'
  },
  {
    title: 'Herbal Essence Achieved Highest Growth!',
    badge: '🏆 Seller of the Month',
    description: 'Upgrade to premium today to unlock a dedicated home-page showcase feature next month.',
    btnText: 'Get Premium',
    type: 'Vendor Dashboard',
    image: 'https://via.placeholder.com/1200x400/054425/FFFFFF?text=Vendor+Banner+3',
    status: 'active'
  }
];

const seedData = async () => {
  try {
    // Optional: remove existing vendor banners
    await Banner.deleteMany({ type: 'Vendor Dashboard' });

    const createdBanners = await Banner.insertMany(vendorBanners);
    console.log(`Successfully seeded ${createdBanners.length} vendor banners`);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
