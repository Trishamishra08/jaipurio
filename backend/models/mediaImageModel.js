const mongoose = require('mongoose');

/**
 * Dedicated gallery image catalog (MongoDB).
 * Binary files live on Cloudinary; this collection stores every uploaded image
 * so the admin media gallery can list them on every open.
 */
const mediaImageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    originalName: { type: String, default: '', trim: true },
    /** Folder in MediaAsset (type=folder). null = root / All media */
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaAsset',
      default: null,
      index: true,
    },
    url: { type: String, required: true, trim: true },
    storageKey: { type: String, default: '', index: true },
    storageProvider: {
      type: String,
      enum: ['cloudinary', 'none'],
      default: 'cloudinary',
    },
    mimeType: { type: String, default: 'image/webp' },
    size: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    alt: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },
    keywords: { type: [String], default: [] },
    description: { type: String, default: '' },
    copyright: { type: String, default: '' },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    originalSize: { type: Number, default: 0 },
    isFavorite: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  { timestamps: true, collection: 'mediaimages' }
);

mediaImageSchema.index({ folderId: 1, deletedAt: 1, createdAt: -1 });
mediaImageSchema.index({ name: 'text', alt: 'text', originalName: 'text' });

module.exports = mongoose.model('MediaImage', mediaImageSchema);
