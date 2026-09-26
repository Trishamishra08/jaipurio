import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchPaymentMethods = async () => {
  const res = await api.get('/payments/methods');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const fetchAvailableGateways = async () => {
  const res = await api.get('/payments/methods/available');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const addPaymentMethod = async (code) => {
  const res = await api.post('/payments/methods', { code });
  return unwrap(res);
};

export const togglePaymentMethod = async (id, isEnabled) => {
  const res = await api.put(`/payments/methods/${id}/toggle`, { isEnabled });
  return unwrap(res);
};

export const setDefaultPaymentMethod = async (id) => {
  const res = await api.put(`/payments/methods/${id}/default`);
  return unwrap(res);
};

/** payload: { config, name, instructions, minOrderAmount, allCountries, countries } — all optional. */
export const savePaymentMethodConfig = async (id, payload) => {
  const res = await api.put(`/payments/methods/${id}/config`, payload);
  return unwrap(res);
};

export const deletePaymentMethod = async (id) => {
  const res = await api.delete(`/payments/methods/${id}`);
  return unwrap(res);
};

export const fetchCountries = async () => {
  const res = await api.get('/countries/public');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};
