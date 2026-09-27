const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    subject: { type: String, default: '' },
    message: { type: String, default: '' },
    formType: { type: String, default: 'general' },
    fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['Unread', 'Read'],
      default: 'Unread',
    },
    replies: [
      {
        message: { type: String, required: true },
        repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        repliedByName: { type: String, default: '' },
        emailSent: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    source: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
