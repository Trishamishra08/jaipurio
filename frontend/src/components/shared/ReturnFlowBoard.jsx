import React, { useState } from 'react';
import { platformStore } from '../../data/platformStore';

const STEPS = [
  'Return Request created',
  'Vendor Review',
  'Vendor accepts',
  'Customer ships item back',
  'Vendor inspects',
  'Vendor initiates refund',
  'Payment status: Refunded',
  'Commission reversed',
];

const ReturnFlowBoard = ({ role = 'admin' }) => {
  const [items, setItems] = useState(platformStore.returns());
  const [selected, setSelected] = useState(items[0] || null);

  const save = (nextItems, nextSelected) => {
    setItems(nextItems);
    platformStore.saveReturns(nextItems);
    if (nextSelected) setSelected(nextSelected);
  };

  const advance = () => {
    if (!selected) return;
    const index = STEPS.indexOf(selected.status);
    const nextStatus = STEPS[Math.min(index + 1, STEPS.length - 1)];
    const updated = { ...selected, status: nextStatus };
    const nextItems = items.map((item) => (item.id === selected.id ? updated : item));
    save(nextItems, updated);
    if (nextStatus === 'Payment status: Refunded') {
      const orders = platformStore.orders().map((order) =>
        order.id === selected.orderId ? { ...order, paymentStatus: 'Refunded' } : order
      );
      platformStore.saveOrders(orders);
    }
  };

  const reject = () => {
    if (!selected) return;
    const updated = { ...selected, status: 'Rejected — admin dispute available' };
    save(items.map((item) => (item.id === selected.id ? updated : item)), updated);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
      <div className="admin-card xl:col-span-5 overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Return</th>
              <th>Order</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={selected?.id === item.id ? 'bg-[#f8eee6]' : ''} onClick={() => setSelected(item)}>
                <td>{item.id}</td>
                <td>#{item.orderId}</td>
                <td><span className="admin-badge admin-badge-warning">{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="admin-card xl:col-span-7 p-4 space-y-3">
          <h2 className="text-sm font-semibold">#{selected.id} · {selected.customer}</h2>
          <p className="text-sm text-slate-600">{selected.reason}</p>
          <p className="text-xs text-slate-400">{selected.photos} photo(s) submitted</p>
          <ol className="space-y-1 text-sm">
            {STEPS.map((step) => (
              <li key={step} className={selected.status === step ? 'font-semibold text-[#9a6540]' : 'text-slate-500'}>
                {STEPS.indexOf(selected.status) >= STEPS.indexOf(step) ? '●' : '○'} {step}
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            {role === 'vendor' && selected.status === 'Vendor Review' && (
              <>
                <button type="button" className="admin-btn-light" onClick={reject}>Reject</button>
                <button type="button" className="admin-btn-primary" onClick={advance}>Accept return</button>
              </>
            )}
            {selected.status !== 'Commission reversed' && selected.status !== 'Rejected — admin dispute available' && (
              <button type="button" className="admin-btn-primary" onClick={advance}>Advance workflow</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnFlowBoard;
