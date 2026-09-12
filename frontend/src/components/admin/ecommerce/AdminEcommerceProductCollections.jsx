import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

export const AdminEcommerceProductCollections = () => {
  const [collections, setCollections] = useState([
    { id: '1', name: 'Summer Earthenware Coolers', slug: 'summer-earthenware-coolers', productsCount: 16, isFeatured: 'Yes', status: 'Published', createdAt: '2026-07-20' },
    { id: '2', name: 'Royal Mandir & Temple Decor', slug: 'royal-mandir-temple-decor', productsCount: 28, isFeatured: 'Yes', status: 'Published', createdAt: '2026-08-01' },
    { id: '3', name: 'Jaipur Blue Pottery Masterpieces', slug: 'jaipur-blue-pottery-masterpieces', productsCount: 12, isFeatured: 'Yes', status: 'Published', createdAt: '2026-08-10' },
    { id: '4', name: 'Authentic Village Terracotta Cookware', slug: 'village-terracotta-cookware', productsCount: 14, isFeatured: 'No', status: 'Published', createdAt: '2026-08-12' },
  ]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    { header: 'Collection Name', accessor: 'name', cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { header: 'Slug', accessor: 'slug', cell: (row) => <span className="text-slate-400 font-mono text-[11px]">{row.slug}</span> },
    { header: 'Products Count', accessor: 'productsCount', cell: (row) => <span className="font-bold">{row.productsCount}</span> },
    { header: 'Featured', accessor: 'isFeatured', cell: (row) => <span className={row.isFeatured === 'Yes' ? 'text-blue-600 font-bold' : 'text-slate-400'}>{row.isFeatured}</span> },
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
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT COLLECTIONS']}>
      <AdminDataTable
        columns={columns}
        data={collections}
        createLabel="Create Collection"
        searchPlaceholder="Search collections..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductCollections;
