const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, trim: true, uppercase: true, default: '' }, // ISO2, e.g. IN
    dialCode: { type: String, default: '' },
    currency: { type: String, default: '' },
    nationality: { type: String, default: '' },
    image: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Country', countrySchema);
