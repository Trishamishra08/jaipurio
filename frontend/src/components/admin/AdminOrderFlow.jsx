import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import OrderDualTrack from '../shared/OrderDualTrack';
import { fetchOrders } from '../../utils/marketplaceApi';

const AdminOrderFlow = () => {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchOrders('admin').then((rows) => setOrders(Array.isArray(rows) ? rows : []));
  }, [selected]);

  if (selected) {
    return (
      <div className="space-y-3">
        <button type="button" className="admin-btn-light" onClick={() => setSelected(null)}>Back to orders</button>
        <OrderDualTrack orderId={selected} role="admin" orders={orders} />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Orders" hideAction extra={<Link className="admin-btn-light" to="/admin/ecommerce/incomplete-orders">Incomplete Orders</Link>} />
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Order status</th>
              <th>Shipment status</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer}{order.guest ? ' (guest)' : ''}</td>
                <td><span className="admin-badge admin-badge-success">{order.paymentStatus}</span></td>
                <td>{order.orderStatus}</td>
                <td>{order.shipment?.status || 'Not created'}</td>
                <td>₹{order.total}</td>
                <td className="text-right"><button type="button" className="admin-btn-light" onClick={() => setSelected(order._id || order.id)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrderFlow;
