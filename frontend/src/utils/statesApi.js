import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchAdminStates = async () => {
  const res = await api.get('/states');
  const rows = unwrap(res);
  return (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, id: r._id || r.id }));
};

export const fetchAdminState = async (id) => {
  const res = await api.get(`/states/${id}`);
  return unwrap(res);
};

export const createAdminState = async (payload) => {
  const res = await api.post('/states', payload);
  return unwrap(res);
};

export const updateAdminState = async (id, payload) => {
  const res = await api.put(`/states/${id}`, payload);
  return unwrap(res);
};

export const deleteAdminState = async (id) => {
  const res = await api.delete(`/states/${id}`);
  return unwrap(res);
};
