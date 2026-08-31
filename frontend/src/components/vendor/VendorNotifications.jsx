import React, { useState } from 'react';
import VendorPage from './VendorPage';

const SEED = [
  { id: 1, title: 'Product submitted', message: 'Silver Jhumka Earrings is waiting for admin approval.', unread: true },
  { id: 2, title: 'New paid order', message: 'Order #00000375 — Payment Confirmed. Accept to create shipment.', unread: true },
  { id: 3, title: 'Return request', message: 'RMA-1001 needs vendor review.', unread: true },
  { id: 4, title: 'Low stock', message: 'Marble Ganesh Chowki is Out of Stock.', unread: false },
];

const VendorNotifications = () => {
  const [items, setItems] = useState(SEED);
  return (
    <VendorPage
      title="Notifications"
      extra={<button type="button" className="admin-btn-light" onClick={() => setItems((prev) => prev.map((n) => ({ ...n, unread: false })))}>Mark all read</button>}
    >
      <div className="admin-card divide-y">
        {items.map((item) => (
          <article key={item.id} className={`px-4 py-3 ${item.unread ? 'bg-[#f8eee6]' : ''}`}>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="text-xs text-slate-500">{item.message}</p>
          </article>
        ))}
      </div>
    </VendorPage>
  );
};

export default VendorNotifications;
