import React, { useState } from 'react';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

export const AdminEcommerceInvoices = () => {
  const [invoices, setInvoices] = useState([
    {
      id: 'INV-2026-001',
      orderId: 'ORD-369',
      customer: 'Aarav Sharma',
      amount: '₹3,450.0',
      tax: '₹172.5',
      status: 'Paid',
      issueDate: '2026-05-12'
    },
    {
      id: 'INV-2026-002',
      orderId: 'ORD-370',
      customer: 'Singh',
      amount: '₹1,700.0',
      tax: '₹0.0',
      status: 'Unpaid',
      issueDate: '2026-05-13'
    }
  ]);

  const columns = [
    { header: 'Invoice #', accessor: 'id', width: '110px', cell: (row) => <span className="font-semibold text-slate-800">{row.id}</span> },
    { header: 'Order ID', accessor: 'orderId', cell: (row) => <span className="text-blue-600">{row.orderId}</span> },
    { header: 'Customer', accessor: 'customer' },
    { header: 'Amount', accessor: 'amount', cell: (row) => <span className="font-bold text-slate-800">{row.amount}</span> },
    { header: 'Tax', accessor: 'tax' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Issue Date', accessor: 'issueDate' },
    {
      header: 'Operations',
      sortable: false,
      cell: () => (
        <div className="flex items-center gap-2">
          <button className="text-blue-600 hover:underline text-[11px] font-medium">Download PDF</button>
          <button className="text-slate-600 hover:underline text-[11px] font-medium">Print</button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['INVOICES']}>
      <AdminDataTable
        columns={columns}
        data={invoices}
        createLabel="Generate Invoice"
        searchPlaceholder="Search invoices..."
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceInvoices;
