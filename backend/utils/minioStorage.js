/**
 * MinIO (S3-compatible) media storage — both the migrated legacy catalog and,
 * going forward, new uploads. The bucket is public-read, so every object has
 * a plain, permanent URL — no signing, no expiry.
 */
const Minio = require('minio');
const path = require('path');
const { randomUUID } = require('crypto');
const sharp = require('sharp');

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

const isVideo = (name = '', mime = '') => mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(name);
const isPdf = (name = '', mime = '') => mime === 'application/pdf' || /\.pdf$/i.test(name);
const isSvg = (name = '', mime = '') => mime.includes('svg') || /\.svg$/i.test(name);

// Matches the quality/size ceiling Cloudinary used to apply automatically —
// without this, raw camera/phone uploads land in the bucket unresized and
// uncompressed: slower page loads (hurts Core Web Vitals / LCP, a real
// ranking factor) and inconsistent visual quality between photos.
const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;

/**
 * Resize/compress/convert an image buffer to WebP, same as Cloudinary did.
 * `.rotate()` with no args auto-applies the file's EXIF orientation before
 * stripping it, so phone photos never come out sideways.
 * Returns null (caller keeps the original buffer) for anything sharp
 * shouldn't touch — videos, PDFs, SVGs, or a file sharp can't decode.
 */
const optimizeImage = async (buffer, originalname, mimetype) => {
  if (isVideo(originalname, mimetype) || isPdf(originalname, mimetype) || isSvg(originalname, mimetype)) return null;
  try {
    const image = sharp(buffer).rotate();
    const metadata = await image.metadata();
    const resized = image.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    });
    const output = await resized.webp({ quality: WEBP_QUALITY }).toBuffer({ resolveWithObject: true });
    return {
      buffer: output.data,
      width: output.info.width,
      height: output.info.height,
      // Original (pre-rotation) dimensions, only used as a fallback if the resize somehow yields nothing.
      originalWidth: metadata.width,
      originalHeight: metadata.height,
    };
  } catch {
    // Not a format sharp can decode (or a corrupt file) — upload as-is rather than failing the request.
    return null;
  }
};

/** Upload a buffer (from multer memoryStorage) to MinIO under uploads/<folderPath>/. Images are resized/compressed to WebP first; video/PDF/SVG pass through untouched. */
const uploadBuffer = async (file, folderPath = 'media') => {
  const originalname = file.originalname || 'file';
  const base = sanitizeName(path.parse(originalname).name);
  const folder = String(folderPath || 'media').replace(/^\/|\/$/g, '');
  const stamp = `${Date.now()}-${randomUUID().slice(0, 8)}`;

  const optimized = await optimizeImage(file.buffer, originalname, file.mimetype);
  const buffer = optimized ? optimized.buffer : file.buffer;
  const ext = optimized ? '.webp' : (path.extname(originalname) || '');
  const mimeType = optimized ? 'image/webp' : (file.mimetype || 'application/octet-stream');
  const key = `uploads/${folder}/${stamp}-${base}${ext}`;

  // Keys are unique (timestamp + uuid) and never overwritten, so the content
  // behind a URL can never change — safe to let browsers/CDNs cache it for a year.
  await minioClient.putObject(bucketName, key, buffer, buffer.length, {
    'Content-Type': mimeType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });

  return {
    provider: 'minio',
    key,
    url: getPublicUrl(key),
    mimeType,
    size: buffer.length,
    width: optimized?.width || null,
    height: optimized?.height || null,
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

// Set MEDIA_REWRITE_LEGACY=false to leave jaipurio.in/storage URLs untouched
// (they are still served by the old site) — use it whenever the MinIO host is
// down or has no valid certificate, so catalog images keep loading.
const REWRITE_LEGACY = process.env.MEDIA_REWRITE_LEGACY !== 'false';

const extractKey = (url) => {
  if (REWRITE_LEGACY && url.startsWith(LEGACY_HOST_PREFIX)) return decodeURIComponent(url.slice(LEGACY_HOST_PREFIX.length));
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

// ── Thumbnails ────────────────────────────────────────────────────
// Catalog originals are 150–350 KB PNGs; a page of product cards asked for
// ~100 of them at once and the media host could not deliver them in time on
// phones. Small WebP copies live at a fixed key next to the originals —
// thumbs/<width>/<original key minus extension>.webp — so the storefront can
// request them straight from MinIO and only falls back to the API (which
// creates the copy) the first time.
const THUMB_WIDTHS = [200, 400, 800];
const THUMBABLE = /.(jpe?g|png|webp|gif|avif)$/i;

const snapThumbWidth = (w) => {
  const n = parseInt(w, 10) || 400;
  return THUMB_WIDTHS.find((x) => x >= n) || THUMB_WIDTHS[THUMB_WIDTHS.length - 1];
};

/** Keys we will never thumbnail: private customer files, thumbs themselves, path tricks, non-images. */
const canThumbnail = (key) =>
  typeof key === 'string' &&
  THUMBABLE.test(key) &&
  !key.includes('..') &&
  !key.startsWith('customers/') &&
  !key.startsWith('thumbs/');

const thumbKeyFor = (key, width) => `thumbs/${width}/${key.replace(/.[^./]+$/, '')}.webp`;

const inflightThumbs = new Map();

/** Make sure the WebP thumbnail for `key` exists in the bucket; resolves to its key. */
const ensureThumbnail = (key, width) => {
  const tKey = thumbKeyFor(key, width);
  if (inflightThumbs.has(tKey)) return inflightThumbs.get(tKey);
  const job = (async () => {
    if (await objectExists(tKey)) return tKey;
    const stream = await minioClient.getObject(bucketName, key);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const out = await sharp(Buffer.concat(chunks))
      .rotate()
      .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    await minioClient.putObject(bucketName, tKey, out, out.length, {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    return tKey;
  })().finally(() => inflightThumbs.delete(tKey));
  inflightThumbs.set(tKey, job);
  return job;
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
  extractKey,
  snapThumbWidth,
  canThumbnail,
  thumbKeyFor,
  ensureThumbnail,
};
