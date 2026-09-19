const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const IncompleteOrder = require('../models/incompleteOrderModel');
const ReturnRequest = require('../models/returnRequestModel');
const EcommerceDiscount = require('../models/ecommerceDiscountModel');
const EcommerceFlashSale = require('../models/ecommerceFlashSaleModel');
const Review = require('../models/reviewModel');

const getReports = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      ordersTotal,
      revenueAgg,
      monthRevenueAgg,
      prevMonthRevenueAgg,
      productsCount,
      customersCount,
      incompleteCount,
      returnsCount,
      reviewsCount,
      discountsCount,
      flashSalesCount,
      recentOrders,
      topProducts,
      statusBreakdown,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
            isPaid: true,
          },
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
      ]),
      Product.countDocuments(),
      User.countDocuments({ role: { $in: ['user', 'customer'] } }),
      IncompleteOrder.countDocuments().catch(() => 0),
      ReturnRequest.countDocuments().catch(() => 0),
      Review.countDocuments().catch(() => 0),
      EcommerceDiscount.countDocuments(),
      EcommerceFlashSale.countDocuments(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber customerName totalPrice orderStatus paymentStatus createdAt')
        .lean(),
      Order.aggregate([
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$orderItems.product',
            name: { $first: '$orderItems.name' },
            qty: { $sum: '$orderItems.qty' },
            revenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
          },
        },
        { $sort: { qty: -1 } },
        { $limit: 10 },
      ]),
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    const paidOrders = revenueAgg[0]?.count || 0;
    const monthRevenue = monthRevenueAgg[0]?.total || 0;
    const prevMonthRevenue = prevMonthRevenueAgg[0]?.total || 0;
    const revenueChange =
      prevMonthRevenue > 0
        ? Number((((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1))
        : monthRevenue > 0
          ? 100
          : 0;

    res.json({
      success: true,
      data: {
        summary: {
          revenue,
          paidOrders,
          ordersTotal,
          monthRevenue,
          prevMonthRevenue,
          revenueChange,
          productsCount,
          customersCount,
          incompleteCount,
          returnsCount,
          reviewsCount,
          discountsCount,
          flashSalesCount,
          averageOrderValue: paidOrders ? Math.round(revenue / paidOrders) : 0,
        },
        recentOrders: recentOrders.map((o) => ({
          ...o,
          id: o.orderNumber || String(o._id),
        })),
        topProducts,
        statusBreakdown: statusBreakdown.map((s) => ({
          status: s._id || 'Unknown',
          count: s.count,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listCustomers = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter = { role: { $in: ['user', 'customer'] } };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
      ];
    }
    const customers = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const ids = customers.map((c) => c._id);
    const orderStats = await Order.aggregate([
      { $match: { user: { $in: ids } } },
      {
        $group: {
          _id: '$user',
          orders: { $sum: 1 },
          spent: { $sum: '$totalPrice' },
        },
      },
    ]);
    const statsMap = Object.fromEntries(
      orderStats.map((s) => [String(s._id), { orders: s.orders, spent: s.spent }])
    );

    res.json({
      success: true,
      data: customers.map((c) => ({
        ...c,
        id: String(c._id),
        orders: statsMap[String(c._id)]?.orders || 0,
        spent: statsMap[String(c._id)]?.spent || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({
      success: true,
      data: {
        ...user,
        id: String(user._id),
        orders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, email, mobile, password, status } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({
      name,
      email,
      mobile: mobile || '',
      password: password || 'ChangeMe123!',
      role: 'user',
      status: status || 'active',
    });
    const data = user.toObject();
    delete data.password;
    data.id = String(data._id);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload.password;
    delete payload.role;
    const user = await User.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });
    const data = user.toObject();
    data.id = String(data._id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const syncInvoicesFromOrders = async (req, res) => {
  try {
    const EcommerceInvoice = require('../models/ecommerceInvoiceModel');
    const paidOrders = await Order.find({
      $or: [{ isPaid: true }, { paymentStatus: 'Paid' }],
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const results = [];
    for (const order of paidOrders) {
      const invoiceNumber = `INV-${order.orderNumber || String(order._id).slice(-8).toUpperCase()}`;
      const doc = await EcommerceInvoice.findOneAndUpdate(
        { order: order._id },
        {
          invoiceNumber,
          order: order._id,
          orderNumber: order.orderNumber || '',
          customerName: order.customerName || '',
          customerEmail: order.customerEmail || '',
          amount: order.totalPrice || 0,
          tax: order.taxPrice || 0,
          status: 'Issued',
          issuedAt: order.paidAt || order.createdAt || new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(doc);
    }
    res.json({ success: true, data: results.map((d) => ({ ...d.toObject(), id: String(d._id) })), synced: results.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReports,
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  syncInvoicesFromOrders,
};
