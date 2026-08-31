const mongoose = require('mongoose');

const isLocalUri = (uri = '') => /127\.0\.0\.1|localhost/.test(uri);

const connectWith = async (uri, label) => {
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB Connected (${label}): ${conn.connection.host}`);
  return conn;
};

const connectDB = async () => {
  const primary = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jaipurio';
  const fallback = process.env.MONGODB_URI_FALLBACK;

  try {
    await connectWith(primary, isLocalUri(primary) ? 'local' : 'primary');
  } catch (error) {
    if (isLocalUri(primary) && fallback) {
      console.warn(`Local MongoDB not running (${error.message}). Connecting to fallback...`);
      try {
        await connectWith(fallback, 'fallback');
        return;
      } catch (fallbackErr) {
        throw new Error(`Fallback MongoDB failed: ${fallbackErr.message}`);
      }
    }
    throw error;
  }
};

module.exports = connectDB;
