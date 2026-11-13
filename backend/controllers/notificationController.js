const Notification = require('../models/notificationModel');
const DeviceToken = require('../models/deviceTokenModel');
const Role = require('../models/roleModel');
const { notify } = require('../services/notify');
const { isPushEnabled } = require('../services/firebaseAdmin');
const { CATEGORIES, ALWAYS_ON } = require('../services/notificationEvents');

const ROLE_MODEL = { user: 'User', admin: 'User', vendor: 'Vendor' };
const PLATFORMS = ['web', 'android', 'ios'];
const APPS = ['web', 'customer-app', 'seller-app'];

const sessionRole = (req) => req.authRole || (req.user?.role === 'admin' ? 'admin' : req.user?.role === 'vendor' ? 'vendor' : 'user');

/** Inbox filter for the signed-in account (admins share the admin inbox). */
const inboxFilter = (role, userId) => ({
  $or: [
    { targetRole: 'all' },
    { targetRole: role, targetId: null },
    { targetRole: role, targetId: userId },
  ],
});

/** Admin-inbox rows carry data.permission; hide those this admin's role doesn't cover. */
const adminPermissionFilter = async (req) => {
  if (sessionRole(req) !== 'admin' || !req.user.adminRole) return null;
  const role = await Role.findById(req.user.adminRole).select('permissions').lean();
  const perms = role?.permissions || [];
  if (perms.includes('all')) return null;
  return { $or: [{ 'data.permission': { $exists: false } }, { 'data.permission': null }, { 'data.permission': { $in: perms } }] };
};

const myQuery = async (req, extra = {}) => {
  const role = sessionRole(req);
  const parts = [inboxFilter(role, req.user._id)];
  const perm = await adminPermissionFilter(req);
  if (perm) parts.push(perm);
  if (Object.keys(extra).length) parts.push(extra);
  return parts.length === 1 ? parts[0] : { $and: parts };
};

// GET /api/notifications/me?page=1&limit=30&category=order — own inbox (customer, seller or admin)
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const page = Math.max(1, Number(req.query.page) || 1);
    const extra = req.query.category && CATEGORIES.includes(req.query.category) ? { category: req.query.category } : {};
    const query = await myQuery(req, extra);

    const [rows, total, unread] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ $and: [query, { readBy: { $ne: userId } }] }),
    ]);

    const notifications = rows.map((n) => ({
      ...n,
      isRead: (n.readBy || []).some((id) => String(id) === String(userId)),
      readBy: undefined,
    }));
    res.status(200).json({ success: true, data: { notifications, total, unread, page, limit } });
  } catch (error) {
    next(error);
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const query = await myQuery(req, { readBy: { $ne: req.user._id } });
    const unread = await Notification.countDocuments(query);
    res.status(200).json({ success: true, data: { unread } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const query = await myQuery(req, { _id: req.params.id });
    const updated = await Notification.updateOne(query, { $addToSet: { readBy: req.user._id } });
    if (!updated.matchedCount) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/mark-all-read
const markAllRead = async (req, res, next) => {
  try {
    const query = await myQuery(req, { readBy: { $ne: req.user._id } });
    await Notification.updateMany(query, { $addToSet: { readBy: req.user._id } });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// ─── Devices (FCM registration tokens) ──────────────────────────────────

// POST /api/notifications/devices  (+ legacy /save-fcm-token, /api/v1/fcm-tokens/save)
// body: { token, platform?: 'web'|'android'|'ios'|'mobile', app?: 'web'|'customer-app'|'seller-app' }
const saveDevice = async (req, res, next) => {
  try {
    const token = String(req.body?.token || '').trim();
    if (!token || token.length < 20 || token.length > 4096) {
      return res.status(400).json({ success: false, message: 'A valid FCM token is required' });
    }
    const role = sessionRole(req);
    let platform = String(req.body.platform || 'web').toLowerCase();
    if (platform === 'mobile') platform = 'android';
    if (!PLATFORMS.includes(platform)) platform = 'web';
    let app = String(req.body.app || '').toLowerCase();
    if (!APPS.includes(app)) app = platform === 'web' ? 'web' : role === 'vendor' ? 'seller-app' : 'customer-app';

    // Unique per (token, role): this re-assigns a shared device to whoever is signed in now.
    await DeviceToken.findOneAndUpdate(
      { token, role },
      {
        $set: {
          owner: req.user._id,
          ownerModel: ROLE_MODEL[role],
          platform,
          app,
          userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
          lastSeenAt: new Date(),
          failureCount: 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, message: 'Device registered for notifications', data: { role, platform, app, pushEnabled: isPushEnabled() } });
  } catch (error) {
    if (error?.code === 11000) return res.status(200).json({ success: true, message: 'Device registered for notifications' });
    next(error);
  }
};

// DELETE /api/notifications/devices  (+ legacy POST /remove-fcm-token)  body: { token }
const removeDevice = async (req, res, next) => {
  try {
    const token = String(req.body?.token || '').trim();
    if (!token) return res.status(400).json({ success: false, message: 'FCM token is required' });
    await DeviceToken.deleteOne({ token, role: sessionRole(req), owner: req.user._id });
    res.status(200).json({ success: true, message: 'Device removed' });
  } catch (error) {
    next(error);
  }
};

// ─── Preferences ────────────────────────────────────────────────────────

// GET /api/notifications/preferences
const getPreferences = async (req, res) => {
  const prefs = req.user.notificationPrefs || {};
  const devices = await DeviceToken.countDocuments({ owner: req.user._id, role: sessionRole(req) });
  res.status(200).json({
    success: true,
    data: { promotions: Boolean(prefs.promotions), muted: prefs.muted || [], devices, pushEnabled: isPushEnabled() },
  });
};

// PUT /api/notifications/preferences  body: { promotions?: boolean, muted?: string[] }
const updatePreferences = async (req, res, next) => {
  try {
    const prefs = req.user.notificationPrefs || {};
    if (typeof req.body.promotions === 'boolean') prefs.promotions = req.body.promotions;
    if (Array.isArray(req.body.muted)) {
      prefs.muted = [...new Set(req.body.muted.filter((c) => CATEGORIES.includes(c) && !ALWAYS_ON.has(c)))];
    }
    req.user.notificationPrefs = prefs;
    await req.user.save();
    res.status(200).json({ success: true, data: { promotions: Boolean(prefs.promotions), muted: prefs.muted || [] } });
  } catch (error) {
    next(error);
  }
};

// ─── Chat ───────────────────────────────────────────────────────────────

const chatHits = new Map(); // senderId → [timestamps]
const chatRateOk = (id) => {
  const now = Date.now();
  const recent = (chatHits.get(id) || []).filter((t) => now - t < 60_000);
  if (recent.length >= 30) return false;
  recent.push(now);
  chatHits.set(id, recent);
  return true;
};

/**
 * Works out who should be told about a chat message, and checks the sender
 * really is part of that conversation. Conversation ids (services/chatService.js):
 *   user-admin-<userId> · vendor-admin-<vendorId> · user-vendor-<userId>-<vendorId>
 */
const chatRecipient = (conversationId, role, senderId) => {
  const id = String(conversationId || '');
  const me = String(senderId);
  let m = id.match(/^user-admin-([a-f0-9]{24})$/i);
  if (m) {
    if (role === 'admin') return { to: { userId: m[1] }, recipientRole: 'user' };
    if (role === 'user' && m[1] === me) return { to: { admins: true }, recipientRole: 'admin' };
    return null;
  }
  m = id.match(/^vendor-admin-([a-f0-9]{24})$/i);
  if (m) {
    if (role === 'admin') return { to: { vendorId: m[1] }, recipientRole: 'vendor' };
    if (role === 'vendor' && m[1] === me) return { to: { admins: true }, recipientRole: 'admin' };
    return null;
  }
  m = id.match(/^user-vendor-([a-f0-9]{24})-([a-f0-9]{24})$/i);
  if (m) {
    if (role === 'user' && m[1] === me) return { to: { vendorId: m[2] }, recipientRole: 'vendor' };
    if (role === 'vendor' && m[2] === me) return { to: { userId: m[1] }, recipientRole: 'user' };
    return null;
  }
  return null;
};

// POST /api/notifications/chat  body: { conversationId, message }
const sendChatNotification = async (req, res, next) => {
  try {
    const role = sessionRole(req);
    const target = chatRecipient(req.body?.conversationId, role, req.user._id);
    if (!target) return res.status(403).json({ success: false, message: 'Not a participant of this conversation' });
    if (!chatRateOk(String(req.user._id))) return res.status(429).json({ success: false, message: 'Too many messages. Please slow down.' });

    const senderName =
      role === 'admin' ? 'Jaipurio Support' : role === 'vendor' ? req.user.storeName || req.user.fullName || req.user.name || 'Seller' : req.user.name || 'Customer';
    await notify({
      event: 'chat.message',
      to: target.to,
      data: { senderName, message: String(req.body?.message || 'Sent an attachment').slice(0, 500), role: target.recipientRole },
      inbox: false, // chats have their own unread state; push only
    });
    res.status(200).json({ success: true, message: 'Chat notification triggered' });
  } catch (error) {
    next(error);
  }
};

// ─── Admin ──────────────────────────────────────────────────────────────

// GET /api/admins/notifications — broadcasts sent to customers/sellers (history)
const getAdminNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ targetRole: { $ne: 'admin' }, event: { $in: ['', null] } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.status(200).json({ success: true, data: { notifications } });
  } catch (error) {
    next(error);
  }
};

// POST /api/admins/notifications — broadcast (inbox + push)
// body: { title, message, type?, targetRole: 'user'|'vendor'|'all', targetId?, link?, promotion?: boolean }
const createNotification = async (req, res, next) => {
  try {
    const { title, message, type, targetRole, targetId, link, promotion } = req.body || {};
    if (!String(title || '').trim() || !String(message || '').trim()) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }
    if (!['user', 'vendor', 'all'].includes(targetRole)) {
      return res.status(400).json({ success: false, message: 'Audience must be customers, sellers or everyone' });
    }
    const safeLink = typeof link === 'string' && /^\/(?!\/)/.test(link.trim()) ? link.trim() : '';
    const overrides = {
      title: String(title).trim(),
      body: String(message).trim(),
      link: safeLink,
      type: ['info', 'success', 'warning', 'alert'].includes(type) ? type : 'info',
      category: promotion ? 'promotion' : 'general',
    };

    const sent = [];
    if (targetId) {
      if (targetRole === 'all') return res.status(400).json({ success: false, message: 'Pick customers or sellers for a single recipient' });
      sent.push(await notify({ event: 'broadcast', to: targetRole === 'vendor' ? { vendorId: targetId } : { userId: targetId }, overrides }));
    } else {
      const roles = targetRole === 'all' ? ['user', 'vendor'] : [targetRole];
      for (const r of roles) sent.push(await notify({ event: 'broadcast', to: { role: r, all: true }, overrides }));
    }
    const created = sent.filter(Boolean);
    if (!created.length) return res.status(404).json({ success: false, message: 'Recipient not found' });
    res.status(201).json({ success: true, data: { notification: created[0], notifications: created, pushEnabled: isPushEnabled() } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admins/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// POST /api/admins/notifications/test — push a test to the calling admin's own devices
const sendTestNotification = async (req, res, next) => {
  try {
    const devices = await DeviceToken.find({ owner: req.user._id, role: 'admin' }).select('token platform').lean();
    if (!isPushEnabled()) {
      return res.status(200).json({ success: false, message: 'Push is not configured on the server yet (Firebase credentials missing).', data: { devices: devices.length } });
    }
    if (!devices.length) {
      return res.status(200).json({ success: false, message: 'No device registered. Enable notifications in this browser first.', data: { devices: 0 } });
    }
    const { sendToTokens } = require('../services/firebaseAdmin');
    const result = await sendToTokens(devices.map((d) => d.token), {
      title: 'Test notification',
      body: 'Push notifications are working for your admin account.',
      link: '/admin',
      category: 'system',
      tag: 'admin-test',
    });
    if (result.deadTokens?.length) await DeviceToken.deleteMany({ token: { $in: result.deadTokens } });
    res.status(200).json({
      success: result.successCount > 0,
      message: result.successCount > 0 ? `Sent to ${result.successCount} device(s).` : 'Could not deliver to any device.',
      data: { devices: devices.length, ...result },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admins/notifications/stats — devices registered per role/platform
const getPushStats = async (req, res, next) => {
  try {
    const rows = await DeviceToken.aggregate([{ $group: { _id: { role: '$role', platform: '$platform' }, count: { $sum: 1 } } }]);
    res.status(200).json({
      success: true,
      data: { pushEnabled: isPushEnabled(), devices: rows.map((r) => ({ role: r._id.role, platform: r._id.platform, count: r.count })) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  saveDevice,
  removeDevice,
  getPreferences,
  updatePreferences,
  sendChatNotification,
  getAdminNotifications,
  createNotification,
  deleteNotification,
  sendTestNotification,
  getPushStats,
  chatRecipient,
  // legacy names
  saveFCMToken: saveDevice,
  removeFCMToken: removeDevice,
};
