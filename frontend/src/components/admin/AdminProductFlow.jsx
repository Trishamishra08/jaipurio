import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import ProductEditorForm from '../shared/ProductEditorForm';
import { fetchAdminProducts } from '../../utils/marketplaceApi';
import { refreshAdminBadges } from '../../utils/adminAuth';

const AdminProductFlow = () => {
  const [params, setParams] = useSearchParams();
  const editing = params.get('edit');
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchAdminProducts();
      setItems(Array.isArray(rows) ? rows : []);
      refreshAdminBadges();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load products from server.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [editing]);

  const pendingCount = useMemo(
    () => items.filter((item) => item.lifecycle === 'Pending Approval').length,
    [items]
  );

  const visibleItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      if (a.lifecycle === 'Pending Approval' && b.lifecycle !== 'Pending Approval') return -1;
      if (b.lifecycle === 'Pending Approval' && a.lifecycle !== 'Pending Approval') return 1;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
    if (filter === 'pending') {
      return sorted.filter((item) => item.lifecycle === 'Pending Approval');
    }
    return sorted;
  }, [items, filter]);

  if (editing) {
    return (
      <div className="space-y-3">
        <button type="button" className="admin-btn-light" onClick={() => setParams({})}>Back to products</button>
        <ProductEditorForm
          role="admin"
          productId={editing}
          onSaved={() => {
            loadProducts();
            refreshAdminBadges();
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Products"
        hideAction
        extra={(
          <div className="flex flex-wrap gap-2 items-center">
            {pendingCount > 0 ? (
              <span className="admin-badge admin-badge-danger">{pendingCount} pending approval</span>
            ) : null}
            <Link to="/admin/ecommerce/product-prices" className="admin-btn-light">Product Prices</Link>
          </div>
        )}
      />

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          className={`admin-btn-light ${filter === 'all' ? 'ring-2 ring-[#6F241D]/30' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({items.length})
        </button>
        <button
          type="button"
          className={`admin-btn-light ${filter === 'pending' ? 'ring-2 ring-[#6F241D]/30' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending Approval ({pendingCount})
        </button>
      </div>

      {error ? <p className="text-sm text-amber-700 mb-3">{error}</p> : null}

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
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">Loading products…</td></tr>
            ) : visibleItems.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">No products found.</td></tr>
            ) : visibleItems.map((item) => (
              <tr key={item._id || item.id} className={item.lifecycle === 'Pending Approval' ? 'bg-amber-50/60' : ''}>
                <td>{item.title}</td>
                <td>{item.sku}</td>
                <td>{item.store}</td>
                <td>
                  <span className={`admin-badge ${item.lifecycle === 'Pending Approval' ? 'admin-badge-warning' : 'admin-badge-info'}`}>
                    {item.lifecycle}
                  </span>
                </td>
                <td>{item.stockStatus} ({item.stock})</td>
                <td className="text-right">
                  <button
                    type="button"
                    className={item.lifecycle === 'Pending Approval' ? 'admin-btn-primary' : 'admin-btn-light'}
                    onClick={() => setParams({ edit: item._id || item.id })}
                  >
                    {item.lifecycle === 'Pending Approval' ? 'Review' : 'Edit'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductFlow;
