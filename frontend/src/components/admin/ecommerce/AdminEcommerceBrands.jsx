import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

export const AdminEcommerceBrands = () => {
  const [brands, setBrands] = useState([
    { id: '1', name: 'Shyam Terracotta Artisans', logo: '🏺', website: 'https://jaipurio.in', productsCount: 24, isFeatured: 'Yes', order: 1, status: 'Published' },
    { id: '2', name: 'Meera Mitti Works', logo: '🌿', website: 'https://jaipurio.in', productsCount: 18, isFeatured: 'Yes', order: 2, status: 'Published' },
    { id: '3', name: 'Pushkar Sacred Clay Studio', logo: '🪔', website: 'https://jaipurio.in', productsCount: 30, isFeatured: 'Yes', order: 3, status: 'Published' },
    { id: '4', name: 'Alwar Heritage Pottery Co.', logo: '🏺', website: 'https://jaipurio.in', productsCount: 12, isFeatured: 'No', order: 4, status: 'Published' },
  ]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Brand Name',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-xl">{row.logo}</span>
          <span className="font-semibold text-slate-800">{row.name}</span>
        </div>
      )
    },
    { header: 'Website', accessor: 'website', cell: (row) => <a href={row.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{row.website}</a> },
    { header: 'Products Count', accessor: 'productsCount', cell: (row) => <span className="font-bold">{row.productsCount}</span> },
    { header: 'Featured', accessor: 'isFeatured' },
    { header: 'Order', accessor: 'order' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
          {row.status}
        </span>
      )
    },
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
    <EcommerceLayout breadcrumb={['BRANDS']}>
      <AdminDataTable
        columns={columns}
        data={brands}
        createLabel="Create Brand"
        searchPlaceholder="Search brands..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceBrands;
