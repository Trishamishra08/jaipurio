require('dotenv').config();
const connectDB = require('./config/db');
const Notification = require('./models/notificationModel');

const seedNotifications = async () => {
  try {
    await connectDB();

    // Non-destructive: only seeds if no admin-targeted notifications exist yet
    // (this connects to a shared/production MongoDB Atlas cluster).
    const existing = await Notification.countDocuments({ targetRole: 'admin' });
    if (existing > 0) {
      console.log(`${existing} admin notification(s) already exist — skipping seed.`);
      process.exit();
    }

    const notifications = [
      {
        title: 'Welcome to Jaipurio Admin',
        message: 'Your admin panel is fully set up. Notifications, profile, and dashboard badges are now live.',
        type: 'success',
        targetRole: 'admin',
        targetId: null,
      },
      {
        title: 'New contact messages waiting',
        message: 'You have unread messages in the Contact section — check Contacts to respond.',
        type: 'info',
        targetRole: 'admin',
        targetId: null,
      },
    ];

    await Notification.insertMany(notifications);
    console.log(`Seeded ${notifications.length} admin notification(s).`);
    process.exit();
  } catch (error) {
    console.error('Error seeding notifications:', error);
    process.exit(1);
  }
};

seedNotifications();
