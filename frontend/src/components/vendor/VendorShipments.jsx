import React from 'react';
import { platformStore } from '../../data/platformStore';

const VendorShipments = () => {
  const rows = platformStore.orders().filter((order) => order.shipment?.number);
  return (
    <div className="admin-app p-4 md:p-6">
      <h1 className="admin-page-title mb-4">Shipments</h1>
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Shipment number</th>
              <th>Order</th>
              <th>Method</th>
              <th>Shipping status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr key={order.id}>
                <td>{order.shipment.number}</td>
                <td>#{order.id}</td>
                <td>{order.shipment.method}</td>
                <td><span className="admin-badge admin-badge-info">{order.shipment.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorShipments;
