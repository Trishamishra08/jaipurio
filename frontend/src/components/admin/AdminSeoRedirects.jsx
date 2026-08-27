import React, { useState } from 'react';
import AdminPageHeader from './AdminPageHeader';
import { platformStore } from '../../data/platformStore';

const AdminSeoRedirects = () => {
  const [items, setItems] = useState(platformStore.redirects());
  const [form, setForm] = useState({ from: '', to: '', type: '301' });

  const add = (e) => {
    e.preventDefault();
    const next = [{ id: Date.now(), ...form }, ...items];
    setItems(next);
    platformStore.saveRedirects(next);
    setForm({ from: '', to: '', type: '301' });
  };

  return (
    <div>
      <AdminPageHeader title="SEO Redirect Mapping" hideAction />
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
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.from}</td>
                <td>{item.to}</td>
                <td>{item.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSeoRedirects;
