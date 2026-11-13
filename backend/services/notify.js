const Notification = require('../models/notificationModel');
const DeviceToken = require('../models/deviceTokenModel');
const User = require('../models/userModel');
const Vendor = require('../models/vendorModel');
require('../models/roleModel'); // registers "Role" so admin recipients can be resolved by permission
const { EVENTS, ALWAYS_ON } = require('./notificationEvents');
const { sendToTokens } = require('./firebaseAdmin');

/*
 * notify() — the one way the backend tells someone something.
 *
 *   await notify({ event: 'order.shipped', to: { userId }, data: { orderNumber, awb } });
 *
 * `to` (one of):
 *   { userId }            a customer
 *   { vendorId }          a seller
 *   { admins: true }      every admin whose role allows the event's permission
 *   { role: 'user' | 'vendor', all: true }   broadcast to every customer / seller
 *
 * 1. renders the event template (services/notificationEvents.js)
 * 2. saves it to the recipient's in-app inbox (bell + notification pages)
 * 3. pushes it to their registered devices via FCM — after the response, never
 *    blocking or failing the request that caused it.
 *
 * Never throws: a notification problem must not break an order or a payment.
 */

const ROLE_MODEL = { user: 'User', admin: 'User', vendor: 'Vendor' };

const render = (event, data = {}, overrides = {}) => {
  const def = EVENTS[event] || EVENTS.broadcast;
  const pick = (k) => (overrides[k] !== undefined && overrides[k] !== null && overrides[k] !== '' ? overrides[k] : typeof def[k] === 'function' ? def[k](data) : def[k]);
  return {
    title: String(pick('title') || 'Jaipurio').slice(0, 120),
    body: String(pick('body') || '').slice(0, 400),
    link: pick('link') || '',
    category: overrides.category || def.category || 'general',
    type: overrides.type || def.type || 'info',
    tag: typeof def.tag === 'function' ? def.tag(data) : undefined,
    permission: def.permission || null,
  };
};

const muted = (doc, category) =>
  !ALWAYS_ON.has(category) &&
  ((category === 'promotion' && !doc?.notificationPrefs?.promotions) || (doc?.notificationPrefs?.muted || []).includes(category));

/** Admins allowed to receive an event (no role assigned = receives everything). */
const adminRecipients = async (permission) => {
  const admins = await User.find({ role: 'admin', isBlocked: { $ne: true } })
    .select('_id adminRole notificationPrefs')
    .populate({ path: 'adminRole', select: 'permissions', strictPopulate: false })
    .lean();
  return admins.filter((a) => {
    if (!permission) return true;
    const perms = a.adminRole?.permissions;
    if (!Array.isArray(perms)) return true;
    return perms.includes('all') || perms.includes(permission);
  });
};

const pushTo = async ({ role, owners, rendered, notificationId, data }) => {
  const query = { role };
  if (owners) query.owner = { $in: owners };
  const devices = await DeviceToken.find(query).select('token').lean();
  if (!devices.length) return { successCount: 0, failureCount: 0 };
  const result = await sendToTokens(
    devices.map((d) => d.token),
    {
      title: rendered.title,
      body: rendered.body,
      link: rendered.link,
      category: rendered.category,
      tag: rendered.tag,
      image: data?.image,
      data: { notificationId: notificationId ? String(notificationId) : '', event: data?.__event || '', role },
    }
  );
  if (result.deadTokens?.length) {
    await DeviceToken.deleteMany({ token: { $in: result.deadTokens } });
  }
  return result;
};

const log = (event, target, result) => {
  if (!result || result.skipped) return;
  console.log(`notify: ${event} → ${target}: sent ${result.successCount || 0}, failed ${result.failureCount || 0}${result.deadTokens?.length ? `, removed ${result.deadTokens.length} dead token(s)` : ''}`);
};

/**
 * @param {object} opts
 * @param {string} opts.event      key in EVENTS (or 'broadcast')
 * @param {object} opts.to         recipient selector (see above)
 * @param {object} [opts.data]     template data
 * @param {object} [opts.overrides] { title, body, link, category, type } — used by broadcasts
 * @param {string} [opts.relatedId]
 * @param {string} [opts.relatedModel]
 * @param {boolean} [opts.inbox=true]  also save to the in-app inbox
 * @returns {Promise<object|null>} the saved inbox notification (or null)
 */
async function notify({ event, to = {}, data = {}, overrides = {}, relatedId = null, relatedModel = null, inbox = true }) {
  try {
    if (!EVENTS[event] && event !== 'broadcast') console.warn(`notify: unknown event "${event}"`);
    const rendered = render(event, data, overrides);
    const payloadData = { ...data, __event: event };

    // ── Resolve the audience ────────────────────────────────────────────
    let targetRole;
    let targetId = null;
    let pushPlan; // async () => result

    if (to.userId || to.vendorId) {
      targetRole = to.vendorId ? 'vendor' : 'user';
      targetId = to.vendorId || to.userId;
      const Model = targetRole === 'vendor' ? Vendor : User;
      const owner = await Model.findById(targetId).select('_id notificationPrefs').lean();
      if (!owner) return null;
      pushPlan = muted(owner, rendered.category) ? null : (id) => pushTo({ role: targetRole, owners: [owner._id], rendered, notificationId: id, data: payloadData });
    } else if (to.admins) {
      targetRole = 'admin';
      pushPlan = async (id) => {
        const admins = (await adminRecipients(rendered.permission)).filter((a) => !muted(a, rendered.category));
        if (!admins.length) return { successCount: 0, failureCount: 0 };
        return pushTo({ role: 'admin', owners: admins.map((a) => a._id), rendered, notificationId: id, data: payloadData });
      };
    } else if (to.all && (to.role === 'user' || to.role === 'vendor')) {
      targetRole = to.role;
      pushPlan = async (id) => {
        let owners = null;
        if (rendered.category === 'promotion' || to.respectPrefs) {
          const Model = to.role === 'vendor' ? Vendor : User;
          const filter = to.role === 'user' ? { role: 'user' } : {};
          if (rendered.category === 'promotion') filter['notificationPrefs.promotions'] = true;
          owners = (await Model.find(filter).select('_id').lean()).map((o) => o._id);
        }
        return pushTo({ role: to.role, owners, rendered, notificationId: id, data: payloadData });
      };
    } else {
      console.warn(`notify: no recipient for "${event}"`);
      return null;
    }

    // ── Inbox ───────────────────────────────────────────────────────────
    let saved = null;
    if (inbox) {
      saved = await Notification.create({
        title: rendered.title,
        message: rendered.body || rendered.title,
        type: rendered.type,
        targetRole,
        targetId,
        event: event === 'broadcast' ? '' : event,
        category: rendered.category,
        link: rendered.link,
        data: rendered.permission ? { permission: rendered.permission } : undefined,
        relatedId: relatedId || null,
        relatedModel: relatedModel || null,
      });
    }

    // ── Push (after the response; never awaited by the caller's request) ─
    if (pushPlan) {
      setImmediate(() => {
        pushPlan(saved?._id)
          .then((r) => log(event, targetId ? `${targetRole}:${targetId}` : `${targetRole}s`, r))
          .catch((err) => console.error(`notify: push for "${event}" failed:`, err.message));
      });
    }
    return saved;
  } catch (err) {
    console.error(`notify: "${event}" failed:`, err.message);
    return null;
  }
}

/** Order number for messages — never the Mongo id. */
const orderRef = (order) =>
  String(order?.orderNumber || order?.legacyId || (order?._id ? String(order._id).slice(-6).toUpperCase() : ''));

/** Distinct vendor ids on an order (items carry their vendor). */
const orderVendorIds = (order) => [
  ...new Set((order?.orderItems || []).map((i) => i.vendor && String(i.vendor._id || i.vendor)).filter(Boolean)),
];

module.exports = { notify, render, orderRef, orderVendorIds, ROLE_MODEL };
