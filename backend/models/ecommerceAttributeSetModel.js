const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoFields');

const attributeSetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    slug: { type: String, trim: true, index: true },
    /**
     * Nested layers: Set -> Groups -> Attributes -> Values.
     * e.g. group "Physical Properties" -> attribute "Color" -> values [Red, Blue].
     */
    groups: [
      {
        name: { type: String, required: true, trim: true },
        slug: String,
        order: { type: Number, default: 0 },
        attributes: [
          {
            title: { type: String, required: true, trim: true },
            slug: String,
            values: [
              {
                title: String,
                slug: String,
                color: String,
                image: String,
                isDefault: { type: Boolean, default: false },
              },
            ],
          },
        ],
      },
    ],
    displayLayout: { type: String, default: 'dropdown' },
    isSearchable: { type: Boolean, default: false },
    isComparable: { type: Boolean, default: false },
    isUseInProductListing: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: { type: String, default: 'Published' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seo: seoFields,
    legacyId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EcommerceAttributeSet', attributeSetSchema);
