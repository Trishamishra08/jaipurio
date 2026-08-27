import React, { useState } from 'react';
import AdminPageHeader from './AdminPageHeader';
import { platformStore } from '../../data/platformStore';

const AdminAffiliate = () => {
  const [items, setItems] = useState(platformStore.affiliates());

  const setStatus = (id, status) => {
    const next = items.map((item) => (item.id === id ? { ...item, status } : item));
    setItems(next);
    platformStore.saveAffiliates(next);
  };

  return (
    <div>
      <AdminPageHeader title="Affiliate Program" hideAction />
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
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td><span className="admin-badge admin-badge-info">{item.status}</span></td>
                <td>₹{item.pending}</td>
                <td>₹{item.available}</td>
                <td className="text-right">
                  {item.status === 'Pending' && (
                    <>
                      <button type="button" className="admin-btn-light" onClick={() => setStatus(item.id, 'Rejected')}>Reject</button>
                      <button type="button" className="admin-btn-primary ml-2" onClick={() => setStatus(item.id, 'Approved')}>Approve</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAffiliate;
