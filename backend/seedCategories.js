require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/categoryModel');
const connectDB = require('./config/db');

const categories = [
  { title: 'Matkas', slug: 'matkas', url: '/matka.png' },
  { title: 'Kulhads', slug: 'kulhads', url: '/kulhad.png' },
  { title: 'Planters', slug: 'planters', url: '/planter.png' },
  { title: 'Home Decor', slug: 'home-decor', url: '/elephant.png' },
  { title: 'Puja Essentials', slug: 'puja-essentials', url: '/diya.png' },
  { title: 'Kitchen Mitti', slug: 'kitchen-mitti', url: '/matka.png' },
];

const seedData = async () => {
  try {
    await connectDB();
    await Category.deleteMany();
    await Category.insertMany(categories);
    console.log('Mitti categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedData();
