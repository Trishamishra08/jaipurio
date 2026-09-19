const mongoose = require('mongoose');

const mediaAssetSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['folder', 'file'], required: true, index: true },
    name: { type: String, required: true, trim: true },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaAsset',
      default: null,
      index: true,
    },
    /** Storage backend key / public_id */
    storageKey: { type: String, default: '' },
    storageProvider: { type: String, enum: ['cloudinary', 'none'], default: 'none' },
    url: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    alt: { type: String, default: '' },
    isFavorite: { type: Boolean, default: false, index: true },
    /** Soft trash */
    deletedAt: { type: Date, default: null, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

mediaAssetSchema.index({ parentFolder: 1, type: 1, name: 1 });
mediaAssetSchema.index({ name: 'text', alt: 'text' });

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);
