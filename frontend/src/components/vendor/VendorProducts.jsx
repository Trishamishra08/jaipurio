import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VendorPage from './VendorPage';
import { fetchVendorProducts } from '../../utils/marketplaceApi';

const VendorProducts = () => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetchVendorProducts().then((rows) => setItems(Array.isArray(rows) ? rows : []));
  }, []);
  return (
    <VendorPage
      title="Products"
      hint="Lifecycle: Draft → Submit for review → Pending Approval → Admin publishes. Stock status is independent of Published."
      extra={<Link to="/vendor/add-product" className="admin-btn-primary">Add product</Link>}
    >
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Lifecycle</th>
              <th>Stock</th>
              <th>Published</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id || item.id}>
                <td>{item.title}</td>
                <td>{item.sku}</td>
                <td className="max-w-[220px] truncate">{item.category}</td>
                <td><span className="admin-badge admin-badge-info">{item.lifecycle}</span></td>
                <td>{item.stockStatus} ({item.stock})</td>
                <td>{item.published ? 'Yes' : 'No'}</td>
                <td className="text-right">
                  <Link to={`/vendor/add-product?id=${item._id || item.id}`} className="admin-btn-light">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VendorPage>
  );
};

export default VendorProducts;
