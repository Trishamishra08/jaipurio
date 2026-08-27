import React, { useState } from 'react';
import { platformStore } from '../../data/platformStore';

const VendorPayouts = () => {
  const [items, setItems] = useState(platformStore.payouts());

  const request = () => {
    const next = [{ id: `PO-${Date.now()}`, vendor: 'Shyam Pottery', amount: 2400, status: 'Pending approval', createdAt: new Date().toISOString().slice(0, 10) }, ...items];
    setItems(next);
    platformStore.savePayouts(next);
  };

  return (
    <div className="admin-app p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="admin-page-title">Payouts</h1>
        <button type="button" className="admin-btn-primary" onClick={request}>Request payout</button>
      </div>
      <p className="text-xs text-slate-500 mb-3">Available balance moves here after Completed + return window. Admin approval optional.</p>
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>₹{item.amount}</td>
                <td><span className="admin-badge admin-badge-warning">{item.status}</span></td>
                <td>{item.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorPayouts;
