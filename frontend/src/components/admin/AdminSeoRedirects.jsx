import React, { useCallback, useEffect, useState } from 'react';
import AdminPageHeader from './AdminPageHeader';
import api from '../../utils/api';

const AdminSeoRedirects = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ from: '', to: '', type: '301' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/redirects');
      setItems(res.data?.data || []);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load redirects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    if (!form.from.trim() || !form.to.trim()) return;
    setError('');
    try {
      await api.post('/redirects', form);
      setForm({ from: '', to: '', type: '301' });
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to add redirect.');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this redirect?')) return;
    try {
      await api.delete(`/redirects/${id}`);
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to delete redirect.');
    }
  };

  return (
    <div>
      <AdminPageHeader title="SEO Redirect Mapping" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      <form onSubmit={add} className="admin-card p-4 mb-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input placeholder="/old-url" value={form.from} onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))} className="admin-input" />
        <input placeholder="/new-url" value={form.to} onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))} className="admin-input" />
        <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="admin-input">
          <option>301</option>
          <option>302</option>
        </select>
        <button type="submit" className="admin-btn-primary">Add redirect</button>
      </form>
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id || item._id}>
                <td>{item.from}</td>
                <td>{item.to}</td>
                <td>{item.type}</td>
                <td className="text-right">
                  <button type="button" className="admin-btn-light" onClick={() => remove(item.id || item._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-6">No redirects yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSeoRedirects;
