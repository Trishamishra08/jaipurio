const mongoose = require('mongoose');

const specificationGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    description: { type: String, default: '' },
    attributes: [
      {
        name: String,
        type: { type: String, default: 'text' },
        options: [String],
      },
    ],
    status: { type: String, default: 'Published' },
    legacyId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EcommerceSpecificationGroup', specificationGroupSchema);
