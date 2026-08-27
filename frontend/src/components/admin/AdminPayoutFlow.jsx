import React, { useState } from 'react';
import AdminPageHeader from './AdminPageHeader';
import { platformStore } from '../../data/platformStore';

const AdminPayoutFlow = () => {
  const [items, setItems] = useState(platformStore.payouts());

  const advance = (id) => {
    const next = items.map((item) => {
      if (item.id !== id) return item;
      if (item.status === 'Pending approval') return { ...item, status: 'Payment sent' };
      if (item.status === 'Payment sent') return { ...item, status: 'Settlement generated' };
      return item;
    });
    setItems(next);
    platformStore.savePayouts(next);
  };

  return (
    <div>
      <AdminPageHeader title="Vendor payouts" hideAction extra={<p className="text-xs text-slate-400">Completed order → return window → Available → payout</p>} />
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Payout</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.vendor}</td>
                <td>₹{item.amount}</td>
                <td><span className="admin-badge admin-badge-warning">{item.status}</span></td>
                <td className="text-right">
                  {item.status !== 'Settlement generated' && (
                    <button type="button" className="admin-btn-primary" onClick={() => advance(item.id)}>Approve / send</button>
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

export default AdminPayoutFlow;
