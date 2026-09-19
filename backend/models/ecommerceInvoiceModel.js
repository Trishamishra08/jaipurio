const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    orderNumber: { type: String, default: '' },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    status: { type: String, default: 'Issued' },
    issuedAt: { type: Date, default: Date.now },
    pdfUrl: { type: String, default: '' },
    legacyId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EcommerceInvoice', invoiceSchema);
