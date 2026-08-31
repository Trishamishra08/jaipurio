import React, { useEffect, useState } from 'react';
import VendorPage from './VendorPage';
import { fetchPayouts, requestPayout } from '../../utils/marketplaceApi';

const VendorPayouts = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchPayouts().then((rows) => setItems(Array.isArray(rows) ? rows : []));
  }, []);

  const request = async () => {
    const row = await requestPayout();
    setItems((prev) => [row, ...prev.filter((item) => (item.id || item._id) !== (row.id || row._id))]);
  };

  return (
    <VendorPage
      title="Payouts"
      hint="Request payout from Available balance. Admin may approve. Then payment sent to verified bank, then settlement statement."
      extra={<button type="button" className="admin-btn-primary" onClick={request}>Request payout</button>}
    >
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
              <tr key={item.id || item._id}>
                <td>{item.id}</td>
                <td>₹{item.amount}</td>
                <td><span className="admin-badge admin-badge-warning">{item.status}</span></td>
                <td>{item.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VendorPage>
  );
};

export default VendorPayouts;
