import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchContacts = async (params = {}) => {
  const res = await api.get('/contacts', { params });
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const fetchContact = async (id) => {
  const res = await api.get(`/contacts/${id}`);
  return unwrap(res);
};

export const updateContact = async (id, payload) => {
  const res = await api.put(`/contacts/${id}`, payload);
  return unwrap(res);
};

export const replyToContact = async (id, message) => {
  const res = await api.post(`/contacts/${id}/reply`, { message });
  return unwrap(res);
};

export const deleteContact = async (id) => {
  const res = await api.delete(`/contacts/${id}`);
  return unwrap(res);
};

export const fetchCustomFields = async () => {
  const res = await api.get('/contacts/custom-fields');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const fetchCustomField = async (id) => {
  const res = await api.get(`/contacts/custom-fields/${id}`);
  return unwrap(res);
};

export const saveCustomField = async (id, payload) => {
  const res = id
    ? await api.put(`/contacts/custom-fields/${id}`, payload)
    : await api.post('/contacts/custom-fields', payload);
  return unwrap(res);
};

export const deleteCustomField = async (id) => {
  const res = await api.delete(`/contacts/custom-fields/${id}`);
  return unwrap(res);
};
