import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VendorPage from './VendorPage';
import { fetchVendorProducts, fetchOrders, fetchReturns, fetchPayouts } from '../../utils/marketplaceApi';

const VendorHome = () => {
  const [stats, setStats] = useState({
    pendingProducts: 0,
    waitingAccept: 0,
    openReturns: 0,
    pendingPayout: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchVendorProducts().catch(() => []),
      fetchOrders('vendor').catch(() => []),
      fetchReturns().catch(() => []),
      fetchPayouts().catch(() => []),
    ]).then(([products, orders, returns, payouts]) => {
      if (cancelled) return;
      const productList = Array.isArray(products) ? products : [];
      const orderList = Array.isArray(orders) ? orders : [];
      const returnList = Array.isArray(returns) ? returns : [];
      const payoutList = Array.isArray(payouts) ? payouts : [];
      setStats({
        pendingProducts: productList.filter((p) => p.lifecycle === 'Pending Approval' || p.lifecycle === 'Draft').length,
        waitingAccept: orderList.filter((o) => o.orderStatus === 'Payment Confirmed').length,
        openReturns: returnList.filter((r) => r.status === 'Vendor Review').length,
        pendingPayout: payoutList.filter((p) => p.status === 'Pending approval' || p.status === 'Pending').length,
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const steps = [
    { n: 1, title: 'Add / submit a product', to: '/vendor/products', note: 'Draft → Submit for review (C.1)' },
    { n: 2, title: 'See product lifecycle', to: '/vendor/products', note: 'Draft, Pending Approval, Published' },
    { n: 3, title: 'Restock warehouse inventory', to: '/vendor/inventory', note: 'Fix any Out of Stock items' },
    { n: 4, title: 'Accept a paid order', to: '/vendor/orders', note: 'Accept & create shipment (C.2)' },
    { n: 5, title: 'Update shipment status', to: '/vendor/shipments', note: 'Processing → Dispatched → Delivered' },
    { n: 6, title: 'Review a return', to: '/vendor/returns', note: 'Accept or reject (C.3)' },
    { n: 7, title: 'Check pending vs available', to: '/vendor/earnings', note: 'Commission + margin (C.4)' },
    { n: 8, title: 'Request a payout', to: '/vendor/payouts', note: 'Goes to admin for approval, then bank settlement' },
  ];

  return (
    <VendorPage
      title="Vendor dashboard"
      hint={loading ? 'Loading your live numbers…' : 'Live counts from your store. Walk the flow below in order.'}
    >
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {[
          ['Needs product action', stats.pendingProducts, 'mint'],
          ['Orders waiting accept', stats.waitingAccept, 'peach'],
          ['Returns to review', stats.openReturns, 'lilac'],
          ['Payouts pending', stats.pendingPayout, 'sky'],
        ].map(([label, value, tone]) => (
          <div key={label} className={`admin-stat admin-stat-${tone}`}>
            <div>
              <div className="admin-stat-value">{loading ? '—' : value}</div>
              <div className="admin-stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="admin-card-head"><h2>Walk this flow</h2></div>
        <ol>
          {steps.map((step) => (
            <li key={step.n} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-semibold">{step.n}. {step.title}</p>
                <p className="text-xs text-slate-400">{step.note}</p>
              </div>
              <Link to={step.to} className="admin-btn-light shrink-0">Open</Link>
            </li>
          ))}
        </ol>
      </div>
    </VendorPage>
  );
};

export default VendorHome;
