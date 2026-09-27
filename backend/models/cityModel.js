const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true, index: true },
    stateName: { type: String, default: '' },
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true, index: true },
    countryName: { type: String, default: '' },
    image: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('City', citySchema);
