import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const blogsList = async (params = {}) => {
  const res = await api.get('/blogs/admin', { params });
  const data = unwrap(res);
  if (Array.isArray(data?.blogs)) return data.blogs;
  if (Array.isArray(data)) return data;
  return [];
};

export const blogsGet = async (id) => {
  const res = await api.get(`/blogs/${id}`);
  const data = unwrap(res);
  return data?.blog || data;
};

export const blogsCreate = async (payload) => {
  const res = await api.post('/blogs', payload);
  const data = unwrap(res);
  return data?.blog || data;
};

export const blogsUpdate = async (id, payload) => {
  const res = await api.put(`/blogs/${id}`, payload);
  const data = unwrap(res);
  return data?.blog || data;
};

export const blogsRemove = async (id) => {
  const res = await api.delete(`/blogs/${id}`);
  return unwrap(res);
};

export const blogCategoriesList = async () => {
  const res = await api.get('/blogs/categories');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const blogCategoriesGet = async (id) => {
  const res = await api.get(`/blogs/categories/${id}`);
  return unwrap(res);
};

export const blogCategoriesCreate = async (payload) => {
  const res = await api.post('/blogs/categories', payload);
  return unwrap(res);
};

export const blogCategoriesUpdate = async (id, payload) => {
  const res = await api.put(`/blogs/categories/${id}`, payload);
  return unwrap(res);
};

export const blogCategoriesRemove = async (id) => {
  const res = await api.delete(`/blogs/categories/${id}`);
  return unwrap(res);
};

export const blogCategoriesReorder = async (items) => {
  const res = await api.post('/blogs/categories/reorder', { items });
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const blogTagsList = async () => {
  const res = await api.get('/blogs/tags');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const blogTagsCreate = async (payload) => {
  const res = await api.post('/blogs/tags', payload);
  return unwrap(res);
};

export const uiBlocksList = async (params = {}) => {
  const res = await api.get('/blogs/ui-blocks', { params });
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const slugifyBlog = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
