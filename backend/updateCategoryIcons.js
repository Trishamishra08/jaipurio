require('dotenv').config();
const { MongoClient } = require('mongoose').mongo;
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const REMOTE_URI = process.env.MONGODB_URI;
const ICONS_DIR = 'C:\\Users\\trish\\Desktop\\sadabharat_web\\frontend\\src\\assets\\images\\icons';

// Helper to upload to Cloudinary
function uploadToCloudinary(localPath) {
  return new Promise((resolve, reject) => {
    console.log(`Uploading ${localPath} to Cloudinary...`);
    cloudinary.uploader.upload(
      localPath,
      {
        resource_type: 'image',
        folder: 'sadabharat_icons',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
  });
}

// Map icon filename key to category title
function getCategoryNameFromFilename(filename) {
  // e.g. "icon_aromatherapy_1779911786264.png" -> "aromatherapy"
  // "icon_baby_care_1779911800390.png" -> "baby care"
  const clean = filename
    .replace(/^icon_/, '') // Remove leading icon_
    .replace(/_\d+\.(png|jpg|jpeg|gif)$/i, '') // Remove timestamps and extension
    .replace(/_/g, ' '); // Replace underscores with spaces

  return clean.toLowerCase().trim();
}

async function run() {
  console.log('Connecting to Atlas Database...');
  const client = await MongoClient.connect(REMOTE_URI);
  const db = client.db();
  console.log('Connected!');

  const categoriesCol = db.collection('categories');
  const categories = await categoriesCol.find({}).toArray();
  console.log(`Found ${categories.length} categories in database.`);

  const files = fs.readdirSync(ICONS_DIR);
  console.log(`Found ${files.length} icon files in directory.`);

  for (const file of files) {
    const fullPath = path.join(ICONS_DIR, file);
    const categoryKey = getCategoryNameFromFilename(file);
    console.log(`Processing file: ${file} (Key: "${categoryKey}")`);

    // Find matching category from DB
    const matchedCategory = categories.find(cat => cat.title.toLowerCase().trim() === categoryKey);

    if (matchedCategory) {
      try {
        const cloudUrl = await uploadToCloudinary(fullPath);
        await categoriesCol.updateOne(
          { _id: matchedCategory._id },
          { $set: { url: cloudUrl } }
        );
        console.log(`Successfully updated category "${matchedCategory.title}" with icon URL: ${cloudUrl}`);
      } catch (err) {
        console.error(`Error uploading or updating category for file ${file}:`, err.message);
      }
    } else {
      console.log(`No matching category found for key "${categoryKey}"`);
    }
  }

  console.log('Category icons update process completed!');
  await client.close();
}

run().catch(err => {
  console.error('Process failed:', err);
});
