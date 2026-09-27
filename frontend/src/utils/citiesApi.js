import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchAdminCities = async () => {
  const res = await api.get('/cities');
  const rows = unwrap(res);
  return (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, id: r._id || r.id }));
};

export const fetchAdminCity = async (id) => {
  const res = await api.get(`/cities/${id}`);
  return unwrap(res);
};

export const createAdminCity = async (payload) => {
  const res = await api.post('/cities', payload);
  return unwrap(res);
};

export const updateAdminCity = async (id, payload) => {
  const res = await api.put(`/cities/${id}`, payload);
  return unwrap(res);
};

export const deleteAdminCity = async (id) => {
  const res = await api.delete(`/cities/${id}`);
  return unwrap(res);
};
