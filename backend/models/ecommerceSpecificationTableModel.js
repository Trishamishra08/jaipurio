const mongoose = require('mongoose');

const specificationTableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    description: { type: String, default: '' },
    groups: [
      {
        group: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'EcommerceSpecificationGroup',
        },
        groupName: { type: String, default: '' },
        order: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Pending'],
      default: 'Published',
    },
    legacyId: { type: Number, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EcommerceSpecificationTable', specificationTableSchema);
