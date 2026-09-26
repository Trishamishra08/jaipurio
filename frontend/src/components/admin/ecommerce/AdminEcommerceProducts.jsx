import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { fetchAdminProducts } from '../../../utils/marketplaceApi';
import api from '../../../utils/api';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const mapProductRow = (p, idx = 0) => ({
  id: String(p._id || p.id || idx),
  name: p.title || p.name,
  type: 'Physical',
  image: p.image || (Array.isArray(p.images) ? p.images[0] : '') || '/planter.png',
  price: `₹${Number(p.salePrice || p.price || 0).toLocaleString('en-IN')}.0`,
  oldPrice: p.salePrice && p.price && p.salePrice < p.price ? `₹${Number(p.price).toLocaleString('en-IN')}.0` : null,
  stockStatus: p.stockStatus || (Number(p.stock) > 0 ? 'In stock' : 'Out of stock'),
  quantity: p.stock ?? p.quantity ?? 0,
  sku: p.sku || '',
  sortOrder: 0,
  createdAt: p.createdAt ? String(p.createdAt).slice(0, 10) : '',
  status: p.lifecycle || (p.published ? 'Published' : 'Draft'),
  store: p.vendor?.storeName || p.vendor?.fullName || '—',
});

export const AdminEcommerceProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await fetchAdminProducts();
      setProducts(rows.map(mapProductRow));
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${row.id}`);
      await loadProducts();
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to delete product.');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', width: '65px' },
    {
      header: 'Image',
      accessor: 'image',
      width: '60px',
      sortable: false,
      cell: (row) => (
        <img
          src={row.image}
          alt={row.name}
          className="w-10 h-10 object-cover rounded-md border border-slate-200"
        />
      )
    },
    {
      header: 'Products',
      accessor: 'name',
      cell: (row) => (
        <div>
          <Link
            to={`/admin/ecommerce/products/edit/${row.id}`}
            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline line-clamp-1 block text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {row.name}
          </Link>
          <span className="text-[11px] text-slate-400"> — {row.type}</span>
        </div>
      )
    },
    {
      header: 'Price',
      accessor: 'price',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{row.price}</span>
          {row.oldPrice && (
            <span className="ml-1.5 text-slate-400 line-through text-[11px]">{row.oldPrice}</span>
          )}
        </div>
      )
    },
    {
      header: 'Stock status',
      accessor: 'stockStatus',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {row.stockStatus}
        </span>
      )
    },
    { header: 'Quantity', accessor: 'quantity', cell: (row) => <span className="font-medium">{row.quantity}</span> },
    { header: 'SKU', accessor: 'sku', cell: (row) => <span className="font-mono text-slate-600 text-[11px]">{row.sku}</span> },
    { header: 'Sort order', accessor: 'sortOrder' },
    { header: 'Created At', accessor: 'createdAt' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {row.status}
        </span>
      )
    },
    { header: 'Store', accessor: 'store' },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Link
            to={`/admin/ecommerce/products/edit/${row.id}`}
            className="text-blue-600 hover:text-blue-800 hover:underline text-[11px] font-medium flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <FiEdit size={12} />
            <span>Edit</span>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="text-red-500 hover:text-red-700 hover:underline text-[11px] font-medium flex items-center gap-0.5"
          >
            <FiTrash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['PRODUCTS']}>
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      )}
      <AdminDataTable
        columns={columns}
        data={products}
        createLabel="Create"
        onCreate={() => navigate('/admin/ecommerce/products/create')}
        onRowClick={(row) => navigate(`/admin/ecommerce/products/edit/${row.id}`)}
        searchPlaceholder="Search products..."
        showReload
        onReload={loadProducts}
      />
      {loading && <div className="text-center text-xs text-slate-400 py-4">Loading products…</div>}
    </EcommerceLayout>
  );
};

export default AdminEcommerceProducts;
