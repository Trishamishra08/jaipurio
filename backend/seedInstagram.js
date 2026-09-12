require('dotenv').config();
const connectDB = require('./config/db');
const InstagramPost = require('./models/instagramPostModel');

const posts = [
  { image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp', link: 'https://www.instagram.com/' },
  { image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786907/jaipurio/kulhad.webp', link: 'https://www.instagram.com/' },
  { image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786910/jaipurio/planter.webp', link: 'https://www.instagram.com/' },
  { image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786912/jaipurio/diya.webp', link: 'https://www.instagram.com/' },
  { image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786914/jaipurio/elephant.webp', link: 'https://www.instagram.com/' },
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
