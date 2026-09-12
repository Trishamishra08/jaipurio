import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { FiEye, FiTrash2, FiEdit2, FiCheck, FiX, FiClock } from 'react-icons/fi';

const mockOrders = [
  {
    id: '370',
    customer: 'Singh',
    email: 'vaibhavsingh8032@gmail.com',
    phone: '8839665405',
    amount: '₹1,700.0',
    paymentMethod: 'Cash on delivery (COD)',
    paymentStatus: 'Pending',
    status: 'Pending',
    taxAmount: '₹0.0',
    shippingAmount: '0.00',
    createdAt: '2026-05-13',
    store: '—'
  },
  {
    id: '369',
    customer: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    phone: '9829012345',
    amount: '₹3,450.0',
    paymentMethod: 'Razorpay (Online)',
    paymentStatus: 'Completed',
    status: 'Delivered',
    taxAmount: '₹172.5',
    shippingAmount: '0.00',
    createdAt: '2026-05-12',
    store: 'Jaipur Blue Pottery'
  },
  {
    id: '368',
    customer: 'Pooja Verma',
    email: 'pooja.verma@yahoo.com',
    phone: '9414055678',
    amount: '₹890.0',
    paymentMethod: 'Cash on delivery (COD)',
    paymentStatus: 'Pending',
    status: 'Processing',
    taxAmount: '₹44.5',
    shippingAmount: '50.00',
    createdAt: '2026-05-11',
    store: 'Marwar Mitti'
  }
];

export const AdminEcommerceOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(mockOrders);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
            Completed
          </span>
        );
      case 'Pending':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
            Pending
          </span>
        );
      case 'Processing':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
            Processing
          </span>
        );
      case 'Canceled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">
            Canceled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      width: '60px',
      cell: (row) => (
        <Link
          to={`/admin/ecommerce/orders/edit/${row.id}`}
          className="font-bold text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          #{row.id}
        </Link>
      )
    },
    {
      header: 'Customer',
      accessor: 'customer',
      cell: (row) => (
        <div>
          <Link
            to={`/admin/ecommerce/orders/edit/${row.id}`}
            className="font-semibold text-slate-800 hover:text-blue-600 hover:underline block"
            onClick={(e) => e.stopPropagation()}
          >
            {row.customer}
          </Link>
          <div className="text-[11px] text-blue-600 hover:underline">{row.email}</div>
          <div className="text-[10px] text-slate-400">{row.phone}</div>
        </div>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (row) => <span className="font-bold text-slate-800">{row.amount}</span>
    },
    { header: 'Payment method', accessor: 'paymentMethod' },
    {
      header: 'Payment status',
      accessor: 'paymentStatus',
      cell: (row) => getStatusBadge(row.paymentStatus)
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => getStatusBadge(row.status)
    },
    { header: 'Tax Amount', accessor: 'taxAmount' },
    { header: 'Shipping amount', accessor: 'shippingAmount' },
    { header: 'Created At', accessor: 'createdAt' },
    { header: 'Store', accessor: 'store' },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/ecommerce/orders/edit/${row.id}`}
            className="text-blue-600 hover:text-blue-800 hover:underline text-[11px] font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOrders(orders.filter((o) => o.id !== row.id));
            }}
            className="text-red-500 hover:text-red-700 hover:underline text-[11px] font-medium"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['ORDERS']}>
      <AdminDataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Search orders..."
        createLabel="Create"
        onCreate={() => navigate('/admin/ecommerce/orders/edit/370')}
        onRowClick={(row) => navigate(`/admin/ecommerce/orders/edit/${row.id}`)}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceOrders;
