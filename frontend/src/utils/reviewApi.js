import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;

const serializeReview = (r) => ({
  ...r,
  id: String(r._id || r.id),
  product: r.product?.name || r.product?.title || '—',
  customer: r.user?.name || r.guestName || 'Guest',
  status: r.isApproved ? 'Approved' : 'Pending',
  createdAt: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
});

export const fetchAdminReviews = async () => {
  const res = await api.get('/admins/reviews');
  const data = unwrap(res);
  const rows = Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : [];
  return rows.map(serializeReview);
};

export const createAdminReview = async (payload) => {
  const res = await api.post('/admins/reviews', payload);
  return unwrap(res);
};

export const approveReview = async (id) => {
  const res = await api.patch(`/admins/reviews/${id}/toggle-approval`);
  return unwrap(res);
};

export const deleteReview = async (id) => {
  const res = await api.delete(`/admins/reviews/${id}`);
  return unwrap(res);
};
