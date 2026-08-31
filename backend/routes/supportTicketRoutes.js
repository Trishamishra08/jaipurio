const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets, getAllTickets, updateTicket } = require('../controllers/supportTicketController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, createTicket);

router.route('/my-tickets')
  .get(protect, getMyTickets);

router.route('/admin')
  .get(protect, authorize('admin'), getAllTickets);

router.route('/:id')
  .patch(protect, authorize('admin'), updateTicket);

module.exports = router;
