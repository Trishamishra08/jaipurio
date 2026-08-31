require('dotenv').config();
const connectDB = require('./config/db');
const Offer = require('./models/offerModel');

const offersToSeed = [
  {
    title: 'On Hair Care Products',
    badge: 'Up to 30% OFF',
    category: 'Hair Care',
    image: '/hair_care_offer.png',
    discountValue: 30,
    isActive: true
  },
  {
    title: 'On Skin Care Range',
    badge: 'Flat 20% OFF',
    category: 'Skin Care',
    image: '/skin_care_offer.png',
    discountValue: 20,
    isActive: true
  },
  {
    title: 'Herbal Tea\nOn Orders Above ₹999',
    badge: 'Free',
    category: 'Herbal Tea',
    image: '/herbal_tea_offer.png',
    discountValue: 0,
    isActive: true
  }
];

const seedOffers = async () => {
  try {
    await connectDB();
    
    // Clear existing offers if any
    await Offer.deleteMany();
    
    // Insert new ones
    await Offer.insertMany(offersToSeed);
    
    console.log('Offers Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding offers: ${error.message}`);
    process.exit(1);
  }
};

seedOffers();
