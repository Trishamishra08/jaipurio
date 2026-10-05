/**
 * Full MongoDB backup — dumps every collection to its own JSON file.
 * Run from backend/: node scripts/backupMongo.js [outputDir]
 * Output defaults to a timestamped folder outside the repo (../../jaipurio-mongo-backup/<timestamp>).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { dumpAllCollections } = require('../utils/mongoBackup');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = process.argv[2] || path.join(__dirname, '..', '..', '..', 'jaipurio-mongo-backup', timestamp);

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  console.log('Connecting...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to database:', mongoose.connection.db.databaseName);

  const { dump, summary, database, takenAt } = await dumpAllCollections();
  console.log(`Found ${summary.length} collections.\n`);

  summary.forEach(({ name, count }) => {
    const filePath = path.join(outDir, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dump[name], null, 2));
    const sizeKb = (fs.statSync(filePath).size / 1024).toFixed(1);
    console.log(`  ${name}: ${count} docs, ${sizeKb} KB`);
  });

  fs.writeFileSync(
    path.join(outDir, '_backup_summary.json'),
    JSON.stringify({ takenAt, database, collections: summary }, null, 2)
  );

  console.log(`\nDone. Backup written to:\n  ${outDir}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('BACKUP FAILED:', err.message);
  process.exit(1);
});
