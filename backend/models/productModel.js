const mongoose = require('mongoose');
const { PRODUCT_LIFECYCLE, lifecycleToLegacyStatus, stockStatusFromQty } = require('../constants/flow');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String },
  price: { type: Number, required: true },
  oldPrice: { type: Number },
  salePrice: { type: Number },
  discountProductPrice: { type: Number },
  costPerItem: { type: Number },
  barcode: { type: String },
  brand: { type: String, default: 'Jaipurio Heritage' },
  rating: { type: Number },
  reviews: { type: Number },
  image: { type: String, default: '' },
  iconImage: { type: String, default: '' },
  category: { type: String, required: true },
  packSize: { type: String },
  careInstructions: { type: String, default: '' },
  shippingNotes: { type: String, default: '' },
  returnNotes: { type: String, default: '' },
  description: { type: String },
  content: { type: String },
  ingredients: { type: String },
  benefits: { type: String },
  dosage: { type: String },
  disclaimer: { type: String },
  hasVariants: { type: Boolean, default: false },
  variants: [{
    size: String,
    price: Number,
    oldPrice: Number,
    stock: Number,
    sku: String
  }],
  sku: { type: String },
  images: [{ type: String }],
  prescriptionRequired: { type: Boolean, default: false },
  noRefund: { type: Boolean, default: false },
  codAvailable: { type: Boolean, default: true },
  tags: { type: String },
  bestseller: { type: Boolean, default: false },
  recommended: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeName: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  lifecycle: { type: String, enum: PRODUCT_LIFECYCLE },
  published: { type: Boolean, default: false },
  rejectReason: { type: String, default: '' },
  warehouse: { type: String, default: 'Jaipur WH-1' },
  trackQuantity: { type: Boolean, default: true },
  stockStatus: { type: String, enum: ['In Stock', 'Out of Stock'], default: 'In Stock' },
  weight: { type: Number },
  length: { type: Number },
  width: { type: Number },
  height: { type: Number },
  attributes: [{ name: String, value: String }],
  options: [{ name: String, type: String, values: String }],
  crossSell: { type: String, default: '' },
  related: { type: String, default: '' },
  faqs: { type: String, default: '' },
  minQty: { type: Number },
  maxQty: { type: Number },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
}, {
  timestamps: true
});

productSchema.pre('validate', function syncLifecycle() {
  if (this.title && !this.name) this.name = this.title;
  if (this.name && !this.title) this.title = this.name;
  if (!this.lifecycle) {
    this.lifecycle = this.status === 'approved' || this.published ? 'Published'
      : this.status === 'rejected' ? 'Rejected'
      : 'Pending Approval';
  }
  this.status = lifecycleToLegacyStatus(this.lifecycle);
  this.published = this.lifecycle === 'Published';
});

productSchema.methods.applyStock = function applyStock(qty) {
  this.stockStatus = stockStatusFromQty(qty, this.trackQuantity);
  return this.stockStatus;
};

module.exports = mongoose.model('Product', productSchema);
