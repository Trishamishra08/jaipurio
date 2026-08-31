import React, { useEffect, useState } from 'react';
import { platformStore } from '../../data/platformStore';
import { acceptOrder, setOrderStatus, setShipmentStatus, completeOrder } from '../../utils/marketplaceApi';

const ORDER_STEPS = ['Order Placed', 'Payment Confirmed', 'Vendor Accepts', 'Processing', 'Completed'];
const SHIP_STEPS = ['Not created', 'Processing', 'Dispatched', 'Delivered'];

const Track = ({ title, steps, current, onChange, disabledSteps = [] }) => (
  <div className="admin-card p-4">
    <h3 className="text-sm font-semibold mb-3">{title}</h3>
    <ol className="space-y-2">
      {steps.map((step, index) => {
        const active = current === step;
        const reached = steps.indexOf(current) >= index;
        return (
          <li key={step}>
            <button
              type="button"
              disabled={disabledSteps.includes(step)}
              onClick={() => onChange(step)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${
                active ? 'bg-[#f8eee6] border-[#f0dccb] font-semibold' : reached ? 'bg-[#e8f4ee] border-[#d5eadc]' : 'bg-white border-slate-200'
              }`}
            >
              {index + 1}. {step}
            </button>
          </li>
        );
      })}
    </ol>
  </div>
);

const matchOrder = (item, orderId) =>
  item.id === orderId || item._id === orderId || item.orderNumber === orderId;

const persistLocal = (orders, current, nextOrder) => {
  const next = orders.map((item) => (matchOrder(item, current.id) || matchOrder(item, current._id) ? nextOrder : item));
  platformStore.saveOrders(next);
  return next;
};

const OrderDualTrack = ({ orderId, role = 'admin', orders: incoming }) => {
  const [orders, setOrders] = useState(incoming || platformStore.orders());
  useEffect(() => {
    if (incoming) setOrders(incoming);
  }, [incoming]);
  const order = orders.find((item) => matchOrder(item, orderId)) || orders[0];
  if (!order) return <p className="text-sm text-slate-500">No order selected.</p>;

  const apply = async (fn, fallbackPatch) => {
    const saved = await fn(order);
    const nextOrder = saved && saved.orderStatus ? saved : { ...order, ...fallbackPatch };
    setOrders((prev) => persistLocal(prev, order, nextOrder));
  };

  const accept = () => apply((o) => acceptOrder(o), {
    orderStatus: 'Processing',
    shipment: {
      ...(order.shipment || {}),
      number: order.shipment?.number || `SHP-${order.id}`,
      method: order.shipment?.method || 'Default',
      status: 'Processing',
    },
  });

  const markCompleted = () => apply((o) => completeOrder(o), { orderStatus: 'Completed' });

  return (
    <div className="space-y-3">
      <div className="admin-card p-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Order ID</p>
            <h2 className="text-lg font-semibold">#{order.id}</h2>
            <p className="text-sm text-slate-500">{order.customer} · {order.phone} · {order.town}</p>
            {order.guest && <span className="admin-badge admin-badge-warning mt-1 inline-flex">Don't have an account yet?</span>}
          </div>
          <span className={`admin-badge ${order.paymentStatus === 'Refunded' ? 'admin-badge-danger' : 'admin-badge-success'}`}>
            Payment: {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Track
          title="ORDER STATUS TRACK"
          steps={ORDER_STEPS}
          current={order.orderStatus}
          onChange={(step) => {
            if (step === 'Vendor Accepts') accept();
            else if (step === 'Completed') markCompleted();
            else apply((o) => setOrderStatus(o, step), { orderStatus: step });
          }}
        />
        <Track
          title="SHIPMENT STATUS TRACK"
          steps={SHIP_STEPS}
          current={order.shipment?.status || 'Not created'}
          disabledSteps={order.orderStatus === 'Order Placed' || order.orderStatus === 'Payment Confirmed' ? ['Processing', 'Dispatched', 'Delivered'] : []}
          onChange={(step) => {
            if (step === 'Not created') return;
            apply(
              (o) => setShipmentStatus(o, step),
              {
                shipment: {
                  number: order.shipment?.number || `SHP-${order.id}`,
                  method: step === 'Dispatched' ? 'Dispatched' : (order.shipment?.method || 'Default'),
                  status: step,
                  note: order.shipment?.note || '',
                },
              }
            );
          }}
        />
      </div>

      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Line item</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.qty}</td>
                <td>₹{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {[
          ['Sub total', order.subTotal],
          ['Discount', order.discount],
          ['Shipping fee', order.shippingFee],
          ['Tax', order.tax],
          ['Total amount', order.total],
          ['Paid amount', order.paidAmount],
        ].map(([label, value]) => (
          <div key={label} className="admin-mini-card">
            <span>{label}</span>
            <strong>₹{value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-card p-4 space-y-3">
        <label className="admin-field">
          <span>Order note</span>
          <textarea rows={2} value={order.note || ''} onChange={(e) => apply((o) => setOrderStatus(o, o.orderStatus, { note: e.target.value }), { note: e.target.value })} />
        </label>
        <label className="admin-field">
          <span>Shipment note</span>
          <textarea
            rows={2}
            value={order.shipment?.note || ''}
            onChange={(e) => apply(
              (o) => setShipmentStatus(o, o.shipment?.status || 'Processing', { note: e.target.value }),
              { shipment: { ...order.shipment, note: e.target.value } }
            )}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {role === 'vendor' && order.orderStatus === 'Payment Confirmed' && (
            <button type="button" className="admin-btn-primary" onClick={accept}>Accept & create shipment</button>
          )}
          <button type="button" className="admin-btn-light" onClick={() => apply((o) => setShipmentStatus(o, 'Dispatched', { method: 'Dispatched' }), { shipment: { ...order.shipment, status: 'Dispatched', method: 'Dispatched' } })}>Update shipping status</button>
          <button type="button" className="admin-btn-primary" onClick={markCompleted}>Mark as completed</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDualTrack;
