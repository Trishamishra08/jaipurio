import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

export const AdminEcommerceProductTags = () => {
  const [tags, setTags] = useState([
    { id: '1', name: 'Terracotta', slug: 'terracotta', productsCount: 24, status: 'Published', createdAt: '2026-08-01' },
    { id: '2', name: 'Handmade Clay', slug: 'handmade-clay', productsCount: 31, status: 'Published', createdAt: '2026-08-01' },
    { id: '3', name: 'Cooling Pot', slug: 'cooling-pot', productsCount: 9, status: 'Published', createdAt: '2026-08-05' },
    { id: '4', name: 'Diwali Festive', slug: 'diwali-festive', productsCount: 18, status: 'Published', createdAt: '2026-08-10' },
    { id: '5', name: 'Jaipur Blue Pottery', slug: 'jaipur-blue-pottery', productsCount: 15, status: 'Published', createdAt: '2026-08-12' },
  ]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    { header: 'Tag Name', accessor: 'name', cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { header: 'Slug', accessor: 'slug', cell: (row) => <span className="text-slate-400 font-mono text-[11px]">{row.slug}</span> },
    { header: 'Products Count', accessor: 'productsCount', cell: (row) => <span className="font-bold">{row.productsCount}</span> },
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
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT TAGS']}>
      <AdminDataTable
        columns={columns}
        data={tags}
        createLabel="Create Tag"
        searchPlaceholder="Search tags..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductTags;
