import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchAdminPendingCounts = async () => {
  const res = await api.get('/admins/pending-counts');
  return unwrap(res);
};

export const loginAdminApi = async (email, password) => {
  const res = await api.post('/users/login', { email, password });
  if (!res.data?.success) {
    throw new Error(res.data?.message || 'Login failed');
  }
  const data = res.data.data;
  if (data.role !== 'admin') {
    throw new Error('This account is not an admin user.');
  }
  return data;
};
