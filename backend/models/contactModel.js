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
      enum: ['New', 'In Progress', 'Resolved', 'Spam'],
      default: 'New',
    },
    source: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
