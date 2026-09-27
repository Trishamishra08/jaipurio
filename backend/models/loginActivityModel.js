const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    ip: { type: String, default: '' },
    device: { type: String, default: '' },
    status: { type: String, enum: ['Success', 'Blocked'], required: true },
    reason: { type: String, default: '' },
  },
  { timestamps: true }
);

loginActivitySchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('LoginActivity', loginActivitySchema);
