const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    orderNumber: { type: String, default: '' },
    gateway: { type: String, enum: ['razorpay', 'cod', 'other'], default: 'razorpay' },
    gatewayOrderId: { type: String, default: '' },
    gatewayPaymentId: { type: String, default: '', index: true },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['initiated', 'success', 'failed', 'refunded'],
      default: 'initiated',
      index: true,
    },
    method: { type: String, default: '' }, // e.g. card, upi, netbanking (from gateway response)
    errorMessage: { type: String, default: '' },
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
