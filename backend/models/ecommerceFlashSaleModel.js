const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    endDate: { type: Date },
    status: { type: String, default: 'Published' },
    products: [
      {
        productId: { type: String },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        price: { type: Number },
        quantity: { type: Number, default: 1 },
        name: { type: String, default: '' },
      },
    ],
    legacyId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EcommerceFlashSale', flashSaleSchema);
