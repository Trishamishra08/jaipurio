const mongoose = require('mongoose');
const {
  ORDER_STATUS,
  SHIPMENT_STATUS,
  PAYMENT_STATUS,
} = require('../constants/flow');

const shipmentSchema = new mongoose.Schema({
  number: { type: String, default: '' },
  method: { type: String, default: 'Default' },
  status: { type: String, enum: SHIPMENT_STATUS, default: 'Not created' },
  note: { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, sparse: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  guest: { type: Boolean, default: false },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  customerEmail: { type: String, default: '' },
  note: { type: String, default: '' },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      price: { type: Number, required: true },
      lineTotal: { type: Number },
      image: { type: String },
      vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
      },
      admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['Processing', 'Packed', 'Shipped', 'Dispatched', 'Delivered', 'Cancelled'],
        default: 'Processing'
      },
      trackingNumber: { type: String }
    }
  ],
  shippingAddress: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    town: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'India' },
    phone: { type: String }
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'COD'
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String }
  },
  paymentStatus: {
    type: String,
    enum: PAYMENT_STATUS,
    default: 'Unpaid'
  },
  orderStatus: {
    type: String,
    enum: ORDER_STATUS,
    default: 'Order Placed'
  },
  shipment: {
    type: shipmentSchema,
    default: () => ({ status: 'Not created' })
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  couponCode: { type: String },
  discountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  completedAt: { type: Date },
  returnWindowClosesAt: { type: Date },
  returnStatus: {
    type: String,
    enum: ['Not Requested', 'Return Requested', 'Return Approved', 'Return Rejected', 'Returned', 'Replace Requested', 'Replace Approved', 'Replace Rejected', 'Replaced'],
    default: 'Not Requested'
  },
  returnReason: {
    type: String
  },
  returnAction: {
    type: String,
    enum: ['Refund', 'Replace']
  },
  returnImages: [{
    type: String
  }],
  refundAccountDetails: {
    accountName: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String
  },
  shiprocketOrderId: { type: String },
  dtdcReferenceNumber: { type: String },
  shipmentId: { type: String },
  awbCode: { type: String },
  courierName: { type: String },
  trackingUrl: { type: String },
  shippingCharge: { type: Number },
  pickupScheduled: { type: Boolean, default: false },
  labelUrl: { type: String },
  invoiceUrl: { type: String },
  shippingStatus: { type: String },
  estimatedDelivery: { type: Date }
}, {
  timestamps: true
});

orderSchema.pre('validate', function syncPayment() {
  if (this.isPaid && this.paymentStatus === 'Unpaid') this.paymentStatus = 'Paid';
  if (this.paymentStatus === 'Paid') {
    this.isPaid = true;
    if (!this.paidAmount) this.paidAmount = this.totalPrice;
  }
  if (this.paymentStatus === 'Refunded') this.isPaid = true;
  if (this.orderStatus === 'Completed') {
    this.isDelivered = this.isDelivered || this.shipment?.status === 'Delivered';
  }
});

module.exports = mongoose.model('Order', orderSchema);
