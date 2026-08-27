import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import ProductEditorForm from '../shared/ProductEditorForm';
import { platformStore } from '../../data/platformStore';

const AdminProductFlow = () => {
  const [params, setParams] = useSearchParams();
  const editing = params.get('edit');
  const [items, setItems] = useState(platformStore.products());

  if (editing) {
    return (
      <div className="space-y-3">
        <button type="button" className="admin-btn-light" onClick={() => setParams({})}>Back to products</button>
        <ProductEditorForm role="admin" productId={editing} onSaved={() => setItems(platformStore.products())} />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Products" hideAction extra={<Link to="/admin/ecommerce/product-prices" className="admin-btn-light">Product Prices</Link>} />
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>SKU</th>
              <th>Store</th>
              <th>Lifecycle</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.sku}</td>
                <td>{item.store}</td>
                <td><span className="admin-badge admin-badge-info">{item.lifecycle}</span></td>
                <td>{item.stockStatus} ({item.stock})</td>
                <td className="text-right"><button type="button" className="admin-btn-light" onClick={() => setParams({ edit: item.id })}>Review</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductFlow;
