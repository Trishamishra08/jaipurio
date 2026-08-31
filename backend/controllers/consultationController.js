const Consultation = require('../models/consultationModel');

// @desc    Create a consultation request
// @route   POST /api/consultations
// @access  Public
const createConsultation = async (req, res, next) => {
  try {
    const { name, email, phone, date, time, concern } = req.body;

    if (!name || !phone || !date || !time) {
      res.status(400);
      throw new Error('Please fill in required fields');
    }

    const consultation = await Consultation.create({
      name,
      email,
      phone,
      date,
      time,
      concern
    });

    res.status(201).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all consultations
// @route   GET /api/consultations
// @access  Private (Admin only)
const getConsultations = async (req, res, next) => {
  try {
    const consultations = await Consultation.find({}).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: consultations.length,
      data: consultations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update consultation status/note
// @route   PATCH /api/consultations/:id
// @access  Private (Admin only)
const updateConsultation = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    let consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      res.status(404);
      throw new Error('Consultation not found');
    }

    consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConsultation,
  getConsultations,
  updateConsultation
};
