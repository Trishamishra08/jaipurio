require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Review = require('./models/reviewModel');
const Testimonial = require('./models/testimonialModel');
const Product = require('./models/productModel');
const Vendor = require('./models/vendorModel');
const User = require('./models/userModel');

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get some existing data to link to
    const products = await Product.find().limit(3);
    const vendor = await Vendor.findOne();
    let user = await User.findOne({ role: 'user' });

    if (!user) {
      // Create a dummy user if none exists
      user = await User.create({
        name: 'Test Customer',
        email: 'testcustomer@example.com',
        phone: '9876543210',
        password: 'password123'
      });
    }

    if (!vendor || products.length === 0) {
      console.log('No products or vendors found. Please ensure you have products and vendors in the DB first.');
      process.exit(1);
    }

    // Seed Reviews
    await Review.deleteMany();
    console.log('Cleared existing reviews');

    const sampleReviews = products.map((product, index) => ({
      product: product._id,
      vendor: product.vendor || vendor._id,
      user: user._id,
      rating: 5 - (index % 2), // 5 or 4
      comment: `Absolutely wonderful product! I have been using ${product.name} for a week and I love the results. Highly recommended!`,
      isApproved: true
    }));

    await Review.insertMany(sampleReviews);
    console.log('Seeded product reviews');

    // Seed Testimonials
    await Testimonial.deleteMany();
    console.log('Cleared existing testimonials');

    const sampleTestimonials = [
      {
        name: 'Anjali Sharma',
        role: 'Verified Buyer',
        rating: 5,
        content: 'Sada Bharat Ayurvedic has completely transformed my skincare routine. The authenticity of the herbs is unmatched!',
        image: 'https://i.pravatar.cc/150?img=1',
        isApproved: true
      },
      {
        name: 'Vikram Singh',
        role: 'Regular Customer',
        rating: 5,
        content: 'Delivery is always on time and the quality of the Bhasma products is exactly as described in the ancient texts.',
        image: 'https://i.pravatar.cc/150?img=11',
        isApproved: true
      },
      {
        name: 'Priya Desai',
        role: 'Health Enthusiast',
        rating: 4,
        content: 'I love their organic teas. Great packaging and excellent customer service whenever I have a question about dosage.',
        image: 'https://i.pravatar.cc/150?img=5',
        isApproved: true
      }
    ];

    await Testimonial.insertMany(sampleTestimonials);
    console.log('Seeded site testimonials');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
