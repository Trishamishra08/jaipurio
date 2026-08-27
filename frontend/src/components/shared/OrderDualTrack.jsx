import React, { useState } from 'react';
import { platformStore } from '../../data/platformStore';

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

const OrderDualTrack = ({ orderId, role = 'admin' }) => {
  const [orders, setOrders] = useState(platformStore.orders());
  const order = orders.find((item) => item.id === orderId) || orders[0];
  if (!order) return <p className="text-sm text-slate-500">No order selected.</p>;

  const update = (patch) => {
    const next = orders.map((item) => (item.id === order.id ? { ...item, ...patch } : item));
    setOrders(next);
    platformStore.saveOrders(next);
  };

  const acceptOrder = () => {
    update({
      orderStatus: 'Processing',
      shipment: {
        ...(order.shipment || {}),
        number: order.shipment?.number || `SHP-${order.id}`,
        method: order.shipment?.method || 'Default',
        status: 'Processing',
        note: order.shipment?.note || '',
      },
    });
  };

  const markCompleted = () => update({ orderStatus: 'Completed' });

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
            if (step === 'Vendor Accepts') acceptOrder();
            else if (step === 'Completed') markCompleted();
            else update({ orderStatus: step });
          }}
        />
        <Track
          title="SHIPMENT STATUS TRACK"
          steps={SHIP_STEPS}
          current={order.shipment?.status || 'Not created'}
          disabledSteps={order.orderStatus === 'Order Placed' || order.orderStatus === 'Payment Confirmed' ? ['Processing', 'Dispatched', 'Delivered'] : []}
          onChange={(step) => {
            if (step === 'Not created') return;
            update({
              shipment: {
                number: order.shipment?.number || `SHP-${order.id}`,
                method: step === 'Dispatched' ? 'Dispatched' : (order.shipment?.method || 'Default'),
                status: step,
                note: order.shipment?.note || '',
              },
            });
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
          <textarea rows={2} value={order.note} onChange={(e) => update({ note: e.target.value })} />
        </label>
        <label className="admin-field">
          <span>Shipment note</span>
          <textarea rows={2} value={order.shipment?.note || ''} onChange={(e) => update({ shipment: { ...order.shipment, note: e.target.value } })} />
        </label>
        <div className="flex flex-wrap gap-2">
          {role === 'vendor' && order.orderStatus === 'Payment Confirmed' && (
            <button type="button" className="admin-btn-primary" onClick={acceptOrder}>Accept & create shipment</button>
          )}
          <button type="button" className="admin-btn-light" onClick={() => update({ shipment: { ...order.shipment, status: 'Dispatched', method: 'Dispatched' } })}>Update shipping status</button>
          <button type="button" className="admin-btn-primary" onClick={markCompleted}>Mark as completed</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDualTrack;
