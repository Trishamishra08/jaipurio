import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

export const AdminEcommerceOrderReturns = () => {
  const [returns, setReturns] = useState([
    {
      id: 'RET-104',
      orderId: 'ORD-340',
      customer: 'Priya Rathore',
      productItems: 'Rajasthani Design Matka (5L)',
      reason: 'Damaged in transit',
      status: 'Pending Review',
      createdAt: '2026-09-02'
    },
    {
      id: 'RET-103',
      orderId: 'ORD-312',
      customer: 'Vikram Joshi',
      productItems: 'Kulhad Pack of 6',
      reason: 'Color mismatch',
      status: 'Approved',
      createdAt: '2026-08-28'
    }
  ]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '70px' },
    { header: 'Order ID', accessor: 'orderId', cell: (row) => <span className="text-blue-600 font-semibold">{row.orderId}</span> },
    { header: 'Customer', accessor: 'customer', cell: (row) => <span className="font-medium text-slate-800">{row.customer}</span> },
    { header: 'Product item(s)', accessor: 'productItems' },
    { header: 'Return reason', accessor: 'reason' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          row.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
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
          <button className="text-blue-600 hover:underline text-[11px] font-medium">Process</button>
          <button className="text-red-500 hover:underline text-[11px] font-medium">Reject</button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['ORDER RETURNS']}>
      <AdminDataTable
        columns={columns}
        data={returns}
        showCreate={false}
        searchPlaceholder="Search returns..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceOrderReturns;
