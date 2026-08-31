const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  orderId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Open', 'Resolved', 'Closed'],
    default: 'Open'
  },
  adminNote: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
