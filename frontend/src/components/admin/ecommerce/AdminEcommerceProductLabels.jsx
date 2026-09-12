import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

export const AdminEcommerceProductLabels = () => {
  const [labels, setLabels] = useState([
    { id: '1', name: 'Bestseller', color: '#c2410c', backgroundColor: '#ffedd5', status: 'Published', createdAt: '2026-08-01' },
    { id: '2', name: 'Heritage Craft', color: '#047857', backgroundColor: '#d1fae5', status: 'Published', createdAt: '2026-08-01' },
    { id: '3', name: '100% Pure Mitti', color: '#854d0e', backgroundColor: '#fef9c3', status: 'Published', createdAt: '2026-08-05' },
    { id: '4', name: 'Hot Deal', color: '#b91c1c', backgroundColor: '#fee2e2', status: 'Published', createdAt: '2026-08-10' },
  ]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Label Preview',
      accessor: 'name',
      cell: (row) => (
        <span
          className="px-2.5 py-1 rounded-md text-xs font-bold"
          style={{ color: row.color, backgroundColor: row.backgroundColor }}
        >
          {row.name}
        </span>
      )
    },
    { header: 'Text Color', accessor: 'color', cell: (row) => <span className="font-mono text-xs">{row.color}</span> },
    { header: 'Background Color', accessor: 'backgroundColor', cell: (row) => <span className="font-mono text-xs">{row.backgroundColor}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
          {row.status}
        </span>
      )
    },
    { header: 'Created At', accessor: 'createdAt' },
    {
      header: 'Operations',
      sortable: false,
      cell: () => (
        <div className="flex items-center gap-2">
          <button className="text-blue-600 hover:underline text-[11px] font-medium">Edit</button>
          <button className="text-red-500 hover:underline text-[11px] font-medium">Delete</button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT LABELS']}>
      <AdminDataTable
        columns={columns}
        data={labels}
        createLabel="Create Label"
        searchPlaceholder="Search product labels..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductLabels;
