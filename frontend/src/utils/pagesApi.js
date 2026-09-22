import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const pagesList = async (params = {}) => {
  const res = await api.get('/pages', { params });
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const pagesGet = async (id) => {
  const res = await api.get(`/pages/${id}`);
  return unwrap(res);
};

export const pagesCreate = async (payload) => {
  const res = await api.post('/pages', payload);
  return unwrap(res);
};

export const pagesUpdate = async (id, payload) => {
  const res = await api.put(`/pages/${id}`, payload);
  return unwrap(res);
};

export const pagesRemove = async (id) => {
  const res = await api.delete(`/pages/${id}`);
  return unwrap(res);
};

export const pagesRevisions = async (id) => {
  const res = await api.get(`/pages/${id}/revisions`);
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const pagesRestoreRevision = async (pageId, revisionId) => {
  const res = await api.post(`/pages/${pageId}/revisions/${revisionId}/restore`);
  return unwrap(res);
};

export const pagesDeleteRevision = async (pageId, revisionId) => {
  const res = await api.delete(`/pages/${pageId}/revisions/${revisionId}`);
  return unwrap(res);
};

export const slugifyPage = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
