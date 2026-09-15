import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { PRODUCT_OPTIONS, optionTypeLabel } from '../../../data/productOptions';

export const AdminEcommerceProductOptions = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState(
    PRODUCT_OPTIONS.map((row) => ({
      id: row.id,
      name: row.name,
      optionType: optionTypeLabel(row.optionType),
      values: row.values.map((v) => v.label).join(', '),
      required: row.required ? 'Yes' : 'No',
      order: Number(row.id),
    }))
  );

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <Link
          to={`/admin/ecommerce/options/edit/${row.id}`}
          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.name}
        </Link>
      ),
    },
    { header: 'Type', accessor: 'optionType' },
    {
      header: 'Available Values',
      accessor: 'values',
      cell: (row) => <span className="text-slate-600 text-xs">{row.values}</span>,
    },
    { header: 'Required', accessor: 'required' },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/ecommerce/options/edit/${row.id}`}
            className="text-blue-600 hover:underline text-[11px] font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOptions((prev) => prev.filter((item) => item.id !== row.id));
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
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT OPTIONS']}>
      <AdminDataTable
        columns={columns}
        data={options}
        createLabel="Create"
        onCreate={() => navigate('/admin/ecommerce/options/create')}
        onRowClick={(row) => navigate(`/admin/ecommerce/options/edit/${row.id}`)}
        searchPlaceholder="Search product options..."
        showExport={false}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductOptions;
