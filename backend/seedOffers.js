require('dotenv').config();
const connectDB = require('./config/db');
const Offer = require('./models/offerModel');

const offersToSeed = [
  {
    title: 'On Matkas & Surahis',
    badge: 'Up to 20% OFF',
    category: 'Matkas',
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp',
    discountValue: 20,
    isActive: true,
  },
  {
    title: 'On Kulhad Combos',
    badge: 'Flat 15% OFF',
    category: 'Kulhads',
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786907/jaipurio/kulhad.webp',
    discountValue: 15,
    isActive: true,
  },
  {
    title: 'Free Shipping\nOn Orders Above ₹499',
    badge: 'Free',
    category: 'Home Decor',
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786914/jaipurio/elephant.webp',
    discountValue: 0,
    isActive: true,
  },
];

const seedOffers = async () => {
  try {
    await connectDB();
    await Offer.deleteMany();
    await Offer.insertMany(offersToSeed);
    console.log('Jaipurio offers seeded!');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding offers: ${error.message}`);
    process.exit(1);
  }
};

seedOffers();
