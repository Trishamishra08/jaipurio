import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchMenus = async () => {
  const res = await api.get('/menus');
  const rows = unwrap(res);
  return (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, id: r._id || r.id }));
};

export const fetchMenu = async (id) => {
  const res = await api.get(`/menus/${id}`);
  return unwrap(res);
};

export const createMenu = async (payload) => {
  const res = await api.post('/menus', payload);
  return unwrap(res);
};

export const updateMenu = async (id, payload) => {
  const res = await api.put(`/menus/${id}`, payload);
  return unwrap(res);
};

export const deleteMenu = async (id) => {
  const res = await api.delete(`/menus/${id}`);
  return unwrap(res);
};

export const fetchMenuSources = async () => {
  const res = await api.get('/menus/meta/sources');
  return unwrap(res);
};
