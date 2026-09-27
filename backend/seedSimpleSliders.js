require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const SimpleSlider = require('./models/simpleSliderModel');

const seedSimpleSliders = async () => {
  try {
    await connectDB();

    // Non-destructive: only adds sliders that don't already exist by key (never clears
    // existing data — this connects to a shared/production MongoDB Atlas cluster).
    const existingKeys = new Set((await SimpleSlider.find().select('key')).map((s) => s.key));

    const sliders = [
      {
        name: 'Home slider',
        key: 'home-slider',
        description: 'Main homepage hero slider showcasing featured Rajasthani handicraft collections.',
        status: 'Published',
        items: [
          {
            title: 'Tradition Redefined',
            link: '/products?category=blue-pottery',
            description: 'Handcrafted Blue Pottery — a Jaipur legacy, reimagined for modern homes.',
            sortOrder: 1,
            image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/leather-bag-gray.jpg',
          },
          {
            title: 'Festive Marble Collection',
            link: '/products?category=marble-crafts',
            description: 'Hand-carved marble idols and decor, made by Makrana artisans.',
            sortOrder: 2,
            image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/shoes.png',
          },
          {
            title: 'Wedding Season Specials',
            link: '/products?category=gifting',
            description: 'Curated Rajasthani gifting sets — Kulhad tea sets, hand-block prints and more.',
            sortOrder: 3,
            image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/accessories-bag.jpg',
          },
        ],
      },
      {
        name: 'Home2',
        key: 'home2',
        description: 'Secondary homepage slider for seasonal offers.',
        status: 'Draft',
        items: [
          {
            title: 'Monsoon Sale — Up to 40% off',
            link: '/products?sale=monsoon',
            description: 'Limited-time discounts across pottery and textile collections.',
            sortOrder: 1,
            image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/leather-bag-gray.jpg',
          },
        ],
      },
    ].filter((s) => !existingKeys.has(s.key));

    if (sliders.length) {
      await SimpleSlider.insertMany(sliders);
    }

    console.log(`Seeded ${sliders.length} new simple slider(s) (existing data untouched).`);
    process.exit();
  } catch (error) {
    console.error('Error seeding simple sliders:', error);
    process.exit(1);
  }
};

seedSimpleSliders();
