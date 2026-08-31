const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0,
    },
    usageLimit: {
        type: Number,
        default: null, // null means unlimited
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
