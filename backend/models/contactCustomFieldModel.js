const mongoose = require('mongoose');

const contactCustomFieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    label: { type: String, default: '' },
    type: {
      type: String,
      enum: ['Text', 'Textarea', 'Email', 'Phone', 'Select', 'Checkbox'],
      default: 'Text',
    },
    options: [{ type: String }],
    isRequired: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactCustomField', contactCustomFieldSchema);
