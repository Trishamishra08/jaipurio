import React, { useCallback, useEffect, useState } from 'react';
import AdminPageHeader from './AdminPageHeader';
import api from '../../utils/api';

const AdminAffiliate = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/affiliates');
      setItems(res.data?.data || []);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load affiliates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    try {
      await api.put(`/affiliates/${id}`, { status });
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to update status.');
    }
  };

  return (
    <div>
      <AdminPageHeader title="Affiliate Program" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Email</th>
              <th>Status</th>
              <th>Pending</th>
              <th>Available</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id || item._id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td><span className="admin-badge admin-badge-info">{item.status}</span></td>
                <td>₹{item.pending || 0}</td>
                <td>₹{item.available || 0}</td>
                <td className="text-right">
                  {item.status === 'Pending' && (
                    <>
                      <button type="button" className="admin-btn-light" onClick={() => setStatus(item.id || item._id, 'Rejected')}>Reject</button>
                      <button type="button" className="admin-btn-primary ml-2" onClick={() => setStatus(item.id || item._id, 'Approved')}>Approve</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-6">No affiliate applications yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAffiliate;
