require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Coupon = require('./models/couponModel');

const seedCoupons = async () => {
    try {
        await connectDB();
        
        // Clear existing
        await Coupon.deleteMany();

        const mockCoupons = [
            { code: 'WELCOME50', discountType: 'fixed', discountValue: 50, usageLimit: 500, usedCount: 145, expiryDate: '2025-12-31T00:00:00.000Z', isActive: true },
            { code: 'FESTIVAL20', discountType: 'percentage', discountValue: 20, usageLimit: 200, usedCount: 89, expiryDate: '2025-10-15T00:00:00.000Z', isActive: true },
            { code: 'FREESHIP', discountType: 'fixed', discountValue: 100, usageLimit: 1000, usedCount: 412, expiryDate: '2023-11-30T00:00:00.000Z', isActive: false },
            { code: 'SUMMER20', discountType: 'percentage', discountValue: 20, usageLimit: 100, usedCount: 45, expiryDate: '2024-06-30T00:00:00.000Z', isActive: true },
            { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, usageLimit: null, usedCount: 0, expiryDate: '2024-12-31T00:00:00.000Z', isActive: true },
            { code: 'FLASH50', discountType: 'fixed', discountValue: 50, usageLimit: 500, usedCount: 500, expiryDate: '2024-05-15T00:00:00.000Z', isActive: false }
        ];

        await Coupon.insertMany(mockCoupons);
        
        console.log('Coupons seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding coupons:', error);
        process.exit(1);
    }
};

seedCoupons();
