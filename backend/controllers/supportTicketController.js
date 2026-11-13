const SupportTicket = require('../models/supportTicketModel');
const { notify } = require('../services/notify');

// @desc    Create a support ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res, next) => {
  try {
    const { subject, description, priority, orderId } = req.body;

    if (!subject || !description) {
      res.status(400);
      throw new Error('Please fill in required fields');
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      description,
      priority,
      orderId
    });

    res.status(201).json({
      success: true,
      data: ticket
    });

    notify({
      event: 'admin.ticket_new',
      to: { admins: true },
      data: { subject: ticket.subject, from: req.user.name || req.user.fullName },
      relatedId: ticket._id,
      relatedModel: 'SupportTicket',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's tickets
// @route   GET /api/tickets/my-tickets
// @access  Private
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({
      success: true,
      data: { tickets }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tickets
// @route   GET /api/tickets/admin
// @access  Private (Admin only)
const getAllTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({})
      .populate('user', 'name email')
      .sort('-createdAt');
    res.status(200).json({
      success: true,
      data: { tickets }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ticket status / admin note
// @route   PATCH /api/tickets/:id
// @access  Private (Admin only)
const updateTicket = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    let ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      res.status(404);
      throw new Error('Ticket not found');
    }

    ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: ticket
    });

    if (ticket?.user && status) {
      notify({
        event: 'support.updated',
        to: { userId: ticket.user },
        data: { status, ticketRef: String(ticket._id).slice(-6).toUpperCase() },
        relatedId: ticket._id,
        relatedModel: 'SupportTicket',
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicket
};
