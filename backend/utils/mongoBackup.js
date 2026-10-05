/**
 * Shared full-database dump logic — used by both the CLI script
 * (scripts/backupMongo.js) and the admin-triggered backup route, so there's
 * one implementation, not two.
 */
const mongoose = require('mongoose');
const zlib = require('zlib');
const { promisify } = require('util');
const gzip = promisify(zlib.gzip);

/** Dumps every collection into one object: { collectionName: [...docs] }. */
const dumpAllCollections = async () => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const dump = {};
  const summary = [];
  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    dump[name] = docs;
    summary.push({ name, count: docs.length });
  }
  return { dump, summary, database: db.databaseName, takenAt: new Date().toISOString() };
};

/** Same dump, gzip-compressed, ready to stream back as a file download. */
const createBackupBuffer = async () => {
  const { dump, summary, database, takenAt } = await dumpAllCollections();
  const payload = JSON.stringify({ database, takenAt, collections: dump });
  const compressed = await gzip(Buffer.from(payload, 'utf-8'));
  return { buffer: compressed, summary, takenAt };
};

module.exports = { dumpAllCollections, createBackupBuffer };
