const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add your name'],
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please add a contact number'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please select a date']
  },
  time: {
    type: String,
    required: [true, 'Please select a time slot']
  },
  concern: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'cancelled'],
    default: 'pending'
  },
  adminNote: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Consultation', consultationSchema);
