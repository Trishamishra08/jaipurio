require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const NewsletterSubscriber = require('./models/newsletterSubscriberModel');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const seedSubscribers = async () => {
  try {
    await connectDB();

    // Non-destructive: only adds subscribers that don't already exist by email
    // (never clears existing data — this connects to a shared/production MongoDB Atlas cluster).
    const existingEmails = new Set((await NewsletterSubscriber.find().select('email')).map((s) => s.email));

    const subscribers = [
      { email: 'priya.sharma@example.com', name: 'Priya Sharma', status: 'Subscribed', source: 'website', subscribedAt: daysAgo(1) },
      { email: 'rahul.verma@example.com', name: 'Rahul Verma', status: 'Subscribed', source: 'website', subscribedAt: daysAgo(3) },
      { email: 'anjali.mehta@example.com', name: 'Anjali Mehta', status: 'Subscribed', source: 'checkout', subscribedAt: daysAgo(5) },
      { email: 'vikram.joshi@example.com', name: '', status: 'Subscribed', source: 'website', subscribedAt: daysAgo(8) },
      { email: 'neha.kapoor@example.com', name: 'Neha Kapoor', status: 'Unsubscribed', source: 'website', subscribedAt: daysAgo(20), unsubscribedAt: daysAgo(2) },
      { email: 'arjun.singh@example.com', name: 'Arjun Singh', status: 'Subscribed', source: 'footer', subscribedAt: daysAgo(12) },
      { email: 'kavya.reddy@example.com', name: '', status: 'Subscribed', source: 'website', subscribedAt: daysAgo(0.5) },
    ]
      .filter((s) => !existingEmails.has(s.email.toLowerCase()));

    if (subscribers.length) await NewsletterSubscriber.insertMany(subscribers);

    console.log(`Seeded ${subscribers.length} new newsletter subscriber(s) (existing data untouched).`);
    process.exit();
  } catch (error) {
    console.error('Error seeding newsletter subscribers:', error);
    process.exit(1);
  }
};

seedSubscribers();
