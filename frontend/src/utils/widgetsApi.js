import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchWidgets = async () => {
  const res = await api.get('/widgets');
  const rows = unwrap(res);
  return (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, id: r._id || r.id }));
};

export const createWidget = async (payload) => {
  const res = await api.post('/widgets', payload);
  return unwrap(res);
};

export const updateWidget = async (id, payload) => {
  const res = await api.put(`/widgets/${id}`, payload);
  return unwrap(res);
};

export const reorderWidgets = async (updates) => {
  const res = await api.put('/widgets/reorder', { updates });
  return unwrap(res);
};

export const deleteWidget = async (id) => {
  const res = await api.delete(`/widgets/${id}`);
  return unwrap(res);
};

export const fetchWidgetSources = async () => {
  const res = await api.get('/widgets/meta/sources');
  return unwrap(res);
};
