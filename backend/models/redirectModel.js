const mongoose = require('mongoose');

const redirectSchema = new mongoose.Schema(
  {
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    type: { type: String, enum: ['301', '302'], default: '301' },
    status: { type: String, default: 'Published' },
  },
  { timestamps: true }
);

redirectSchema.index({ from: 1 }, { unique: true });

module.exports = mongoose.model('Redirect', redirectSchema);
