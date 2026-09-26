import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { fetchAdminOrders } from '../../../utils/orderApi';

const formatMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;

export const AdminEcommerceOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await fetchAdminOrders();
      setOrders(rows.map((o) => ({
        id: o.id,
        _id: o._id,
        customer: o.customer,
        email: o.user?.email || o.customerEmail || '',
        phone: o.phone,
        amount: formatMoney(o.total),
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        status: o.orderStatus,
        taxAmount: formatMoney(o.tax),
        shippingAmount: formatMoney(o.shippingFee),
        createdAt: o.createdAt,
        store: o.items?.length ? '' : '—',
      })));
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
            {status}
          </span>
        );
      case 'Order Placed':
      case 'Unpaid':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
            {status}
          </span>
        );
      case 'Processing':
      case 'Payment Confirmed':
      case 'Vendor Accepts':
      case 'Paid':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
            {status}
          </span>
        );
      case 'Canceled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">
            {status}
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
          to={`/admin/ecommerce/orders/edit/${row._id}`}
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
            to={`/admin/ecommerce/orders/edit/${row._id}`}
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
            to={`/admin/ecommerce/orders/edit/${row._id}`}
            className="text-blue-600 hover:text-blue-800 hover:underline text-[11px] font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            View / Edit
          </Link>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['ORDERS']}>
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      )}
      <AdminDataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Search orders..."
        showCreate={false}
        showReload
        onReload={loadOrders}
        onRowClick={(row) => navigate(`/admin/ecommerce/orders/edit/${row._id}`)}
      />
      {loading && <div className="text-center text-xs text-slate-400 py-4">Loading orders…</div>}
    </EcommerceLayout>
  );
};

export default AdminEcommerceOrders;
