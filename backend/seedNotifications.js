require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./models/notificationModel');
const connectDB = require('./config/db');

const notifications = [
  // Vendor notifications
  {
    title: 'New Payout Policy Effective July 2025',
    message: 'We have updated our vendor payout schedule. Payouts will now be processed every Monday instead of bi-weekly. Please review the updated terms in your dashboard.',
    type: 'info',
    targetRole: 'vendor'
  },
  {
    title: 'Vendor Commission Rate Updated',
    message: 'Your commission structure has been revised. The new rates are effective from 10th June 2025. Login to your vendor dashboard for full details.',
    type: 'warning',
    targetRole: 'vendor'
  },
  {
    title: 'Summer Sale: Boost Your Visibility',
    message: 'The Sada Bharat Summer Wellness Sale starts June 21st. Featured vendor slots are now open. List your products with promotional pricing to get priority placement.',
    type: 'success',
    targetRole: 'vendor'
  },
  {
    title: 'Product Approval Required',
    message: '3 of your recently submitted products are awaiting quality review. Please ensure all product images and descriptions meet our marketplace guidelines.',
    type: 'alert',
    targetRole: 'vendor'
  },
  // User (customer) notifications
  {
    title: 'Your Order Has Been Shipped!',
    message: 'Your order #SB2EEF23 has been dispatched and is on its way. Expected delivery: 11–13 June 2025. Track your shipment from the Orders section.',
    type: 'success',
    targetRole: 'user'
  },
  {
    title: '🌿 Exclusive Ayurvedic Wellness Tips',
    message: 'Did you know? Taking Ashwagandha with warm milk before bed can significantly improve sleep quality. Check out our new blog post for more wellness rituals.',
    type: 'info',
    targetRole: 'user'
  },
  {
    title: 'Flash Sale: 25% Off Sitewide',
    message: 'For the next 24 hours enjoy 25% off across all products. Use code AYUR25 at checkout. Offer valid till midnight tonight only!',
    type: 'warning',
    targetRole: 'user'
  },
  // Broadcast to all
  {
    title: 'Sada Bharat App is Now Live!',
    message: 'Download the Sada Bharat Ayurvedic mobile app for a seamless shopping experience. Available on Android and iOS. Get 10% off your first in-app order.',
    type: 'success',
    targetRole: 'all'
  }
];

const seed = async () => {
  try {
    await connectDB();
    const existing = await Notification.countDocuments();
    if (existing > 0) {
      console.log(`✅ ${existing} notifications already exist. Skipping seed.`);
      process.exit(0);
    }
    await Notification.insertMany(notifications);
    console.log(`✅ Successfully seeded ${notifications.length} notifications!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
