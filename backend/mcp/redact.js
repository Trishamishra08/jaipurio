/** Strip secrets and customer contact details from anything returned to Claude. */
const { SECRET_KEY_PATTERN, PII_KEY_PATTERN } = require('./config');

const isObjectId = (v) => v && typeof v === 'object' && v._bsontype === 'ObjectId';

const redact = (value, depth = 0) => {
  if (depth > 12 || value === null || value === undefined) return value;
  if (isObjectId(value)) return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return '[binary]';
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
    if (typeof value.toObject === 'function') value = value.toObject();
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SECRET_KEY_PATTERN.test(k)) continue;
      if (PII_KEY_PATTERN.test(k)) {
        if (v !== undefined && v !== null && v !== '') out[k] = '[hidden]';
        continue;
      }
      out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return value;
};

/** Redact tool arguments for the audit log (long text shortened). */
const redactArgs = (args) => {
  const r = redact(args || {});
  const s = JSON.stringify(r);
  return s.length > 4000 ? { truncated: s.slice(0, 4000) } : r;
};

module.exports = { redact, redactArgs };
