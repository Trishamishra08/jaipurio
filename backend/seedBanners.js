require('dotenv').config();
const connectDB = require('./config/db');
const Banner = require('./models/bannerModel');

const bannersData = [
  {
    title: 'Mitti ki Khushboo',
    image: '/jaipurio_banner_art.png',
    link: '/shop',
    type: 'Main Slider',
    badge: '100% Handmade',
    heading: 'Mitti ki Khushboo<br />Rajasthan ki Pehchaan',
    subtitle: 'Authentic kulhads, matkas & terracotta crafts<br className="hidden sm:block" /> from Jaipur artisans',
    buttonText: 'Shop Now',
  },
  {
    title: 'Jaipurio Heritage Banner',
    image: '/jaipurio_home_banner.jpg',
    type: 'Main Slider',
    hasText: false,
  },
  {
    title: 'Handcrafted Terracotta',
    image: '/jaipurio_banner_clean.png',
    link: '/shop',
    type: 'Main Slider',
    badge: 'Artisan Made',
    heading: 'Handcrafted Terracotta<br />From Jaipur Kilns',
    subtitle: 'Explore matkas, kulhads, planters<br className="hidden sm:block" /> and festive diyas',
    buttonText: 'Explore More',
  },
];

const seedBanners = async () => {
  try {
    await connectDB();
    await Banner.deleteMany({});
    console.log('Existing banners removed.');
    await Banner.insertMany(bannersData);
    console.log('Jaipurio banners seeded!');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding banners: ${error.message}`);
    process.exit(1);
  }
};

seedBanners();
