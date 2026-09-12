import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

export const AdminEcommerceCustomers = () => {
  const [customers, setCustomers] = useState([
    { id: '1', name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', phone: '9829012345', ordersCount: 3, totalSpent: '₹4,940.0', status: 'Active', joinedDate: '2026-08-01' },
    { id: '2', name: 'Singh', email: 'vaibhavsingh8032@gmail.com', phone: '8839665405', ordersCount: 1, totalSpent: '₹1,700.0', status: 'Active', joinedDate: '2026-08-14' },
    { id: '3', name: 'Pooja Verma', email: 'pooja.verma@yahoo.com', phone: '9414055678', ordersCount: 2, totalSpent: '₹2,380.0', status: 'Active', joinedDate: '2026-08-19' },
    { id: '4', name: 'Sunita Meena', email: 'sunita.meena@gmail.com', phone: '9928123456', ordersCount: 4, totalSpent: '₹6,150.0', status: 'Active', joinedDate: '2026-08-25' },
    { id: '5', name: 'Jitusinh Rajput', email: 'jitu.rajput@rediffmail.com', phone: '9782012987', ordersCount: 1, totalSpent: '₹1,799.0', status: 'Active', joinedDate: '2026-08-31' },
    { id: '6', name: 'Rahul Agarwal', email: 'rahul.agarwal@outlook.com', phone: '9829988776', ordersCount: 2, totalSpent: '₹3,200.0', status: 'Active', joinedDate: '2026-09-02' },
    { id: '7', name: 'Kavita Singh', email: 'kavita.singh@gmail.com', phone: '9414123490', ordersCount: 1, totalSpent: '₹890.0', status: 'Active', joinedDate: '2026-09-06' }
  ]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    {
      header: 'Customer',
      accessor: 'name',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.name}</div>
          <div className="text-[11px] text-blue-600 hover:underline">{row.email}</div>
        </div>
      )
    },
    { header: 'Phone Number', accessor: 'phone', cell: (row) => <span className="text-slate-600">{row.phone}</span> },
    { header: 'Orders Placed', accessor: 'ordersCount', cell: (row) => <span className="font-bold">{row.ordersCount}</span> },
    { header: 'Total Spent', accessor: 'totalSpent', cell: (row) => <span className="font-bold text-slate-800">{row.totalSpent}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
          {row.status}
        </span>
      )
    },
    { header: 'Joined At', accessor: 'joinedDate' },
    {
      header: 'Operations',
      sortable: false,
      cell: () => (
        <div className="flex items-center gap-2">
          <button className="text-blue-600 hover:underline text-[11px] font-medium">View</button>
          <button className="text-red-500 hover:underline text-[11px] font-medium">Delete</button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['CUSTOMERS']}>
      <AdminDataTable
        columns={columns}
        data={customers}
        createLabel="Add Customer"
        searchPlaceholder="Search customers by name, phone or email..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceCustomers;
