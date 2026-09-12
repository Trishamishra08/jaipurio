import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';

const mockShipments = [
  {
    id: 'SHP-891',
    orderId: '370',
    carrier: 'Delhivery Surface',
    trackingCode: 'DL-901847192',
    customer: 'Singh',
    destination: 'Jaipur, Rajasthan',
    status: 'Shipped',
    shippedAt: '2026-05-14',
    productId: '7878',
    productName: 'Comfy White Hunting Style Cotton Shirt - Premium Comfort Style | Jaipurio'
  },
  {
    id: 'SHP-890',
    orderId: '369',
    carrier: 'BlueDart Express',
    trackingCode: 'BD-881294821',
    customer: 'Aarav Sharma',
    destination: 'Udaipur, Rajasthan',
    status: 'Delivered',
    shippedAt: '2026-05-12',
    productId: '7877',
    productName: 'Handcrafted Blue Pottery Vase - Traditional Jaipur Art'
  }
];

export const AdminEcommerceShipments = () => {
  const navigate = useNavigate();
  const [shipments] = useState(mockShipments);

  const columns = [
    { header: 'Shipment ID', accessor: 'id', width: '100px' },
    {
      header: 'Order ID',
      accessor: 'orderId',
      cell: (row) => (
        <Link
          to={`/admin/ecommerce/orders/edit/${row.orderId}`}
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
        <Link
          to={`/admin/ecommerce/products/edit/${row.productId}`}
          className="text-blue-600 hover:underline text-[11px] font-medium leading-snug block max-w-xs truncate"
          onClick={(e) => e.stopPropagation()}
          title={row.productName}
        >
          {row.productName}
        </Link>
      )
    },
    { header: 'Carrier', accessor: 'carrier' },
    {
      header: 'Tracking No.',
      accessor: 'trackingCode',
      cell: (row) => <span className="font-mono text-slate-800">{row.trackingCode}</span>
    },
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
    { header: 'Shipped At', accessor: 'shippedAt' },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/ecommerce/orders/edit/${row.orderId}`}
            className="text-blue-600 hover:underline text-[11px] font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            View Order
          </Link>
          <button className="text-slate-600 hover:underline text-[11px] font-medium">
            Print Label
          </button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['SHIPMENTS']}>
      <AdminDataTable
        columns={columns}
        data={shipments}
        createLabel="New Shipment"
        searchPlaceholder="Search shipments or tracking numbers..."
        onRowClick={(row) => navigate(`/admin/ecommerce/orders/edit/${row.orderId}`)}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceShipments;
