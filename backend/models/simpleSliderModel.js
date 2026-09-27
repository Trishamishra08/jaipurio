const mongoose = require('mongoose');

const slideItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    link: { type: String, default: '' },
    description: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    image: { type: String, default: '' },
  },
  { timestamps: false }
);

const simpleSliderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
    items: [slideItemSchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

simpleSliderSchema.virtual('shortcode').get(function () {
  return `[simple-slider alias="${this.key}"][/simple-slider]`;
});

module.exports = mongoose.model('SimpleSlider', simpleSliderSchema);
