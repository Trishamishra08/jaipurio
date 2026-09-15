import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { PRODUCT_LABELS } from '../../../data/productLabels';

export const AdminEcommerceProductLabels = () => {
  const navigate = useNavigate();
  const [labels, setLabels] = useState(PRODUCT_LABELS);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <Link
          to={`/admin/ecommerce/product-labels/edit/${row.id}`}
          className="inline-flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className="px-2.5 py-1 rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: row.color }}
          >
            {row.name}
          </span>
        </Link>
      ),
    },
    {
      header: 'Color',
      accessor: 'color',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded-sm border border-slate-200"
            style={{ backgroundColor: row.color }}
          />
          <span className="font-mono text-xs text-slate-600">{row.color}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {row.status}
        </span>
      ),
    },
    { header: 'Created At', accessor: 'createdAt' },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/ecommerce/product-labels/edit/${row.id}`}
            className="text-blue-600 hover:underline text-[11px] font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLabels((prev) => prev.filter((item) => item.id !== row.id));
            }}
            className="text-red-500 hover:underline text-[11px] font-medium"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT LABELS']}>
      <AdminDataTable
        columns={columns}
        data={labels}
        createLabel="Create"
        onCreate={() => navigate('/admin/ecommerce/product-labels/create')}
        onRowClick={(row) => navigate(`/admin/ecommerce/product-labels/edit/${row.id}`)}
        searchPlaceholder="Search product labels..."
        showExport={false}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductLabels;
