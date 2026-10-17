import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, RefreshCw, Star, XCircle } from 'lucide-react';
import api from '../../utils/api';
import { useShop } from '../../context/ShopContext';
import { getCustomerToken } from '../../utils/customerAuth';

const STEPS = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const formatDate = (d) => {
  const date = d ? new Date(d) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
};

/** Where an order is in its journey, from the order, shipment and item statuses the shop and sellers update. */
const orderProgress = (order) => {
  const items = order.orderItems || [];
  if (items.length && items.every((it) => it.status === 'Cancelled')) return { cancelled: true, step: -1 };
  const ship = order.shipment?.status;
  const itemStatuses = items.map((it) => it.status);
  if (order.isDelivered || ship === 'Delivered' || order.orderStatus === 'Completed' || (itemStatuses.length && itemStatuses.every((s) => s === 'Delivered'))) {
    return { step: 4 };
  }
  if (ship === 'Dispatched' || itemStatuses.some((s) => s === 'Shipped' || s === 'Dispatched')) return { step: 3 };
  if (order.orderStatus === 'Processing' || ship === 'Processing' || itemStatuses.includes('Packed')) return { step: 2 };
  if (order.paymentStatus === 'Paid' || ['Payment Confirmed', 'Vendor Accepts'].includes(order.orderStatus)) return { step: 1 };
  return { step: 0 };
};

const ProgressBar = ({ step }) => (
  <div className="flex items-center">
    {STEPS.map((label, i) => (
      <React.Fragment key={label}>
        <div className="flex flex-col items-center shrink-0">
          <span className={`w-3 h-3 rounded-full border-2 ${i <= step ? 'bg-[#6F241D] border-[#6F241D]' : 'bg-white border-[#D9C6AE]'}`} />
          <span className={`mt-1 text-[9px] sm:text-[10px] font-semibold ${i <= step ? 'text-[#6F241D]' : 'text-[#A8977F]'}`}>{label}</span>
        </div>
        {i < STEPS.length - 1 && <span className={`flex-1 h-0.5 -mt-4 mx-0.5 ${i < step ? 'bg-[#6F241D]' : 'bg-[#E8D9C4]'}`} />}
      </React.Fragment>
    ))}
  </div>
);

const OrderCard = ({ order }) => {
  const { cancelled, step } = orderProgress(order);
  const addr = order.shippingAddress || {};
  const address = [addr.address, addr.town, addr.city, addr.postalCode].filter(Boolean).join(', ');
  const paid = order.paymentStatus === 'Paid' || order.isPaid;

  return (
    <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[#E8D4B5]">
        <div className="min-w-0">
          <span className="text-xs font-extrabold text-[#6F241D] block truncate">Order #{order.orderNumber || String(order._id).slice(-8).toUpperCase()}</span>
          <span className="text-[11px] text-gray-500">Placed on {formatDate(order.createdAt)}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-[#6F241D] block">{inr(order.totalPrice)}</span>
          <span className={`text-[10px] font-bold ${paid ? 'text-[#2E7D32]' : 'text-[#A94E2C]'}`}>
            {order.paymentMethod === 'COD' && !paid ? 'Cash on delivery' : paid ? 'Paid' : order.paymentStatus || 'Unpaid'}
          </span>
        </div>
      </div>

      {cancelled ? (
        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
          <XCircle size={14} /> Cancelled
        </p>
      ) : (
        <ProgressBar step={step} />
      )}

      <div className="space-y-2.5">
        {(order.orderItems || []).map((item, idx) => (
          <div key={item._id || idx} className="flex items-center gap-3 bg-white p-2.5 sm:p-3 rounded-xl border border-[#E8D4B5]/70">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#EFE6D8]" />
            ) : (
              <span className="w-12 h-12 rounded-lg bg-[#F3E9DA] flex items-center justify-center shrink-0">
                <Package size={18} className="text-[#A94E2C]" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#2B1E1A] line-clamp-2 leading-snug">{item.name}</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Qty {item.qty} · {inr(item.price)}
                {item.status && item.status !== 'Processing' ? ` · ${item.status}` : ''}
              </p>
            </div>
            <span className="text-xs font-bold text-[#6F241D] shrink-0">{inr(item.lineTotal ?? item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
        <div className="text-[11px] text-[#70452F] min-w-0 flex-1">
          {address && (
            <>
              <span className="font-semibold text-gray-500 block text-[10px] uppercase">Delivering to</span>
              <p className="mt-0.5 break-words">
                {order.customerName ? `${order.customerName}, ` : ''}
                {address}
              </p>
            </>
          )}
          {order.shipment?.number && <p className="mt-1 text-[10px] text-gray-500">Tracking no. {order.shipment.number}</p>}
        </div>
        {step === 4 && (
          <Link to="/reviews" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6F241D] border border-[#6F241D]/30 rounded-full px-3 py-1.5 hover:bg-white">
            <Star size={12} /> Rate & review
          </Link>
        )}
      </div>
    </div>
  );
};

/** My Orders: the signed-in customer's real orders from the server. */
const UserOrders = () => {
  const { isAuthenticated } = useShop();
  const [orders, setOrders] = useState([]);
  const [state, setState] = useState('loading');
  const signedIn = isAuthenticated && !!getCustomerToken();

  const load = useCallback(() => {
    if (!signedIn) return;
    setState('loading');
    api
      .get('/orders/my-orders')
      .then((res) => {
        setOrders(res.data?.data?.orders || []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [signedIn]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-white py-5 sm:py-6 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-[#E8D4B5] pb-4 mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#6F241D]">
              My Orders{signedIn && state === 'ready' ? ` (${orders.length})` : ''}
            </h1>
            <p className="text-xs text-[#70452F] mt-1">Track your handcrafted orders from Jaipur workshops.</p>
          </div>
          {signedIn && (
            <button type="button" onClick={load} className="p-2 text-[#6F241D] hover:bg-[#FCF8F2] rounded-full" aria-label="Refresh orders">
              <RefreshCw size={16} className={state === 'loading' ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {!signedIn ? (
          <div className="text-center py-14 bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl px-6">
            <Package size={36} className="mx-auto text-[#A94E2C]/50" />
            <h2 className="font-bold text-[#6F241D] mt-3">Log in to see your orders</h2>
            <p className="text-xs text-[#70452F] mt-1 mb-5">Your orders are saved to your account.</p>
            <Link to="/login" state={{ from: '/orders' }} className="bg-[#6F241D] text-white px-6 py-2.5 rounded-full text-xs font-bold">
              Log in
            </Link>
          </div>
        ) : state === 'loading' && orders.length === 0 ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-48 rounded-3xl bg-[#FCF8F2] border border-[#E8D4B5] animate-pulse" />
            ))}
          </div>
        ) : state === 'error' ? (
          <div className="text-center py-12 text-sm text-[#70452F]">
            Could not load your orders.{' '}
            <button type="button" onClick={load} className="font-bold text-[#6F241D] underline">
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-14 bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl px-6">
            <Package size={36} className="mx-auto text-[#A94E2C]/50" />
            <h2 className="font-bold text-[#6F241D] mt-3">No orders yet</h2>
            <p className="text-xs text-[#70452F] mt-1 mb-5">When you place an order it will show up here.</p>
            <Link to="/shop" className="bg-[#6F241D] text-white px-6 py-2.5 rounded-full text-xs font-bold">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrders;
