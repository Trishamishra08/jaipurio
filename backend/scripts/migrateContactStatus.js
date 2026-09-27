const Contact = require('../models/contactModel');

/**
 * Old status enum: New | In Progress | Resolved | Spam (4 values, didn't match jaipurio.in's
 * live admin which only has Unread/Read). New schema: Unread | Read.
 * Maps: New/In Progress -> Unread, Resolved/Spam -> Read. Runs once, only touches legacy values.
 */
async function migrateContactStatus() {
  const raw = Contact.collection;
  const legacyToNew = {
    New: 'Unread',
    'In Progress': 'Unread',
    Resolved: 'Read',
    Spam: 'Read',
  };
  const legacyValues = Object.keys(legacyToNew);
  const legacyDocs = await raw.find({ status: { $in: legacyValues } }).toArray();
  if (!legacyDocs.length) return;

  await Promise.all(
    legacyDocs.map((doc) =>
      raw.updateOne({ _id: doc._id }, { $set: { status: legacyToNew[doc.status] } })
    )
  );
  console.log(`Migrated ${legacyDocs.length} contact(s) to Unread/Read status.`);
}

module.exports = migrateContactStatus;
