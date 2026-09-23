const mongoose = require('mongoose');

const categoryAttributeSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    attribute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EcommerceSpecificationAttribute',
      required: true,
      index: true,
    },
    isRequired: { type: Boolean, default: false },
    isVariantAttribute: { type: Boolean, default: false },
    isFilterable: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
  },
  { timestamps: true }
);

categoryAttributeSchema.index({ category: 1, attribute: 1 }, { unique: true });

module.exports = mongoose.model('EcommerceCategoryAttribute', categoryAttributeSchema);
