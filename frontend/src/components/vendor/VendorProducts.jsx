import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { platformStore } from '../../data/platformStore';

const VendorProducts = () => {
  const [items] = useState(platformStore.products());
  return (
    <div className="admin-app p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="admin-page-title">Products</h1>
        <Link to="/vendor/add-product" className="admin-btn-primary">Add product</Link>
      </div>
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>SKU</th>
              <th>Lifecycle</th>
              <th>Stock</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.sku}</td>
                <td><span className="admin-badge admin-badge-info">{item.lifecycle}</span></td>
                <td>{item.stockStatus} · WH {item.warehouse}</td>
                <td>{item.published ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorProducts;
