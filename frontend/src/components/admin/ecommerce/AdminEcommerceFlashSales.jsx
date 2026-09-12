import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

export const AdminEcommerceFlashSales = () => {
  const [sales, setSales] = useState([
    { id: '1', name: 'Summer Mitti Utsav 2026', productsCount: 8, discountPercent: '25% OFF', startDate: '2026-09-01', endDate: '2026-09-20', status: 'Active' },
    { id: '2', name: 'Grand Diwali Diya Fest', productsCount: 14, discountPercent: '30% OFF', startDate: '2026-10-15', endDate: '2026-11-05', status: 'Scheduled' },
  ]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    { header: 'Flash Sale Title', accessor: 'name', cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { header: 'Products Count', accessor: 'productsCount', cell: (row) => <span className="font-bold">{row.productsCount}</span> },
    { header: 'Discount', accessor: 'discountPercent', cell: (row) => <span className="text-red-600 font-bold">{row.discountPercent}</span> },
    { header: 'Start Date', accessor: 'startDate' },
    { header: 'End Date', accessor: 'endDate' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          row.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
        }`}>
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
    <EcommerceLayout breadcrumb={['FLASH SALES']}>
      <AdminDataTable
        columns={columns}
        data={sales}
        createLabel="Create Flash Sale"
        searchPlaceholder="Search flash sales..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceFlashSales;
