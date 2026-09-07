require('dotenv').config();
const connectDB = require('./config/db');
const Notification = require('./models/notificationModel');

const notifications = [
  {
    title: 'New Payout Policy',
    message: 'Vendor payouts are processed every Monday. Review the updated terms in your Jaipurio vendor dashboard.',
    type: 'info',
    targetRole: 'vendor',
  },
  {
    title: 'Festive Season Visibility Boost',
    message: 'List matkas, kulhads, and diya sets with festive pricing to get priority placement on Jaipurio Shop.',
    type: 'success',
    targetRole: 'vendor',
  },
  {
    title: 'Your Order Has Been Shipped!',
    message: 'Your mitti craft order has been dispatched with fragile packaging. Track it from My Orders.',
    type: 'success',
    targetRole: 'user',
  },
  {
    title: 'Tip: Season Your New Matka',
    message: 'Fill a new matka with water for 24 hours before first use. This strengthens the clay and improves natural cooling.',
    type: 'info',
    targetRole: 'user',
  },
  {
    title: 'Free Shipping Above ₹499',
    message: 'Pan-India fragile-care shipping is free on orders above ₹499. Shop matkas, kulhads, and decor today.',
    type: 'warning',
    targetRole: 'all',
  },
];

const seed = async () => {
  try {
    await connectDB();
    await Notification.deleteMany({});
    await Notification.insertMany(notifications);
    console.log(`Jaipurio notifications seeded (${notifications.length})!`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
