import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchAdminOrders = async () => {
  const res = await api.get('/orders/admin');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const fetchOrder = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return unwrap(res);
};

export const acceptOrder = async (id) => {
  const res = await api.put(`/orders/${id}/accept`);
  return unwrap(res);
};

export const updateOrderStatus = async (id, payload) => {
  const res = await api.put(`/orders/${id}/order-status`, payload);
  return unwrap(res);
};

export const updateShipment = async (id, payload) => {
  const res = await api.put(`/orders/${id}/shipment`, payload);
  return unwrap(res);
};

export const updateOrderItemStatus = async (orderId, itemId, payload) => {
  const res = await api.put(`/orders/${orderId}/item/${itemId}/status`, payload);
  return unwrap(res);
};

export const adminUpdateReturn = async (id, returnStatus) => {
  const res = await api.patch(`/orders/${id}/admin-update-return`, { returnStatus });
  return unwrap(res);
};

export const fetchShipments = async () => {
  const res = await api.get('/orders/shipments');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const fetchIncompleteOrders = async () => {
  const res = await api.get('/incomplete-orders');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const createIncompleteOrder = async (payload) => {
  const res = await api.post('/incomplete-orders', payload);
  return unwrap(res);
};

export const fetchReturns = async () => {
  const res = await api.get('/returns');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const advanceReturn = async (id) => {
  const res = await api.put(`/returns/${id}/advance`);
  return unwrap(res);
};

export const rejectReturn = async (id, note) => {
  const res = await api.put(`/returns/${id}/reject`, { note });
  return unwrap(res);
};
