const mongoose = require('mongoose');

const uiBlockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'general', trim: true },
    /** HTML / shortcode inserted into the editor when Use is clicked */
    markup: { type: String, required: true, default: '' },
    previewImage: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Published', 'Draft'],
      default: 'Published',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UiBlock', uiBlockSchema);
