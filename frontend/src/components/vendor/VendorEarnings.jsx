import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VendorPage from './VendorPage';
import { fetchEarnings } from '../../utils/marketplaceApi';
import { platformStore } from '../../data/platformStore';

const VendorEarnings = () => {
  const [data, setData] = useState(null);
  const fallbackOrders = platformStore.orders();

  useEffect(() => {
    fetchEarnings().then(setData);
  }, []);

  const pending = data?.pending ?? fallbackOrders.filter((o) => o.orderStatus !== 'Completed').reduce((s, o) => s + Number(o.total || 0), 0);
  const available = data?.available ?? 0;
  const commission = data?.commission ?? 0;
  const cost = data?.cost ?? 0;
  const rows = data?.rows || fallbackOrders.map((order) => ({
    id: order.id,
    order: order.id,
    status: order.orderStatus,
    earningStatus: order.orderStatus === 'Completed' ? 'Available (after return window)' : 'Pending',
    total: order.total,
  }));

  return (
    <VendorPage
      title="Earnings"
      hint="After Completed + return window, value minus commission moves Pending → Available. Cost per item is for your margin only."
      extra={<Link to="/vendor/payouts" className="admin-btn-primary">Go to payouts</Link>}
    >
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <div className="admin-stat admin-stat-peach"><div><div className="admin-stat-value">₹{pending}</div><div className="admin-stat-label">Pending</div></div></div>
        <div className="admin-stat admin-stat-mint"><div><div className="admin-stat-value">₹{available}</div><div className="admin-stat-label">Available</div></div></div>
        <div className="admin-stat admin-stat-lilac"><div><div className="admin-stat-value">₹{commission}</div><div className="admin-stat-label">Commission</div></div></div>
        <div className="admin-stat admin-stat-sky"><div><div className="admin-stat-value">₹{cost}</div><div className="admin-stat-label">Cost (margin view)</div></div></div>
      </div>
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Total</th>
              <th>Balance bucket</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>#{row.order}</td>
                <td>{row.status || '—'}</td>
                <td>₹{row.total ?? row.net}</td>
                <td>{row.earningStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VendorPage>
  );
};

export default VendorEarnings;
