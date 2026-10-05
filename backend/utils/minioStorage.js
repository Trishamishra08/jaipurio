/**
 * MinIO (S3-compatible) media storage — both the migrated legacy catalog and,
 * going forward, new uploads. The bucket is public-read, so every object has
 * a plain, permanent URL — no signing, no expiry.
 */
const Minio = require('minio');
const path = require('path');
const { randomUUID } = require('crypto');

const endpointHost = (process.env.S3_ENDPOINT || '').replace(/^https?:\/\//, '');
const useSSL = (process.env.S3_ENDPOINT || '').startsWith('https://');

const minioClient = new Minio.Client({
  endPoint: endpointHost,
  useSSL,
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
  region: process.env.S3_REGION || 'us-east-1',
});

const bucketName = process.env.S3_BUCKET;
const PUBLIC_BASE_URL = `${useSSL ? 'https' : 'http'}://${endpointHost}/${bucketName}/`;

/** Still available for callers that explicitly want a signed, time-limited link. Not used for normal display anymore. */
const getPresignedUrl = (objectKey, expirySeconds = 24 * 60 * 60) =>
  minioClient.presignedGetObject(bucketName, objectKey, expirySeconds);

/** Plain, permanent URL for a public object — percent-encodes each path segment (keys can contain spaces/parentheses) without touching the `/` separators. */
const getPublicUrl = (objectKey) =>
  PUBLIC_BASE_URL + objectKey.split('/').map(encodeURIComponent).join('/');

const objectExists = async (objectKey) => {
  try {
    await minioClient.statObject(bucketName, objectKey);
    return true;
  } catch {
    return false;
  }
};

const listObjects = (prefix = '', recursive = true) =>
  new Promise((resolve, reject) => {
    const items = [];
    const stream = minioClient.listObjectsV2(bucketName, prefix, recursive);
    stream.on('data', (obj) => items.push(obj));
    stream.on('end', () => resolve(items));
    stream.on('error', reject);
  });

const sanitizeName = (name = 'file') =>
  String(name)
    .replace(/[^\w.\- ()[\]]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 180);

/** Upload a buffer (from multer memoryStorage) to MinIO under uploads/<folderPath>/. */
const uploadBuffer = async (file, folderPath = 'media') => {
  const originalname = file.originalname || 'file';
  const ext = path.extname(originalname) || '';
  const base = sanitizeName(path.parse(originalname).name);
  const key = `uploads/${String(folderPath || 'media').replace(/^\/|\/$/g, '')}/${Date.now()}-${randomUUID().slice(0, 8)}-${base}${ext}`;

  await minioClient.putObject(bucketName, key, file.buffer, file.buffer.length, {
    'Content-Type': file.mimetype || 'application/octet-stream',
  });

  return {
    provider: 'minio',
    key,
    url: getPublicUrl(key),
    mimeType: file.mimetype || '',
    size: file.buffer.length,
    width: null,
    height: null,
  };
};

const deleteObject = async (key) => {
  if (!key) return;
  await minioClient.removeObject(bucketName, key).catch(() => {});
};

/** Copies an existing object to a new key (used when duplicating a media item). */
const copyObjectKey = async (sourceKey) => {
  const ext = path.extname(sourceKey) || '';
  const base = sanitizeName(path.parse(sourceKey).name);
  const destKey = `uploads/copies/${Date.now()}-${randomUUID().slice(0, 8)}-${base}${ext}`;
  await minioClient.copyObject(bucketName, destKey, `/${bucketName}/${sourceKey}`);
  return destKey;
};

// Two URL patterns get rewritten to a permanent public MinIO URL:
// 1. The legacy WordPress host every migrated product image still references
//    (confirmed across the full catalog, no exceptions) — the remainder of
//    the URL is the MinIO object key as-is.
// 2. Any URL already pointing at this MinIO endpoint+bucket, e.g. one saved
//    back when the bucket was still private and the URL carried a presign
//    signature/expiry — the query string is dropped and a clean permanent
//    URL is rebuilt from the path.
const LEGACY_HOST_PREFIX = 'https://jaipurio.in/storage/';

const extractKey = (url) => {
  if (url.startsWith(LEGACY_HOST_PREFIX)) return decodeURIComponent(url.slice(LEGACY_HOST_PREFIX.length));
  if (url.startsWith(PUBLIC_BASE_URL)) {
    const withoutQuery = url.split('?')[0];
    return decodeURIComponent(withoutQuery.slice(PUBLIC_BASE_URL.length));
  }
  return null;
};

/** Rewrite a MinIO-backed URL (legacy host, or our own — possibly an old presigned link) to the plain permanent URL. Anything else passes through unchanged. */
const resolveImageUrl = (url) => {
  if (typeof url !== 'string') return url;
  const key = extractKey(url);
  return key ? getPublicUrl(key) : url;
};

/** Walk every image-bearing field on a list of serialized products and resolve MinIO URLs in place. */
const resolveProductImages = (products) => {
  const list = Array.isArray(products) ? products : [products];
  list.forEach((p) => {
    if (!p) return;
    if (p.image) p.image = resolveImageUrl(p.image);
    if (p.iconImage) p.iconImage = resolveImageUrl(p.iconImage);
    if (Array.isArray(p.images) && p.images.length) {
      p.images = p.images.map(resolveImageUrl);
    }
  });
  return Array.isArray(products) ? list : list[0];
};

module.exports = {
  minioClient,
  bucketName,
  getPresignedUrl,
  getPublicUrl,
  objectExists,
  listObjects,
  uploadBuffer,
  deleteObject,
  copyObjectKey,
  resolveImageUrl,
  resolveProductImages,
};
