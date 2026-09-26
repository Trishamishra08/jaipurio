const mongoose = require('mongoose');
const exifr = require('exifr');
const MediaAsset = require('../models/mediaAssetModel');
const MediaImage = require('../models/mediaImageModel');
const {
  uploadBuffer,
  deleteStored,
  copyStored,
  getDownloadUrl,
  sanitizeName,
  storageMode,
} = require('../utils/mediaStorage');

const serializeFolder = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  o.id = String(o._id);
  o.type = 'folder';
  return o;
};

const serializeImage = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  o.id = String(o._id);
  o.type = 'file';
  o.parentFolder = o.folderId ? String(o.folderId) : null;
  return o;
};

const toFolderId = (value) => {
  if (value == null || value === '' || value === 'null' || value === 'undefined') return null;
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  return null;
};

const findImageOrFolder = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return { kind: null, doc: null };
  const image = await MediaImage.findById(id);
  if (image) return { kind: 'image', doc: image };
  const folder = await MediaAsset.findById(id);
  if (folder && folder.type === 'folder') return { kind: 'folder', doc: folder };
  // Legacy file rows still on MediaAsset
  if (folder && folder.type === 'file') return { kind: 'legacy', doc: folder };
  return { kind: null, doc: null };
};

const listMedia = async (req, res) => {
  try {
    const parent = toFolderId(req.query.folderId);
    const q = String(req.query.q || '').trim();
    const sort = String(req.query.sort || 'name_asc');
    const trash = req.query.trash === '1' || req.query.trash === 'true';
    const favorites = req.query.favorites === '1';
    const recent = req.query.recent === '1' || req.query.recent === 'true';
    const filterType = req.query.type; // folder|file|image|video|all

    const imageFilter = {};
    if (trash) {
      imageFilter.deletedAt = { $ne: null };
    } else {
      imageFilter.deletedAt = null;
      if (!favorites && !recent) {
        imageFilter.folderId = parent;
      }
    }
    if (favorites) imageFilter.isFavorite = true;
    if (recent) {
      imageFilter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }
    if (filterType === 'video') {
      imageFilter.mimeType = { $regex: /^video\//i };
    } else if (filterType === 'image' || filterType === 'file') {
      imageFilter.mimeType = { $regex: /^(image|application)\//i };
    }
    if (q) {
      imageFilter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { alt: { $regex: q, $options: 'i' } },
        { originalName: { $regex: q, $options: 'i' } },
      ];
    }

    let imageSort = { createdAt: -1 };
    if (sort === 'name_asc') imageSort = { name: 1 };
    if (sort === 'name_desc') imageSort = { name: -1 };
    if (sort === 'newest' || recent) imageSort = { createdAt: -1 };
    if (sort === 'oldest') imageSort = { createdAt: 1 };

    const wantFolders =
      !trash &&
      !favorites &&
      !recent &&
      filterType !== 'image' &&
      filterType !== 'file' &&
      filterType !== 'video';

    let folders = [];
    if (wantFolders && filterType !== 'image') {
      const folderFilter = {
        type: 'folder',
        deletedAt: null,
        parentFolder: parent,
      };
      if (q) folderFilter.name = { $regex: q, $options: 'i' };
      folders = await MediaAsset.find(folderFilter)
        .sort(sort === 'name_desc' ? { name: -1 } : { name: 1 })
        .limit(200)
        .lean();
    }

    let images = [];
    if (filterType !== 'folder') {
      images = await MediaImage.find(imageFilter).sort(imageSort).limit(500).lean();
    }

    // Include legacy MediaAsset files (older uploads before MediaImage collection)
    let legacyFiles = [];
    if (filterType !== 'folder') {
      const legacyFilter = {
        type: 'file',
      };
      if (trash) {
        legacyFilter.deletedAt = { $ne: null };
      } else {
        legacyFilter.deletedAt = null;
        if (!favorites && !recent) {
          legacyFilter.parentFolder = parent;
        }
      }
      if (favorites) legacyFilter.isFavorite = true;
      if (recent) {
        legacyFilter.createdAt = {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        };
      }
      if (filterType === 'video') {
        legacyFilter.mimeType = { $regex: /^video\//i };
      } else if (filterType === 'image' || filterType === 'file') {
        legacyFilter.mimeType = { $regex: /^(image|application)\//i };
      }
      if (q) {
        legacyFilter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { alt: { $regex: q, $options: 'i' } },
        ];
      }
      legacyFiles = await MediaAsset.find(legacyFilter)
        .sort(imageSort)
        .limit(200)
        .lean();
    }

    const items = [
      ...folders.map(serializeFolder),
      ...images.map(serializeImage),
      ...legacyFiles.map((f) => {
        const o = serializeFolder(f);
        o.type = 'file';
        o.parentFolder = f.parentFolder ? String(f.parentFolder) : null;
        return o;
      }),
    ];

    res.json({
      success: true,
      data: {
        items,
        storageMode: storageMode(),
        folderId: parent ? String(parent) : null,
        collection: 'mediaimages',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMedia = async (req, res) => {
  try {
    const { kind, doc } = await findImageOrFolder(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    if (kind === 'image') {
      return res.json({ success: true, data: serializeImage(doc) });
    }
    return res.json({
      success: true,
      data: kind === 'folder' ? serializeFolder(doc) : { ...serializeFolder(doc), type: 'file' },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createFolder = async (req, res) => {
  try {
    const name = sanitizeName(req.body.name || 'New folder');
    const parentFolder = toFolderId(req.body.parentFolder || req.body.folderId);
    const exists = await MediaAsset.findOne({
      type: 'folder',
      name,
      parentFolder: parentFolder || null,
      deletedAt: null,
    });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Folder already exists' });
    }
    const folder = await MediaAsset.create({
      type: 'folder',
      name,
      parentFolder: parentFolder || null,
      storageProvider: 'none',
      uploadedBy: req.user?._id || null,
    });
    res.status(201).json({ success: true, data: serializeFolder(folder) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const uploadMedia = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const folderId = toFolderId(req.body.parentFolder || req.body.folderId);
    const folderPath = folderId ? `media/${folderId}` : 'media';
    const created = [];

    for (const file of files) {
      let location = { latitude: null, longitude: null };
      try {
        const gps = await exifr.gps(file.buffer);
        if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) {
          location = { latitude: gps.latitude, longitude: gps.longitude };
        }
      } catch {
        /* no EXIF GPS data — leave as null, admin can fill in manually */
      }

      const stored = await uploadBuffer(file, folderPath);
      const originalName = file.originalname || 'untitled';
      const name = sanitizeName(originalName);
      const image = await MediaImage.create({
        name,
        originalName,
        folderId: folderId || null,
        url: stored.url,
        storageKey: stored.key,
        storageProvider: stored.provider || 'cloudinary',
        mimeType: stored.mimeType || file.mimetype || 'image/webp',
        size: stored.size || file.size || 0,
        originalSize: file.size || file.buffer?.length || 0,
        width: stored.width || null,
        height: stored.height || null,
        alt: '',
        location,
        uploadedBy: req.user?._id || null,
      });
      created.push(serializeImage(image));
    }

    res.status(201).json({
      success: true,
      data: created,
      message: `${created.length} image(s) saved to mediaimages collection`,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const renameMedia = async (req, res) => {
  try {
    const name = sanitizeName(req.body.name || '');
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const { kind, doc } = await findImageOrFolder(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    doc.name = name;
    await doc.save();
    if (kind === 'image') {
      return res.json({ success: true, data: serializeImage(doc) });
    }
    return res.json({
      success: true,
      data: kind === 'folder' ? serializeFolder(doc) : { ...serializeFolder(doc), type: 'file' },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateAlt = async (req, res) => {
  try {
    const { kind, doc } = await findImageOrFolder(req.params.id);
    if (!doc || (kind !== 'image' && kind !== 'legacy')) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    doc.alt = String(req.body.alt || '');
    await doc.save();
    if (kind === 'image') {
      return res.json({ success: true, data: serializeImage(doc) });
    }
    return res.json({ success: true, data: { ...serializeFolder(doc), type: 'file' } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateMetadata = async (req, res) => {
  try {
    const { kind, doc } = await findImageOrFolder(req.params.id);
    if (!doc || (kind !== 'image' && kind !== 'legacy')) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    const { alt, title, description, copyright, keywords, latitude, longitude } = req.body;
    if (alt !== undefined) doc.alt = String(alt);
    if (title !== undefined) doc.title = String(title);
    if (description !== undefined) doc.description = String(description);
    if (copyright !== undefined) doc.copyright = String(copyright);
    if (keywords !== undefined) {
      doc.keywords = Array.isArray(keywords)
        ? keywords
        : String(keywords).split(',').map((k) => k.trim()).filter(Boolean);
    }
    if (latitude !== undefined || longitude !== undefined) {
      doc.location = {
        latitude: latitude !== undefined && latitude !== '' ? Number(latitude) : doc.location?.latitude ?? null,
        longitude: longitude !== undefined && longitude !== '' ? Number(longitude) : doc.location?.longitude ?? null,
      };
    }
    await doc.save();
    if (kind === 'image') {
      return res.json({ success: true, data: serializeImage(doc) });
    }
    return res.json({ success: true, data: { ...serializeFolder(doc), type: 'file' } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** Re-runs the Cloudinary WebP/quality pipeline against an already-uploaded image's stored URL. */
const reoptimizeMedia = async (req, res) => {
  try {
    const image = await MediaImage.findById(req.params.id);
    if (!image) return res.status(404).json({ success: false, message: 'Not found' });
    const cloudinary = require('cloudinary').v2;
    const result = await cloudinary.uploader.explicit(image.storageKey, {
      type: 'upload',
      eager: [{ width: 2000, crop: 'limit', fetch_format: 'webp', quality: 'auto:good' }],
    });
    const eager = result.eager?.[0];
    if (eager?.secure_url) {
      if (!image.originalSize) image.originalSize = image.size;
      image.url = eager.secure_url;
      image.size = eager.bytes || image.size;
      image.width = eager.width || image.width;
      image.height = eager.height || image.height;
      await image.save();
    }
    res.json({ success: true, data: serializeImage(image) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const replaceMediaFile = async (req, res) => {
  try {
    const file = (req.files && req.files[0]) || req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No cropped file uploaded' });
    }
    const { kind, doc } = await findImageOrFolder(req.params.id);
    if (!doc || (kind !== 'image' && kind !== 'legacy')) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    if (doc.storageKey) {
      await deleteStored(doc.storageProvider, doc.storageKey);
    }
    const folderRef = kind === 'image' ? doc.folderId : doc.parentFolder;
    const folderPath = folderRef ? `media/${folderRef}` : 'media';
    const stored = await uploadBuffer(file, folderPath);
    doc.storageKey = stored.key;
    doc.storageProvider = stored.provider;
    doc.url = stored.url;
    doc.mimeType = stored.mimeType || file.mimetype || doc.mimeType;
    doc.size = stored.size || file.size || 0;
    doc.width = stored.width || null;
    doc.height = stored.height || null;
    await doc.save();
    if (kind === 'image') {
      return res.json({ success: true, data: serializeImage(doc) });
    }
    return res.json({ success: true, data: { ...serializeFolder(doc), type: 'file' } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { kind, doc } = await findImageOrFolder(req.params.id);
    if (!doc || (kind !== 'image' && kind !== 'legacy')) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    const next =
      req.body.isFavorite != null ? Boolean(req.body.isFavorite) : !doc.isFavorite;
    doc.isFavorite = next;
    await doc.save();

    // Prefer MediaImage catalog: migrate legacy favorite into mediaimages
    if (kind === 'legacy' && next) {
      const existing = await MediaImage.findOne({
        $or: [{ storageKey: doc.storageKey }, { url: doc.url }],
      });
      if (existing) {
        existing.isFavorite = true;
        existing.deletedAt = null;
        if (!existing.alt && doc.alt) existing.alt = doc.alt;
        await existing.save();
        // Drop legacy row only (keep Cloudinary file used by MediaImage)
        await MediaAsset.deleteOne({ _id: doc._id });
        return res.status(200).json({ success: true, data: serializeImage(existing) });
      }
      const migrated = await MediaImage.create({
        name: doc.name,
        originalName: doc.name,
        folderId: doc.parentFolder || null,
        url: doc.url,
        storageKey: doc.storageKey || '',
        storageProvider: doc.storageProvider || 'cloudinary',
        mimeType: doc.mimeType || 'image/webp',
        size: doc.size || 0,
        width: doc.width || null,
        height: doc.height || null,
        alt: doc.alt || '',
        isFavorite: true,
        uploadedBy: doc.uploadedBy || req.user?._id || null,
      });
      await MediaAsset.deleteOne({ _id: doc._id });
      return res.status(200).json({ success: true, data: serializeImage(migrated) });
    }

    if (kind === 'image') {
      return res.status(200).json({ success: true, data: serializeImage(doc) });
    }
    return res.status(200).json({
      success: true,
      data: { ...serializeFolder(doc), type: 'file' },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const moveMedia = async (req, res) => {
  try {
    const folderId = toFolderId(req.body.parentFolder || req.body.folderId);
    const { kind, doc } = await findImageOrFolder(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    if (kind === 'image') {
      doc.folderId = folderId;
      await doc.save();
      return res.json({ success: true, data: serializeImage(doc) });
    }
    doc.parentFolder = folderId;
    await doc.save();
    return res.json({
      success: true,
      data: kind === 'folder' ? serializeFolder(doc) : { ...serializeFolder(doc), type: 'file' },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const copyMedia = async (req, res) => {
  try {
    const { kind, doc: source } = await findImageOrFolder(req.params.id);
    if (!source || (kind !== 'image' && kind !== 'legacy')) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    const copied = await copyStored(source.storageProvider, source.storageKey);
    const folderId = kind === 'image' ? source.folderId : source.parentFolder;
    const image = await MediaImage.create({
      name: `${String(source.name).replace(/(\.[^.]+)?$/, ' (copy)$1')}`,
      originalName: source.originalName || source.name,
      folderId: folderId || null,
      storageKey: copied.key,
      storageProvider: copied.provider,
      url: copied.url || source.url,
      mimeType: source.mimeType,
      size: source.size,
      width: source.width,
      height: source.height,
      alt: source.alt || '',
      uploadedBy: req.user?._id || null,
    });
    res.status(201).json({ success: true, data: serializeImage(image) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const trashMedia = async (req, res) => {
  try {
    const { kind, doc } = await findImageOrFolder(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    doc.deletedAt = new Date();
    await doc.save();
    if (kind === 'image') {
      return res.json({ success: true, data: serializeImage(doc) });
    }
    return res.json({
      success: true,
      data: kind === 'folder' ? serializeFolder(doc) : { ...serializeFolder(doc), type: 'file' },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const restoreMedia = async (req, res) => {
  try {
    const { kind, doc } = await findImageOrFolder(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    doc.deletedAt = null;
    await doc.save();
    if (kind === 'image') {
      return res.json({ success: true, data: serializeImage(doc) });
    }
    return res.json({
      success: true,
      data: kind === 'folder' ? serializeFolder(doc) : { ...serializeFolder(doc), type: 'file' },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const destroyMedia = async (req, res) => {
  try {
    const { kind, doc } = await findImageOrFolder(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    if (kind === 'folder') {
      const folderChildren = await MediaAsset.countDocuments({
        parentFolder: doc._id,
        deletedAt: null,
      });
      const imageChildren = await MediaImage.countDocuments({
        folderId: doc._id,
        deletedAt: null,
      });
      if (folderChildren + imageChildren > 0) {
        return res.status(400).json({ success: false, message: 'Folder is not empty' });
      }
      await doc.deleteOne();
      return res.json({ success: true, data: { id: String(doc._id) } });
    }

    if (doc.storageKey) {
      await deleteStored(doc.storageProvider, doc.storageKey);
    }
    await doc.deleteOne();
    res.json({ success: true, data: { id: String(doc._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadMedia = async (req, res) => {
  try {
    const { kind, doc } = await findImageOrFolder(req.params.id);
    if (!doc || kind === 'folder') {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    const url =
      (await getDownloadUrl(doc.storageProvider, doc.storageKey)) || doc.url;
    res.json({ success: true, data: { url, name: doc.name } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const ensureDefaultFolders = async (req, res) => {
  try {
    const defaults = [
      'sliders',
      'promotion',
      'general',
      'news',
      'stores',
      'products',
      'brands',
      'product-categories',
      'customers',
    ];
    const created = [];
    for (const name of defaults) {
      let folder = await MediaAsset.findOne({
        type: 'folder',
        name,
        parentFolder: null,
        deletedAt: null,
      });
      if (!folder) {
        folder = await MediaAsset.create({
          type: 'folder',
          name,
          parentFolder: null,
          storageProvider: 'none',
          uploadedBy: req.user?._id || null,
        });
        created.push(serializeFolder(folder));
      }
    }
    res.json({ success: true, data: { created, storageMode: storageMode() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listMedia,
  getMedia,
  createFolder,
  uploadMedia,
  renameMedia,
  updateAlt,
  updateMetadata,
  reoptimizeMedia,
  replaceMediaFile,
  toggleFavorite,
  moveMedia,
  copyMedia,
  trashMedia,
  restoreMedia,
  destroyMedia,
  downloadMedia,
  ensureDefaultFolders,
};
