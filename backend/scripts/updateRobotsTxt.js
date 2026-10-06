'use strict';
require('dotenv').config();
const connectDB = require('../config/db');
const Settings = require('../models/settingsModel');

async function main() {
  await connectDB();
  const defaultRobots = Settings.schema.path('robotsTxt').defaultValue;
  const result = await Settings.updateOne({}, { $set: { robotsTxt: defaultRobots } }, { upsert: true });
  console.log('Updated:', JSON.stringify(result));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
