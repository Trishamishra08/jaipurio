require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const Product = require('./models/productModel');
const Banner = require('./models/bannerModel');
const Settings = require('./models/settingsModel');
const User = require('./models/userModel');
const { invalidateCatalog } = require('./utils/cache');

const mittiProduct = (row) => ({
  lifecycle: 'Published',
  published: true,
  status: 'approved',
  stockStatus: 'In Stock',
  trackQuantity: true,
  codAvailable: true,
  brand: 'Jaipurio Heritage',
  ...row,
});

const initialProducts = [
  mittiProduct({
    name: 'Rajasthani Design Matka (5L)',
    price: 399,
    oldPrice: 599,
    salePrice: 399,
    rating: 4.7,
    reviews: 96,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp'],
    category: 'Matkas',
    packSize: '5 Litre Capacity',
    description: 'Authentic Jaipur hand-painted terracotta water matka. Keeps water naturally cool with porous clay technology.',
    bestseller: true,
    recommended: true,
    stock: 24,
  }),
  mittiProduct({
    name: 'Kulhad (Pack of 6)',
    price: 249,
    oldPrice: 349,
    salePrice: 249,
    rating: 4.6,
    reviews: 74,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786907/jaipurio/kulhad.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786907/jaipurio/kulhad.webp'],
    category: 'Kulhads',
    packSize: '150 ml each (Pack of 6)',
    description: 'Traditional earthen chai kulhads crafted from fine clay. Imparts an authentic earthy aroma to every sip of masala chai.',
    bestseller: true,
    recommended: true,
    stock: 50,
  }),
  mittiProduct({
    name: 'Handmade Mitti Planter',
    price: 349,
    oldPrice: 499,
    salePrice: 349,
    rating: 4.7,
    reviews: 58,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786910/jaipurio/planter.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786910/jaipurio/planter.webp'],
    category: 'Planters',
    packSize: '8 Inch Diameter',
    description: 'Breathable terracotta flower planter with drainage hole for indoor and balcony plants.',
    bestseller: true,
    stock: 35,
  }),
  mittiProduct({
    name: 'Decorative Diya Set (8 Pcs)',
    price: 299,
    oldPrice: 450,
    salePrice: 299,
    rating: 4.8,
    reviews: 41,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786912/jaipurio/diya.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786912/jaipurio/diya.webp'],
    category: 'Puja Essentials',
    packSize: 'Set of 8 Decorated Diyas',
    description: 'Intricately painted festive terracotta diyas for Diwali and daily puja rituals.',
    bestseller: true,
    recommended: true,
    stock: 60,
  }),
  mittiProduct({
    name: 'Jaipuri Handpainted Royal Elephant Figurine',
    price: 699,
    oldPrice: 999,
    salePrice: 699,
    rating: 4.9,
    reviews: 82,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786914/jaipurio/elephant.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786914/jaipurio/elephant.webp'],
    category: 'Home Decor',
    packSize: '10 x 8 x 6 Inches',
    description: 'Hand-sculpted royal elephant adorned in traditional Rajasthani mirror-work motifs.',
    recommended: true,
    stock: 18,
  }),
  mittiProduct({
    name: 'Traditional Mitti Tawa with Handle',
    price: 389,
    oldPrice: 550,
    salePrice: 389,
    rating: 4.7,
    reviews: 63,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp'],
    category: 'Home Decor',
    packSize: '10 Inch Flat Tawa',
    description: 'Unpolished clay tawa for soft rotis and parathas with rich earthy flavor.',
    recommended: true,
    stock: 30,
  }),
  mittiProduct({
    name: 'Mitti Handi with Lid (2L)',
    price: 499,
    oldPrice: 699,
    salePrice: 499,
    rating: 4.8,
    reviews: 112,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp'],
    category: 'Home Decor',
    packSize: '2 Litre Handi with Lid',
    description: 'Deep clay cooking handi ideal for slow-cooking dal, biryani, and vegetable curries.',
    bestseller: true,
    recommended: true,
    stock: 22,
  }),
  mittiProduct({
    name: 'Terracotta Hanging Bell Wind Chime',
    price: 449,
    oldPrice: 650,
    salePrice: 449,
    rating: 4.6,
    reviews: 39,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786910/jaipurio/planter.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786910/jaipurio/planter.webp'],
    category: 'Home Decor',
    packSize: '24 Inches Length',
    description: 'Acoustic clay hanging bells with hand-painted Rajasthani patterns.',
    stock: 28,
  }),
  mittiProduct({
    name: 'Rajasthani Camel Figurine',
    price: 549,
    oldPrice: 799,
    salePrice: 549,
    rating: 4.8,
    reviews: 55,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786916/jaipurio/camel.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786916/jaipurio/camel.webp'],
    category: 'Home Decor',
    packSize: '9 x 7 Inches',
    description: 'Desert camel sculpture with folk-art paintwork from Jaisalmer artisans.',
    stock: 20,
  }),
  mittiProduct({
    name: 'Classic Mitti Surahi',
    price: 329,
    oldPrice: 459,
    salePrice: 329,
    rating: 4.6,
    reviews: 47,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp'],
    category: 'Matkas',
    packSize: '3 Litre Surahi',
    description: 'Traditional surahi for storing and serving cool water in Rajasthani households.',
    stock: 32,
  }),
  mittiProduct({
    name: 'Painted Kulhad (Set of 4)',
    price: 199,
    oldPrice: 299,
    salePrice: 199,
    rating: 4.5,
    reviews: 38,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786907/jaipurio/kulhad.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786907/jaipurio/kulhad.webp'],
    category: 'Kulhads',
    packSize: 'Set of 4 Hand-painted Kulhads',
    description: 'Festive painted kulhads perfect for chai stalls, weddings, and home gatherings.',
    stock: 45,
  }),
  mittiProduct({
    name: 'Terracotta Diya Pair',
    price: 149,
    oldPrice: 199,
    salePrice: 149,
    rating: 4.7,
    reviews: 29,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786912/jaipurio/diya.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786912/jaipurio/diya.webp'],
    category: 'Puja Essentials',
    packSize: 'Pair of Medium Diyas',
    description: 'Simple handmade diyas for daily aarti and festive decoration.',
    stock: 70,
  }),
  mittiProduct({
    name: 'Mini Mitti Planter Set (3 Pcs)',
    price: 279,
    oldPrice: 399,
    salePrice: 279,
    rating: 4.6,
    reviews: 33,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786910/jaipurio/planter.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786910/jaipurio/planter.webp'],
    category: 'Planters',
    packSize: 'Set of 3 Mini Planters',
    description: 'Compact terracotta pots for succulents, herbs, and desk plants.',
    stock: 40,
  }),
  mittiProduct({
    name: 'Festive Matka Duo',
    price: 599,
    oldPrice: 849,
    salePrice: 599,
    rating: 4.8,
    reviews: 51,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp',
    images: ['https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp'],
    category: 'Matkas',
    packSize: '2 Matkas — 3L each',
    description: 'Matching pair of mandana-painted matkas for festivals and home decor.',
    bestseller: true,
    stock: 16,
  }),
];

const fallbackBanners = [
  {
    title: 'Mitti ki Khushboo\nRajasthan ki Pehchaan',
    subtitle: '100% HANDMADE',
    description: 'Authentic kulhads, matkas, and terracotta crafts from Jaipur artisans',
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786919/jaipurio/jaipurio_banner_art.jpg',
    link: '/shop',
  },
];

const initialSettings = {
  taxRate: 0,
  deliveryCharge: 50,
  freeDeliveryThreshold: 499,
  estDeliveryDays: '3-5 Business Days',
  shippingPartner: 'DTDC',
  trackingUrl: 'https://shiprocket.co/tracking/',
  supportContact: '+91 74071 75567',
  isCodEnabled: true,
  codCharge: 0,
};

const ensureDemoCustomer = async () => {
  const email = 'customer@gmail.com';
  const mobile = '8839044030';
  const hashed = await bcrypt.hash('customer123', 10);
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: 'Demo User',
      email,
      mobile,
      password: hashed,
      role: 'user',
      phone: mobile,
    });
    console.log('Demo customer ready: customer@gmail.com / customer123 (OTP mobile 8839044030)');
    return user;
  }
  let changed = false;
  if (user.mobile !== mobile) {
    user.mobile = mobile;
    changed = true;
  }
  if (!user.password) {
    user.password = hashed;
    changed = true;
  }
  if (changed) await user.save();
  return user;
};

const seedData = async () => {
  try {
    await connectDB();

    await Product.deleteMany();
    await Banner.deleteMany();
    await Settings.deleteMany();

    await Product.insertMany(initialProducts);
    await Banner.insertMany(fallbackBanners);
    await Settings.create(initialSettings);
    await ensureDemoCustomer();

    try {
      await invalidateCatalog();
    } catch {
      /* redis optional */
    }

    console.log(`Seeded ${initialProducts.length} mitti products, banners, and settings.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
