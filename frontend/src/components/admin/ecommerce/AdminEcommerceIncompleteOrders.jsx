import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { FiEye, FiTrash2, FiExternalLink } from 'react-icons/fi';

const mockIncompleteOrders = [
  {
    id: '395',
    token: 'bc40dd9c7b6b8a014ad9ae2735b8c468',
    customer: '—',
    amount: '₹178,000.0',
    createdAt: '2026-09-12',
    store: '—'
  },
  {
    id: '394',
    token: 'bc40dd9c7b6b8a014ad9ae2735b8c468',
    customer: '—',
    amount: '₹178,000.0',
    createdAt: '2026-08-31',
    store: '—'
  },
  {
    id: '393',
    token: 'bc40dd9c7b6b8a014ad9ae2735b8c468',
    customer: 'Jitusinh Balvantsinh rajput',
    amount: '₹1,799.0',
    createdAt: '2026-08-21',
    store: '—'
  },
  {
    id: '392',
    token: 'bc40dd9c7b6b8a014ad9ae2735b8c468',
    customer: '—',
    amount: '₹1,800.0',
    createdAt: '2026-08-16',
    store: '—'
  }
];

export const AdminEcommerceIncompleteOrders = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(mockIncompleteOrders);

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      width: '60px',
      cell: (row) => (
        <Link
          to={`/checkout/${row.token || 'bc40dd9c7b6b8a014ad9ae2735b8c468'}`}
          className="font-bold text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.id}
        </Link>
      )
    },
    {
      header: 'Customer',
      accessor: 'customer',
      cell: (row) => (
        <span className={row.customer !== '—' ? 'font-medium text-slate-800' : 'text-slate-400'}>
          {row.customer}
        </span>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (row) => <span className="font-bold text-slate-800">{row.amount}</span>
    },
    { header: 'Created At', accessor: 'createdAt' },
    { header: 'Store', accessor: 'store' },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Link
            to={`/checkout/${row.token || 'bc40dd9c7b6b8a014ad9ae2735b8c468'}`}
            className="text-blue-600 hover:text-blue-800 hover:underline text-[11px] font-medium flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <FiEye size={12} />
            <span>View Detail</span>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setData(data.filter((item) => item.id !== row.id));
            }}
            className="text-red-500 hover:text-red-700 hover:underline text-[11px] font-medium flex items-center gap-1"
          >
            <FiTrash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['ORDERS', 'INCOMPLETE ORDERS']}>
      <AdminDataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search incomplete orders..."
        createLabel="Create"
        onCreate={() => navigate('/checkout/bc40dd9c7b6b8a014ad9ae2735b8c468')}
        onRowClick={(row) => navigate(`/checkout/${row.token || 'bc40dd9c7b6b8a014ad9ae2735b8c468'}`)}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceIncompleteOrders;
