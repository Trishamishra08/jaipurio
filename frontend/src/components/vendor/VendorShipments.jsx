import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VendorPage from './VendorPage';
import { fetchShipments } from '../../utils/marketplaceApi';

const VendorShipments = () => {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetchShipments().then((data) => setRows(Array.isArray(data) ? data : []));
  }, []);

  return (
    <VendorPage
      title="Shipments"
      hint="Shipment exists only after vendor accepts. Status: Processing → Dispatched → Delivered. Separate from order Completed."
      extra={<Link to="/vendor/orders" className="admin-btn-light">Open an order to update status</Link>}
    >
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Shipment number</th>
              <th>Method</th>
              <th>Shipping status</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr key={order.id || order._id}>
                <td>#{order.id}</td>
                <td>{order.shipment?.number || '—'}</td>
                <td>{order.shipment?.method || '—'}</td>
                <td><span className="admin-badge admin-badge-info">{order.shipment?.status || 'Not created'}</span></td>
                <td>{order.shipment?.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VendorPage>
  );
};

export default VendorShipments;
