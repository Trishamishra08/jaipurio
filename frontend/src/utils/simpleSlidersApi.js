import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchSliders = async () => {
  const res = await api.get('/simple-sliders');
  const rows = unwrap(res);
  return (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, id: r._id || r.id }));
};

export const fetchSlider = async (id) => {
  const res = await api.get(`/simple-sliders/${id}`);
  return unwrap(res);
};

export const createSlider = async (payload) => {
  const res = await api.post('/simple-sliders', payload);
  return unwrap(res);
};

export const updateSlider = async (id, payload) => {
  const res = await api.put(`/simple-sliders/${id}`, payload);
  return unwrap(res);
};

export const deleteSlider = async (id) => {
  const res = await api.delete(`/simple-sliders/${id}`);
  return unwrap(res);
};
