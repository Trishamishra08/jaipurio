import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchMarketplaceStores = async (params = {}) => {
  const res = await api.get('/marketplace/stores', { params });
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const fetchMarketplaceStore = async (id) => {
  const res = await api.get(`/marketplace/stores/${encodeURIComponent(id)}`);
  return unwrap(res);
};

export const createMarketplaceStore = async (payload) => {
  const res = await api.post('/marketplace/stores', payload);
  return unwrap(res);
};

export const updateMarketplaceStore = async (id, payload) => {
  const res = await api.put(`/marketplace/stores/${encodeURIComponent(id)}`, payload);
  return unwrap(res);
};

export const deleteMarketplaceStore = async (id) => {
  const res = await api.delete(`/marketplace/stores/${encodeURIComponent(id)}`);
  return unwrap(res);
};

export const fetchMarketplaceReports = async () => {
  const res = await api.get('/marketplace/reports');
  return unwrap(res);
};

export const syncMarketplaceStoresFromVendors = async () => {
  const res = await api.post('/marketplace/stores/sync-vendors');
  return unwrap(res);
};
