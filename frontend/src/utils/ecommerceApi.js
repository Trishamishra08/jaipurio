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

export const fetchCategoryAttributes = async (categoryId) => {
  const res = await api.get(`/ecommerce/categories/${categoryId}/attributes`);
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const assignCategoryAttribute = async (categoryId, payload) => {
  const res = await api.post(`/ecommerce/categories/${categoryId}/attributes`, payload);
  return unwrap(res);
};

export const updateCategoryAttribute = async (categoryId, assignmentId, payload) => {
  const res = await api.put(`/ecommerce/categories/${categoryId}/attributes/${assignmentId}`, payload);
  return unwrap(res);
};

export const removeCategoryAttribute = async (categoryId, assignmentId) => {
  const res = await api.delete(`/ecommerce/categories/${categoryId}/attributes/${assignmentId}`);
  return unwrap(res);
};

export const reorderCategoryAttributes = async (categoryId, order) => {
  const res = await api.post(`/ecommerce/categories/${categoryId}/attributes/reorder`, { order });
  return unwrap(res);
};

/** Load list from API. Optional fallback kept for older screens; prefer empty when none. */
export const liveEcommerceList = async (resource, fallback) => {
  try {
    const rows = await ecommerceList(resource);
    if (rows.length) return rows;
    if (fallback !== undefined) {
      return typeof fallback === 'function' ? fallback() : fallback || [];
    }
    return [];
  } catch {
    if (fallback !== undefined) {
      return typeof fallback === 'function' ? fallback() : fallback || [];
    }
    return [];
  }
};
