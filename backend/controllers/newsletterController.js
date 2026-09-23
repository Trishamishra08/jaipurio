const NewsletterSubscriber = require('../models/newsletterSubscriberModel');

// @desc    Public newsletter subscribe (upsert by email)
// @route   POST /api/newsletters/subscribe
// @access  Public
const subscribe = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email is required' });
    }
    const doc = await NewsletterSubscriber.findOneAndUpdate(
      { email },
      {
        $set: { status: 'Subscribed', name: req.body.name || '', unsubscribedAt: null },
        $setOnInsert: { email, source: req.body.source || 'website', subscribedAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, data: { id: String(doc._id) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Public unsubscribe
// @route   POST /api/newsletters/unsubscribe
const unsubscribe = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    await NewsletterSubscriber.findOneAndUpdate(
      { email },
      { status: 'Unsubscribed', unsubscribedAt: new Date() }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listSubscribers = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.search || '').trim();
    const status = req.query.status;
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.$or = [{ email: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } }];
    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const [rows, total] = await Promise.all([
      NewsletterSubscriber.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      NewsletterSubscriber.countDocuments(filter),
    ]);
    res.json({ success: true, data: rows.map((r) => ({ ...r, id: String(r._id) })), total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSubscriber = async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload._id;
    delete payload.id;
    const doc = await NewsletterSubscriber.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { ...doc.toObject(), id: String(doc._id) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteSubscriber = async (req, res) => {
  try {
    const doc = await NewsletterSubscriber.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { id: String(doc._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { subscribe, unsubscribe, listSubscribers, updateSubscriber, deleteSubscriber };
