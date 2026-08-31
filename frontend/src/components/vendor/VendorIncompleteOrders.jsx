import React, { useEffect, useState } from 'react';
import VendorPage from './VendorPage';
import { fetchIncompleteOrders } from '../../utils/marketplaceApi';
import { loadCollection } from '../../utils/adminAuth';
import { findModule } from '../../data/adminModules';

const VendorIncompleteOrders = () => {
  const seed = findModule('/admin/ecommerce/incomplete-orders')?.seed || [];
  const [rows, setRows] = useState(loadCollection('incomplete-orders', seed));

  useEffect(() => {
    fetchIncompleteOrders().then((data) => {
      if (Array.isArray(data) && data.length) setRows(data);
    });
  }, []);

  return (
    <VendorPage
      title="Incomplete Orders"
      hint="Abandoned checkouts on your products. These are not real orders until payment is confirmed."
    >
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || row.code}>
                <td>{row.code}</td>
                <td>{row.customer}</td>
                <td>{row.amount}</td>
                <td><span className="admin-badge admin-badge-warning">{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VendorPage>
  );
};

export default VendorIncompleteOrders;
