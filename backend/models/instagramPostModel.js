const mongoose = require('mongoose');

const instagramPostSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, 'Please provide an image URL']
  },
  link: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InstagramPost', instagramPostSchema);
