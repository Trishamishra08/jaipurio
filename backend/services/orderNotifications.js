const { notify, orderRef, orderVendorIds } = require('./notify');

/**
 * Notifications that go out when a new order is created:
 * the customer, every seller whose items are in it, and the admins.
 * Never throws (notify() swallows its own errors).
 *
 * @param {object} order  saved Order document
 * @param {{ paid: boolean }} opts  paid = online payment verified, otherwise COD
 */
async function notifyOrderCreated(order, { paid = false } = {}) {
  const orderNumber = orderRef(order);
  const total = order.totalPrice;
  const id = order._id;

  await notify({
    event: paid ? 'order.paid' : 'order.placed',
    to: { userId: order.user },
    data: { orderNumber, total, cod: !paid },
    relatedId: id,
    relatedModel: 'Order',
  });

  for (const vendorId of orderVendorIds(order)) {
    const items = (order.orderItems || []).filter((i) => String(i.vendor?._id || i.vendor) === vendorId);
    await notify({
      event: 'vendor.order_new',
      to: { vendorId },
      data: {
        orderNumber,
        itemCount: items.reduce((n, i) => n + (Number(i.quantity) || 1), 0),
        amount: items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0),
        cod: !paid,
      },
      relatedId: id,
      relatedModel: 'Order',
    });
  }

  await notify({
    event: 'admin.order_new',
    to: { admins: true },
    data: { orderNumber, total, cod: !paid, orderId: String(id), customer: order.shippingAddress?.fullName || order.shippingAddress?.name },
    relatedId: id,
    relatedModel: 'Order',
  });
}

module.exports = { notifyOrderCreated };
