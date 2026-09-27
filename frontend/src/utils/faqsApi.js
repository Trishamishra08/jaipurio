import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchFaqs = async () => {
  const res = await api.get('/faqs');
  const rows = unwrap(res);
  return (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, id: r._id || r.id }));
};

export const fetchFaq = async (id) => {
  const res = await api.get(`/faqs/${id}`);
  return unwrap(res);
};

export const createFaq = async (payload) => {
  const res = await api.post('/faqs', payload);
  return unwrap(res);
};

export const updateFaq = async (id, payload) => {
  const res = await api.put(`/faqs/${id}`, payload);
  return unwrap(res);
};

export const deleteFaq = async (id) => {
  const res = await api.delete(`/faqs/${id}`);
  return unwrap(res);
};

export const fetchFaqCategories = async () => {
  const res = await api.get('/faqs/categories');
  const rows = unwrap(res);
  return (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, id: r._id || r.id }));
};

export const fetchFaqCategory = async (id) => {
  const res = await api.get(`/faqs/categories/${id}`);
  return unwrap(res);
};

export const createFaqCategory = async (payload) => {
  const res = await api.post('/faqs/categories', payload);
  return unwrap(res);
};

export const updateFaqCategory = async (id, payload) => {
  const res = await api.put(`/faqs/categories/${id}`, payload);
  return unwrap(res);
};

export const deleteFaqCategory = async (id) => {
  const res = await api.delete(`/faqs/categories/${id}`);
  return unwrap(res);
};
