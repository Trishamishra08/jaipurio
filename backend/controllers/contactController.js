const Contact = require('../models/contactModel');
const { sendMail } = require('../utils/mailer');

// @desc    Public contact form submission
// @route   POST /api/contacts
// @access  Public
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message, formType, fields } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }
    const doc = await Contact.create({
      name,
      email,
      phone: phone || '',
      subject: subject || '',
      message: message || '',
      formType: formType || 'general',
      fields: fields || {},
      source: req.get('referer') || '',
      ip: req.ip || '',
    });
    res.status(201).json({ success: true, data: { id: String(doc._id) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    List contact submissions (admin)
// @route   GET /api/contacts
const listContacts = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.search || '').trim();
    const status = req.query.status;
    const filter = {};
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { message: { $regex: q, $options: 'i' } },
      ];
    }
    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const [rows, total] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments(filter),
    ]);
    res.json({ success: true, data: rows.map((r) => ({ ...r, id: String(r._id) })), total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getContactById = async (req, res) => {
  try {
    const doc = await Contact.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { ...doc, id: String(doc._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateContact = async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload._id;
    delete payload.id;
    const doc = await Contact.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { ...doc.toObject(), id: String(doc._id) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Reply to a contact submission — stores the reply and emails the sender
// @route   POST /api/contacts/:id/reply
const replyToContact = async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) {
      return res.status(400).json({ success: false, message: 'Reply message is required' });
    }
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Not found' });

    let emailSent = false;
    try {
      const result = await sendMail({
        to: contact.email,
        subject: `Re: ${contact.subject || 'Your message to Jaipurio'}`,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
      });
      emailSent = result.sent;
    } catch (mailErr) {
      console.error('[contact reply] email send failed:', mailErr.message);
    }

    contact.replies.push({
      message,
      repliedBy: req.user?._id,
      repliedByName: req.user?.name || 'Admin',
      emailSent,
    });
    contact.status = 'Read';
    await contact.save();

    res.json({ success: true, data: { ...contact.toObject(), id: String(contact._id) }, emailSent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const doc = await Contact.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { id: String(doc._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitContact, listContacts, getContactById, updateContact, replyToContact, deleteContact };
