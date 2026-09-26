const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

const getKey = () => {
  const secret = process.env.PAYMENT_CONFIG_SECRET || process.env.JWT_ACCESS_SECRET || 'jaipurio-dev-secret';
  return crypto.createHash('sha256').update(secret).digest();
};

const encrypt = (plainText) => {
  if (plainText === undefined || plainText === null || plainText === '') return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

const decrypt = (payload) => {
  if (!payload) return '';
  try {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
};

const mask = (value) => {
  const str = String(value || '');
  if (!str) return '';
  if (str.length <= 4) return '••••';
  return `••••${str.slice(-4)}`;
};

module.exports = { encrypt, decrypt, mask };
