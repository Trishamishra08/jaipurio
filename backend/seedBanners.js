require('dotenv').config();
const connectDB = require('./config/db');
const Banner = require('./models/bannerModel');

const bannersData = [
  {
    title: 'Pure Ayurvedic Goodness',
    image: '/src/assets/images/banner3.png',
    link: '/shop',
    type: 'Main Slider',
    badge: '100% Natural',
    heading: 'Pure Ayurvedic<br />Goodness',
    subtitle: 'Natural ingredients for a healthy<br className="hidden sm:block" /> body, mind & soul',
    buttonText: 'Shop Now',
  },
  {
    title: 'Sada Bharat Standard Banner',
    image: '/src/assets/images/sadabharat_banner.png',
    type: 'Main Slider',
    hasText: false
  },
  {
    title: 'Traditional Healing Modern Life',
    image: '/src/assets/images/sadabharat_banner1.png',
    link: '/shop',
    type: 'Main Slider',
    badge: 'Authentic Care',
    heading: 'Traditional Healing<br />Modern Life',
    subtitle: 'Experience the magic of Ayurveda<br className="hidden sm:block" /> in your daily routine',
    buttonText: 'Explore More',
  }
];

const seedBanners = async () => {
  try {
    await connectDB();
    await Banner.deleteMany({});
    console.log('Existing banners removed.');
    
    await Banner.insertMany(bannersData);
    console.log('Banners successfully seeded!');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding banners: ${error.message}`);
    process.exit(1);
  }
};

seedBanners();
