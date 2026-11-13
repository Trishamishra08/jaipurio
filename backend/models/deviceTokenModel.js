const mongoose = require('mongoose');

/**
 * One FCM registration token per (device, role).
 *
 * The same browser can be signed in as a customer and as an admin at the same
 * time, so a token is unique per role — not globally. Saving a token for a role
 * moves it to the account now signed in for that role, so a shared phone never
 * keeps receiving the previous customer's notifications.
 */
const deviceTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, trim: true },
    role: { type: String, enum: ['user', 'vendor', 'admin'], required: true },
    ownerModel: { type: String, enum: ['User', 'Vendor'], required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'ownerModel' },
    platform: { type: String, enum: ['web', 'android', 'ios'], default: 'web' },
    app: { type: String, enum: ['web', 'customer-app', 'seller-app'], default: 'web' },
    userAgent: { type: String, default: '' },
    topics: { type: [String], default: [] },
    lastSeenAt: { type: Date, default: Date.now },
    failureCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

deviceTokenSchema.index({ token: 1, role: 1 }, { unique: true });
deviceTokenSchema.index({ owner: 1, role: 1 });
deviceTokenSchema.index({ lastSeenAt: 1 });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
