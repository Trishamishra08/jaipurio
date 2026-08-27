import React from 'react';
import { loadCollection } from '../../utils/adminAuth';
import { findModule } from '../../data/adminModules';

const VendorIncompleteOrders = () => {
  const rows = loadCollection('incomplete-orders', findModule('/admin/ecommerce/incomplete-orders')?.seed || []);
  return (
    <div className="admin-app p-4 md:p-6">
      <h1 className="admin-page-title mb-4">Incomplete Orders</h1>
      <p className="text-xs text-slate-500 mb-3">Abandoned / incomplete checkouts tied to your products.</p>
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
              <tr key={row.id}>
                <td>{row.code}</td>
                <td>{row.customer}</td>
                <td>{row.amount}</td>
                <td><span className="admin-badge admin-badge-warning">{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorIncompleteOrders;
