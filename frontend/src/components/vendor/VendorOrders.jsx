import React, { useEffect, useState } from 'react';
import OrderDualTrack from '../shared/OrderDualTrack';
import VendorPage from './VendorPage';
import { fetchOrders } from '../../utils/marketplaceApi';

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchOrders('vendor').then((rows) => setOrders(Array.isArray(rows) ? rows : []));
  }, [selected]);

  if (selected) {
    return (
      <VendorPage title={`Order #${selected}`} extra={<button type="button" className="admin-btn-light" onClick={() => setSelected(null)}>Back to orders</button>}>
        <p className="text-xs text-slate-500 mb-3">Two tracks: order status and shipment status. Accepting a paid order creates the shipment record.</p>
        <OrderDualTrack orderId={selected} role="vendor" orders={orders} />
      </VendorPage>
    );
  }

  return (
    <VendorPage title="Orders" hint="Open #00000375 to test Vendor Accepts → shipment created. Then update shipping status and Mark as completed.">
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Guest</th>
              <th>Payment</th>
              <th>Order status</th>
              <th>Shipment</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.guest ? 'Yes' : 'No'}</td>
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
    </VendorPage>
  );
};

export default VendorOrders;
