import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

export const AdminEcommerceDiscounts = () => {
  const [coupons, setCoupons] = useState([
    { id: '1', code: 'JAIPURIO10', title: '10% Off on First Mitti Order', type: 'Percentage', value: '10%', usedCount: 142, minOrder: '₹499.0', status: 'Active', expiresAt: '2026-12-31' },
    { id: '2', code: 'FESTIVE50', title: 'Flat ₹50 Off on Festive Diyas', type: 'Fixed Amount', value: '₹50.0', usedCount: 88, minOrder: '₹399.0', status: 'Active', expiresAt: '2026-11-15' },
    { id: '3', code: 'FREESHIP', title: 'Free Express Fragile Shipping', type: 'Free Shipping', value: '100% Off Shipping', usedCount: 310, minOrder: '₹999.0', status: 'Active', expiresAt: '2026-12-31' },
  ]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Coupon Code',
      accessor: 'code',
      cell: (row) => <span className="font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-sm border border-blue-200">{row.code}</span>
    },
    { header: 'Discount Title', accessor: 'title', cell: (row) => <span className="font-medium text-slate-800">{row.title}</span> },
    { header: 'Type', accessor: 'type' },
    { header: 'Value', accessor: 'value', cell: (row) => <span className="font-bold text-slate-800">{row.value}</span> },
    { header: 'Min Order', accessor: 'minOrder' },
    { header: 'Used Times', accessor: 'usedCount', cell: (row) => <span className="font-semibold">{row.usedCount}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
          {row.status}
        </span>
      )
    },
    { header: 'Expires At', accessor: 'expiresAt' },
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
    <EcommerceLayout breadcrumb={['DISCOUNTS']}>
      <AdminDataTable
        columns={columns}
        data={coupons}
        createLabel="Create Coupon"
        searchPlaceholder="Search discount codes or promotions..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceDiscounts;
