import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchAdminCountries = async () => {
  const res = await api.get('/countries');
  const rows = unwrap(res);
  return (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, id: r._id || r.id }));
};

export const fetchAdminCountry = async (id) => {
  const res = await api.get(`/countries/${id}`);
  return unwrap(res);
};

export const createAdminCountry = async (payload) => {
  const res = await api.post('/countries', payload);
  return unwrap(res);
};

export const updateAdminCountry = async (id, payload) => {
  const res = await api.put(`/countries/${id}`, payload);
  return unwrap(res);
};

export const deleteAdminCountry = async (id) => {
  const res = await api.delete(`/countries/${id}`);
  return unwrap(res);
};
