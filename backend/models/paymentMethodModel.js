const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, lowercase: true, unique: true }, // razorpay, cod, upi
    description: { type: String, default: '' },
    isEnabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
    logo: { type: String, default: '' },
    /** Rich-text "payment guide" shown to the customer on the order-success/payment page. */
    instructions: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
    minOrderAmount: { type: Number, default: 0 },
    allCountries: { type: Boolean, default: true },
    /** ISO2 country codes this method is restricted to when allCountries is false. */
    countries: { type: [String], default: [] },
    /** Encrypted JSON blob of gateway-specific credentials (see utils/crypto.js). */
    encryptedConfig: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
