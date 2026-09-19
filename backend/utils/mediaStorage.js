/**
 * Media binary storage via Cloudinary.
 * Image catalog lives in MongoDB MediaImage collection — two-layer gallery.
 */
const path = require('path');
const { randomUUID } = require('crypto');
const cloudinary = require('cloudinary').v2;
const { toWebpUrl } = require('./imageOptimize');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sanitizeName = (name = 'file') =>
  String(name)
    .replace(/[^\w.\- ()[\]]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 180);

const isVideo = (name = '', mime = '') =>
  mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(name);

const isPdf = (name = '', mime = '') => mime === 'application/pdf' || /\.pdf$/i.test(name);

const uploadBuffer = (file, folderPath = 'media') =>
  new Promise((resolve, reject) => {
    const originalname = file.originalname || 'file';
    const mimetype = file.mimetype || '';
    const video = isVideo(originalname, mimetype);
    const pdf = isPdf(originalname, mimetype);
    const folder = `jaipurio/${String(folderPath || 'media').replace(/^\/|\/$/g, '')}`;
    const opts = {
      folder,
      resource_type: video ? 'video' : pdf ? 'raw' : 'image',
      public_id: `${Date.now()}-${randomUUID().slice(0, 8)}-${sanitizeName(path.parse(originalname).name)}`,
    };
    if (!video && !pdf && !mimetype.includes('svg')) {
      opts.format = 'webp';
      opts.quality = 'auto:good';
      opts.transformation = [
        { width: 2000, crop: 'limit', fetch_format: 'webp', quality: 'auto:good' },
      ];
    }
    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      const url = result.secure_url || '';
      resolve({
        provider: 'cloudinary',
        key: result.public_id,
        url: video || pdf ? url : toWebpUrl(url),
        mimeType: mimetype || result.format || '',
        size: result.bytes || file.size || 0,
        width: result.width || null,
        height: result.height || null,
      });
    });
    stream.end(file.buffer);
  });

const deleteStored = async (provider, key) => {
  if (!key || provider !== 'cloudinary') return;
  const resource_type = /\.(mp4|mov|webm)$/i.test(key) ? 'video' : 'image';
  await cloudinary.uploader.destroy(key, { resource_type }).catch(() => {});
};

const copyStored = async (provider, key) => {
  if (provider !== 'cloudinary' || !key) {
    throw new Error('Cannot copy: Cloudinary asset missing');
  }
  const url = cloudinary.url(key, { secure: true });
  const copied = await cloudinary.uploader.upload(url, {
    folder: path.dirname(key) || 'jaipurio/media',
    public_id: `${path.basename(key)}-copy-${Date.now()}`,
  });
  return {
    provider: 'cloudinary',
    key: copied.public_id,
    url: toWebpUrl(copied.secure_url || ''),
  };
};

const getDownloadUrl = async (provider, key) => {
  if (provider === 'cloudinary' && key) {
    return cloudinary.url(key, { secure: true, resource_type: 'image' });
  }
  return null;
};

const storageMode = () => 'cloudinary';

module.exports = {
  storageMode,
  uploadBuffer,
  deleteStored,
  copyStored,
  getDownloadUrl,
  sanitizeName,
};
