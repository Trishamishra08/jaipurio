const {
  legacyStatusToLifecycle,
  stockStatusFromQty,
  LOW_STOCK_THRESHOLD,
  RETURN_WINDOW_DAYS,
  VENDOR_PLANS,
} = require('../constants/flow');

const nextOrderNumber = async (Order) => {
  const count = await Order.countDocuments();
  return String(375 + count).padStart(8, '0');
};

const nextRmaNumber = async (ReturnRequest) => {
  const count = await ReturnRequest.countDocuments();
  return `RMA-${1001 + count}`;
};

const nextPayoutNumber = async (Payout) => {
  const count = await Payout.countDocuments();
  return `PO-${18 + count}`;
};

const nextIncompleteCode = async (IncompleteOrder) => {
  const count = await IncompleteOrder.countDocuments();
  return `ORD-INC-${1041 + count}`;
};

const serializeProduct = (product, inventory) => {
  const p = product.toObject ? product.toObject() : { ...product };
  const stock = inventory ? Number(inventory.stock) : Number(p.stock || 0);
  const trackQuantity = inventory?.trackQuantity ?? p.trackQuantity ?? true;
  const lifecycle = p.lifecycle || legacyStatusToLifecycle(p.status, p.published);
  const materialAttr = (p.attributes || []).find((a) => a?.name === 'Material');
  return {
    ...p,
    id: p._id ? String(p._id) : p.id,
    title: p.title || p.name,
    name: p.name || p.title,
    description: p.content || p.description || '',
    content: p.content || p.description || '',
    store: p.storeName || p.vendor?.storeName || '',
    lifecycle,
    published: lifecycle === 'Published',
    stock,
    warehouse: inventory?.warehouse || p.warehouse || 'Jaipur WH-1',
    trackQuantity,
    stockStatus: p.stockStatus || stockStatusFromQty(stock, trackQuantity),
    lowStock: trackQuantity && stock > 0 && stock < LOW_STOCK_THRESHOLD,
    material: materialAttr?.value || '',
  };
};

const serializeOrder = (order) => {
  const o = order.toObject ? order.toObject() : { ...order };
  const shipment = o.shipment && o.shipment.status && o.shipment.status !== 'Not created'
    ? o.shipment
    : (o.shipment?.number ? o.shipment : null);
  return {
    ...o,
    id: o.orderNumber || (o._id ? String(o._id).slice(-8).toUpperCase() : ''),
    _id: o._id,
    customer: o.customerName || o.user?.name || 'Guest',
    phone: o.customerPhone || o.shippingAddress?.phone || o.user?.mobile || '',
    town: o.shippingAddress?.town || o.shippingAddress?.city || '',
    guest: Boolean(o.guest) || !o.user,
    paymentStatus: o.paymentStatus || (o.isPaid ? 'Paid' : 'Unpaid'),
    orderStatus: o.orderStatus || (o.isDelivered ? 'Completed' : o.isPaid ? 'Payment Confirmed' : 'Order Placed'),
    subTotal: o.itemsPrice,
    discount: o.discountAmount || 0,
    shippingFee: o.shippingPrice,
    tax: o.taxPrice,
    total: o.totalPrice,
    paidAmount: o.paidAmount || (o.isPaid ? o.totalPrice : 0),
    note: o.note || '',
    items: (o.orderItems || []).map((item) => ({
      name: item.name,
      qty: item.qty,
      amount: item.lineTotal != null ? item.lineTotal : item.price * item.qty,
    })),
    shipment: shipment && shipment.status !== 'Not created' ? shipment : null,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '',
  };
};

const serializeReturn = (item) => {
  const r = item.toObject ? item.toObject() : { ...item };
  return {
    ...r,
    id: r.rmaNumber,
    _id: r._id,
    orderId: r.order?.orderNumber || r.order?._id || r.order,
    customer: r.customer || r.user?.name || '',
    photos: r.photos || (r.photoUrls || []).length,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
  };
};

const serializePayout = (item) => {
  const p = item.toObject ? item.toObject() : { ...item };
  return {
    ...p,
    id: p.payoutNumber,
    _id: p._id,
    vendor: p.vendor?.storeName || p.vendor,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '',
  };
};

const commissionForVendor = (vendor) => {
  if (!vendor) return VENDOR_PLANS.Starter.commissionRate;
  if (vendor.commissionRate != null) return vendor.commissionRate;
  return (VENDOR_PLANS[vendor.plan] || VENDOR_PLANS.Starter).commissionRate;
};

const returnWindowDate = (from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + RETURN_WINDOW_DAYS);
  return d;
};

module.exports = {
  nextOrderNumber,
  nextRmaNumber,
  nextPayoutNumber,
  nextIncompleteCode,
  serializeProduct,
  serializeOrder,
  serializeReturn,
  serializePayout,
  commissionForVendor,
  returnWindowDate,
};
