import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const ecommerceList = async (resource, params = {}) => {
  const res = await api.get(`/ecommerce/${resource}`, { params });
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const ecommerceGet = async (resource, id) => {
  const res = await api.get(`/ecommerce/${resource}/${id}`);
  return unwrap(res);
};

export const ecommerceCreate = async (resource, payload) => {
  const res = await api.post(`/ecommerce/${resource}`, payload);
  return unwrap(res);
};

export const ecommerceUpdate = async (resource, id, payload) => {
  const res = await api.put(`/ecommerce/${resource}/${id}`, payload);
  return unwrap(res);
};

export const ecommerceRemove = async (resource, id) => {
  const res = await api.delete(`/ecommerce/${resource}/${id}`);
  return unwrap(res);
};

export const fetchEcommerceReports = async () => {
  const res = await api.get('/ecommerce/reports');
  return unwrap(res);
};

export const fetchEcommerceCustomers = async (params = {}) => {
  const res = await api.get('/ecommerce/customers', { params });
  return unwrap(res);
};

export const fetchEcommerceCustomer = async (id) => {
  const res = await api.get(`/ecommerce/customers/${id}`);
  return unwrap(res);
};

export const saveEcommerceCustomer = async (record) => {
  const id = record._id || record.id;
  const payload = { ...record };
  delete payload._id;
  delete payload.id;
  delete payload.orders;
  delete payload.spent;
  if (id && /^[a-f0-9]{24}$/i.test(String(id))) {
    const res = await api.put(`/ecommerce/customers/${id}`, payload);
    return unwrap(res);
  }
  const res = await api.post('/ecommerce/customers', payload);
  return unwrap(res);
};

export const syncEcommerceInvoices = async () => {
  const res = await api.post('/ecommerce/invoices/sync');
  return unwrap(res);
};

/** Load list from API with local fallback (no UI redesign). */
export const liveEcommerceList = async (resource, fallback) => {
  try {
    const rows = await ecommerceList(resource);
    if (rows.length) return rows;
    return typeof fallback === 'function' ? fallback() : fallback || [];
  } catch {
    return typeof fallback === 'function' ? fallback() : fallback || [];
  }
};
