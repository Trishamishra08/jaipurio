import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { fetchShipments } from '../../../utils/orderApi';

export const AdminEcommerceShipments = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const orders = await fetchShipments();
      const rows = orders
        .filter((o) => o.shipment)
        .map((o) => ({
          id: o.shipment.number,
          orderId: o.id,
          _orderMongoId: o._id,
          carrier: o.shipment.method,
          trackingCode: o.shipment.note || '—',
          customer: o.customer,
          destination: [o.shippingAddress?.town || o.shippingAddress?.city, o.shippingAddress?.country].filter(Boolean).join(', '),
          status: o.shipment.status,
          shippedAt: o.createdAt,
          productName: (o.items || []).map((i) => i.name).join(', '),
        }));
      setShipments(rows);
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load shipments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { header: 'Shipment ID', accessor: 'id', width: '100px' },
    {
      header: 'Order ID',
      accessor: 'orderId',
      cell: (row) => (
        <Link
          to={`/admin/ecommerce/orders/edit/${row._orderMongoId}`}
          className="text-blue-600 font-semibold hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          #{row.orderId}
        </Link>
      )
    },
    {
      header: 'Product',
      accessor: 'productName',
      cell: (row) => (
        <span className="text-slate-700 text-[11px] font-medium leading-snug block max-w-xs truncate" title={row.productName}>
          {row.productName}
        </span>
      )
    },
    { header: 'Carrier / Method', accessor: 'carrier' },
    { header: 'Customer', accessor: 'customer' },
    { header: 'Destination', accessor: 'destination' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            row.status === 'Delivered'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {row.status}
        </span>
      )
    },
    { header: 'Created At', accessor: 'shippedAt' },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <Link
          to={`/admin/ecommerce/orders/edit/${row._orderMongoId}`}
          className="text-blue-600 hover:underline text-[11px] font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          View Order
        </Link>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['SHIPMENTS']}>
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      )}
      <AdminDataTable
        columns={columns}
        data={shipments}
        showCreate={false}
        showReload
        onReload={load}
        searchPlaceholder="Search shipments..."
        onRowClick={(row) => navigate(`/admin/ecommerce/orders/edit/${row._orderMongoId}`)}
      />
      {loading && <div className="text-center text-xs text-slate-400 py-4">Loading…</div>}
    </EcommerceLayout>
  );
};

export default AdminEcommerceShipments;
