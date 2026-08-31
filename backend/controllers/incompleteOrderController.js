const IncompleteOrder = require('../models/incompleteOrderModel');
const { nextIncompleteCode, } = require('../utils/marketplace');

const listIncompleteOrders = async (req, res) => {
  try {
    const filter = req.user.role === 'vendor' ? { vendor: req.user._id } : {};
    const rows = await IncompleteOrder.find(filter).sort('-createdAt');
    res.status(200).json({
      success: true,
      data: rows.map((row) => ({
        id: row._id,
        code: row.code,
        customer: row.customer,
        amount: `₹${Number(row.amount || 0).toLocaleString('en-IN')}`,
        status: row.status,
        createdAt: row.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createIncompleteOrder = async (req, res) => {
  try {
    const row = await IncompleteOrder.create({
      code: req.body.code || await nextIncompleteCode(IncompleteOrder),
      customer: req.body.customer || 'Guest',
      email: req.body.email || '',
      phone: req.body.phone || '',
      amount: Number(req.body.amount || 0),
      status: req.body.status || 'Abandoned',
      items: req.body.items || [],
      vendor: req.body.vendor || (req.user.role === 'vendor' ? req.user._id : undefined),
    });
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listIncompleteOrders,
  createIncompleteOrder,
};
