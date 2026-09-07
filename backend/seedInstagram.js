require('dotenv').config();
const connectDB = require('./config/db');
const InstagramPost = require('./models/instagramPostModel');

const posts = [
  { image: '/matka.png', link: 'https://www.instagram.com/' },
  { image: '/kulhad.png', link: 'https://www.instagram.com/' },
  { image: '/planter.png', link: 'https://www.instagram.com/' },
  { image: '/diya.png', link: 'https://www.instagram.com/' },
  { image: '/elephant.png', link: 'https://www.instagram.com/' },
];

const seedPosts = async () => {
  try {
    await connectDB();
    await InstagramPost.deleteMany();
    await InstagramPost.insertMany(posts);
    console.log('Jaipurio Instagram posts seeded (local mitti images)!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Instagram posts:', error);
    process.exit(1);
  }
};

seedPosts();
