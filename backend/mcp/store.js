/**
 * Connector storage: audit log, key-value store (keyword map, settings) and
 * write-only credentials. Three small collections, created on first use.
 */
const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto');

const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);

const McpAudit = model(
  'McpAudit',
  new mongoose.Schema(
    {
      at: { type: Date, default: Date.now, index: true },
      user: String,
      token: String,
      tool: { type: String, index: true },
      collectionName: String,
      docId: String,
      ip: String,
      args: mongoose.Schema.Types.Mixed,
      ok: Boolean,
      error: String,
      ms: Number,
    },
    { collection: 'mcp_audit' }
  )
);

const McpStore = model(
  'McpStore',
  new mongoose.Schema(
    {
      key: { type: String, required: true, unique: true },
      value: mongoose.Schema.Types.Mixed,
    },
    { collection: 'mcp_store', timestamps: true }
  )
);

const McpCredential = model(
  'McpCredential',
  new mongoose.Schema(
    {
      name: { type: String, required: true, unique: true },
      value: { type: String, required: true },
      hint: String,
      setBy: String,
    },
    { collection: 'mcp_credentials', timestamps: true }
  )
);

const audit = async (entry) => {
  try {
    await McpAudit.create(entry);
  } catch (e) {
    console.info(`[mcp-audit] ${JSON.stringify({ ...entry, storeError: e.message })}`);
  }
};

const storeGet = async (key, fallback = null) => {
  const doc = await McpStore.findOne({ key }).lean();
  return doc ? doc.value : fallback;
};

const storeSet = async (key, value) => {
  await McpStore.updateOne({ key }, { $set: { value } }, { upsert: true });
  return value;
};

/** Credentials: write-only. The value is only ever read by server code, never returned. */
const credentialSet = async (name, value, setBy) => {
  const v = String(value);
  await McpCredential.updateOne(
    { name },
    { $set: { value: encrypt(v), hint: v.length > 8 ? `…${v.slice(-4)}` : '••••', setBy } },
    { upsert: true }
  );
};

const credentialGet = async (name) => {
  const doc = await McpCredential.findOne({ name }).lean();
  if (doc) return decrypt(doc.value) || null;
  const env = process.env[name.toUpperCase()];
  return env || null;
};

const credentialRemove = async (name) => (await McpCredential.deleteOne({ name })).deletedCount > 0;

const credentialStatus = async (names) => {
  const docs = await McpCredential.find({ name: { $in: names } }).lean();
  return names.map((n) => {
    const d = docs.find((x) => x.name === n);
    return {
      name: n,
      set: Boolean(d) || Boolean(process.env[n.toUpperCase()]),
      source: d ? 'admin' : process.env[n.toUpperCase()] ? 'env' : null,
      hint: d?.hint || null,
      updatedAt: d?.updatedAt || null,
    };
  });
};

module.exports = {
  McpAudit,
  audit,
  storeGet,
  storeSet,
  credentialSet,
  credentialGet,
  credentialRemove,
  credentialStatus,
};
