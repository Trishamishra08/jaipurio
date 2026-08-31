const express = require('express');
const router = express.Router();
const { createConsultation, getConsultations, updateConsultation } = require('../controllers/consultationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
  .post(createConsultation)
  .get(protect, authorize('admin'), getConsultations);

router.route('/:id')
  .patch(protect, authorize('admin'), updateConsultation);

module.exports = router;
