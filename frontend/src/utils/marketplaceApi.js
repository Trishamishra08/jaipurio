import api from './api';
import { platformStore } from '../data/platformStore';

const unwrap = (res) => res.data?.data ?? res.data;

export const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));

export const resolveProductId = (record) => {
  if (record?._id && isMongoId(record._id)) return String(record._id);
  if (record?.id && isMongoId(record.id)) return String(record.id);
  return null;
};

export const liveApi = async (fn, fallback) => {
  try {
    return await fn();
  } catch {
    return typeof fallback === 'function' ? fallback() : fallback;
  }
};

const normalizeProductList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  return [];
};

export const fetchVendorProducts = () =>
  liveApi(
    async () => normalizeProductList(unwrap(await api.get('/products/vendor'))),
    () => platformStore.products()
  );

export const fetchProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  return unwrap(res);
};

export const fetchAdminProducts = async () => {
  const res = await api.get('/products/admin');
  return normalizeProductList(unwrap(res));
};

export const resolveProductFromList = (lists, productId) => {
  if (!productId) return null;
  const list = Array.isArray(lists) ? lists : [];
  const direct = list.find((p) => String(p._id || p.id || '') === String(productId));
  if (direct) return direct;
  if (!isMongoId(productId)) {
    const local = platformStore.products().find((p) => String(p.id) === String(productId));
    if (local?.sku) {
      const bySku = list.find((p) => p.sku === local.sku);
      if (bySku) return bySku;
    }
  }
  return null;
};

const buildProductPayload = (record) => {
  const payload = { ...record };
  delete payload._id;
  delete payload.id;
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload.__v;
  if (Array.isArray(payload.images)) {
    payload.images = payload.images.filter((url) => typeof url === 'string' && !url.startsWith('blob:'));
  }
  return payload;
};

export const saveProduct = async (record, role = 'vendor') => {
  const payload = buildProductPayload(record);
  const id = resolveProductId(record);
  if (id) {
    const res = await api.put(`/products/${id}`, payload);
    return unwrap(res);
  }
  const res = await api.post('/products', payload);
  return unwrap(res);
};

export const submitProductForReview = async (record) => {
  const id = resolveProductId(record);
  if (!id) {
    throw new Error('Product must be saved before submitting for review.');
  }
  const res = await api.put(`/products/${id}/submit`);
  return unwrap(res);
};

export const setProductLifecycle = async (id, lifecycle, extra = {}) => {
  const res = await api.put(`/products/${id}/status`, { lifecycle, ...extra });
  return unwrap(res);
};

export const restockProduct = async (productId, stock, warehouse) => {
  try {
    const res = await api.put(`/inventory/${productId}`, { stock, warehouse });
    return unwrap(res);
  } catch {
    const products = platformStore.products().map((item) => {
      if (item.id !== productId && item._id !== productId) return item;
      const qty = Number(stock);
      return {
        ...item,
        stock: qty,
        stockStatus: item.trackQuantity && qty <= 0 ? 'Out of Stock' : 'In Stock',
      };
    });
    platformStore.saveProducts(products);
    return products.find((item) => item.id === productId || item._id === productId);
  }
};

export const fetchInventory = () =>
  liveApi(async () => unwrap(await api.get('/inventory')), () => platformStore.products());

export const fetchOrders = (role = 'vendor') =>
  liveApi(
    async () => unwrap(await api.get(role === 'admin' ? '/orders/admin' : '/orders/vendor')),
    () => platformStore.orders()
  );

export const acceptOrder = async (order) => {
  const id = order._id || order.id;
  try {
    const res = await api.put(`/orders/${id}/accept`);
    return unwrap(res);
  } catch {
    return {
      ...order,
      orderStatus: 'Processing',
      shipment: {
        ...(order.shipment || {}),
        number: order.shipment?.number || `SHP-${order.id}`,
        method: order.shipment?.method || 'Default',
        status: 'Processing',
      },
    };
  }
};

export const setOrderStatus = async (order, orderStatus, extra = {}) => {
  const id = order._id || order.id;
  try {
    const res = await api.put(`/orders/${id}/order-status`, { orderStatus, ...extra });
    return unwrap(res);
  } catch {
    return { ...order, orderStatus, ...extra };
  }
};

export const setShipmentStatus = async (order, status, extra = {}) => {
  const id = order._id || order.id;
  try {
    const res = await api.put(`/orders/${id}/shipment`, { status, ...extra });
    return unwrap(res);
  } catch {
    return {
      ...order,
      shipment: {
        ...(order.shipment || {}),
        number: order.shipment?.number || `SHP-${order.id}`,
        status,
        method: extra.method || (status === 'Dispatched' ? 'Dispatched' : order.shipment?.method || 'Default'),
        note: extra.note ?? order.shipment?.note,
      },
    };
  }
};

export const completeOrder = async (order) => {
  const id = order._id || order.id;
  try {
    const res = await api.put(`/orders/${id}/complete`);
    return unwrap(res);
  } catch {
    return { ...order, orderStatus: 'Completed' };
  }
};

export const fetchReturns = () =>
  liveApi(async () => unwrap(await api.get('/returns')), () => platformStore.returns());

export const advanceReturn = async (item) => {
  const id = item._id || item.id;
  try {
    const res = await api.put(`/returns/${id}/advance`);
    return unwrap(res);
  } catch {
    return item;
  }
};

export const rejectReturn = async (item) => {
  const id = item._id || item.id;
  try {
    const res = await api.put(`/returns/${id}/reject`);
    return unwrap(res);
  } catch {
    return { ...item, status: 'Rejected — admin dispute available' };
  }
};

export const fetchPayouts = () =>
  liveApi(async () => unwrap(await api.get('/payouts')), () => platformStore.payouts());

export const requestPayout = async (amount) => {
  try {
    const res = await api.post('/payouts/request', { amount });
    return unwrap(res);
  } catch {
    const row = {
      id: `PO-${Date.now().toString().slice(-6)}`,
      vendor: 'Shyam Pottery',
      amount: amount || 2400,
      status: 'Pending approval',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    platformStore.savePayouts([row, ...platformStore.payouts()]);
    return row;
  }
};

export const advancePayout = async (item) => {
  const id = item._id || item.id;
  try {
    const res = await api.put(`/payouts/${id}/advance`);
    return unwrap(res);
  } catch {
    return item;
  }
};

export const fetchEarnings = () =>
  liveApi(async () => unwrap(await api.get('/payouts/earnings')), null);

export const fetchIncompleteOrders = () =>
  liveApi(async () => unwrap(await api.get('/incomplete-orders')), []);

export const fetchShipments = () =>
  liveApi(async () => unwrap(await api.get('/orders/shipments')), () => platformStore.orders());
