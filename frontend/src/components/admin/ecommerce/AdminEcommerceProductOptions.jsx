import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { PRODUCT_OPTIONS, optionTypeLabel } from '../../../data/productOptions';
import { liveEcommerceList } from '../../../utils/ecommerceApi';

const mapOption = (row) => ({
  id: String(row._id || row.id || row.legacyId),
  name: row.name,
  optionType: optionTypeLabel(row.optionType) || row.optionType,
  values: Array.isArray(row.values)
    ? row.values.map((v) => (typeof v === 'string' ? v : v.label)).filter(Boolean).join(', ')
    : '',
  required: row.required ? 'Yes' : 'No',
});

export const AdminEcommerceProductOptions = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState(PRODUCT_OPTIONS.map(mapOption));

  useEffect(() => {
    liveEcommerceList('product-options', PRODUCT_OPTIONS).then((rows) => {
      setOptions(rows.map(mapOption));
    });
  }, []);

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
