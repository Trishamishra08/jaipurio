import React, { useEffect, useState } from 'react';
import AdminPageHeader from './AdminPageHeader';
import { fetchPayouts, advancePayout } from '../../utils/marketplaceApi';

const AdminPayoutFlow = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchPayouts().then((rows) => setItems(Array.isArray(rows) ? rows : []));
  }, []);

  const advance = async (item) => {
    const saved = await advancePayout(item);
    setItems((prev) => prev.map((row) => ((row.id === item.id || row._id === item._id) ? { ...row, ...saved } : row)));
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
              <tr key={item.id || item._id}>
                <td>{item.id}</td>
                <td>{typeof item.vendor === 'string' ? item.vendor : item.vendor?.storeName}</td>
                <td>₹{item.amount}</td>
                <td><span className="admin-badge admin-badge-warning">{item.status}</span></td>
                <td className="text-right">
                  {item.status !== 'Settled' && item.status !== 'Rejected' && (
                    <button type="button" className="admin-btn-primary" onClick={() => advance(item)}>Approve / send</button>
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
