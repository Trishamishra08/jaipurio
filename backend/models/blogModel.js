const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  category: {
    type: String,
    required: [true, 'Please add a category']
  },
  excerpt: {
    type: String,
    required: [true, 'Please add an excerpt']
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  image: {
    type: String,
    required: [true, 'Please add an image']
  },
  author: {
    type: String,
    default: 'Sada Bharat Team'
  },
  status: {
    type: String,
    enum: ['Published', 'Draft'],
    default: 'Published'
  },
  readTime: {
    type: String,
    default: '5 min'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Blog', blogSchema);
