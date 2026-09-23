const mongoose = require('mongoose');

const specificationAttributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EcommerceSpecificationGroup',
      index: true,
    },
    groupName: { type: String, default: '' },
    type: {
      type: String,
      enum: ['Text', 'Textarea', 'Select', 'Checkbox', 'Radio'],
      default: 'Text',
    },
    defaultValue: { type: String, default: '' },
    options: [{ type: String }],
    unit: { type: String, default: '' },
    isRequired: { type: Boolean, default: false },
    isFilterable: { type: Boolean, default: false },
    isSearchable: { type: Boolean, default: false },
    isVariantAttribute: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    status: { type: String, default: 'Published' },
    legacyId: { type: Number, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EcommerceSpecificationAttribute', specificationAttributeSchema);
