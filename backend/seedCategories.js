require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/categoryModel');
const connectDB = require('./config/db');

const categories = [
  { title: 'Matkas', slug: 'matkas', url: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp' },
  { title: 'Kulhads', slug: 'kulhads', url: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786907/jaipurio/kulhad.webp' },
  { title: 'Planters', slug: 'planters', url: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786910/jaipurio/planter.webp' },
  { title: 'Home Decor', slug: 'home-decor', url: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786914/jaipurio/elephant.webp' },
  { title: 'Puja Essentials', slug: 'puja-essentials', url: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786912/jaipurio/diya.webp' },
  { title: 'Kitchen Mitti', slug: 'kitchen-mitti', url: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp' },
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
