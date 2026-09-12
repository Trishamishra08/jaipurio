import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { initialProducts } from '../../../data/products';
import { FiPlus, FiEdit, FiTrash2, FiExternalLink } from 'react-icons/fi';

export const AdminEcommerceProducts = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([
    {
      id: '7878',
      name: 'White Marble Tulsi Pot 33 Inch - Buy Premium Handcrafted Sacred Kyara | Jaipurio',
      type: 'Physical',
      image: '/planter.png',
      price: '₹9,500.0',
      oldPrice: '₹14,000.0',
      stockStatus: 'In stock',
      quantity: 9,
      sku: 'JAI-HD-MTP-001',
      sortOrder: 0,
      createdAt: '2025-03-09',
      status: 'Published',
      store: '—'
    },
    {
      id: '7877',
      name: 'Marble Tulsi Pot White Inlay - Buy Premium Handcrafted Sacred Planter | Jaipurio',
      type: 'Physical',
      image: '/planter.png',
      price: '₹12,500.0',
      oldPrice: '₹19,000.0',
      stockStatus: 'In stock',
      quantity: 9,
      sku: 'JAI-HD-MTP-002',
      sortOrder: 0,
      createdAt: '2025-03-09',
      status: 'Published',
      store: '—'
    },
    ...initialProducts.map((p, idx) => ({
      id: String(7876 - idx),
      name: p.name,
      type: 'Physical',
      image: p.image || '/planter.png',
      price: `₹${p.price.toLocaleString('en-IN')}.0`,
      oldPrice: p.oldPrice ? `₹${p.oldPrice.toLocaleString('en-IN')}.0` : null,
      stockStatus: 'In stock',
      quantity: p.stock || 25,
      sku: `JAI-MIT-00${idx + 3}`,
      sortOrder: 0,
      createdAt: '2025-03-09',
      status: 'Published',
      store: '—'
    }))
  ]);

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
              setProducts(products.filter((p) => p.id !== row.id));
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
      <AdminDataTable
        columns={columns}
        data={products}
        createLabel="Create"
        onCreate={() => navigate('/admin/ecommerce/products/edit/7878')}
        onRowClick={(row) => navigate(`/admin/ecommerce/products/edit/${row.id}`)}
        searchPlaceholder="Search products..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProducts;
