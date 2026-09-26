import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import {
  FiCheck,
  FiTruck,
  FiDollarSign,
  FiPhone,
  FiMail,
  FiMapPin,
  FiSave,
  FiPackage,
} from 'react-icons/fi';
import {
  fetchOrder,
  acceptOrder,
  updateOrderStatus,
  updateShipment,
  adminUpdateReturn,
} from '../../../utils/orderApi';

const ORDER_STATUS = ['Order Placed', 'Payment Confirmed', 'Vendor Accepts', 'Processing', 'Completed'];
const SHIPMENT_STATUS = ['Not created', 'Processing', 'Dispatched', 'Delivered'];
const RETURN_STATUS = [
  'Not Requested',
  'Return Requested',
  'Return Approved',
  'Return Rejected',
  'Returned',
  'Replace Requested',
  'Replace Approved',
  'Replace Rejected',
  'Replaced',
];

const formatMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;

export const AdminEcommerceOrderEdit = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [shipmentDraft, setShipmentDraft] = useState({ status: 'Processing', method: 'Default', note: '' });
  const [returnDraft, setReturnDraft] = useState('Not Requested');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchOrder(id);
      setOrder(data);
      setNote(data.note || '');
      setShipmentDraft({
        status: data.shipment?.status || 'Processing',
        method: data.shipment?.method || 'Default',
        note: data.shipment?.note || '',
      });
      setReturnDraft(data.returnStatus || 'Not Requested');
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (fn) => {
    setSaving(true);
    setSaveError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setSaveError(err.parsedMessage || err.message || 'Action failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = () => runAction(async () => {
    await updateOrderStatus(id, { note });
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  });

  const handleAccept = () => runAction(() => acceptOrder(id));

  const handleOrderStatusChange = (value) => runAction(() => updateOrderStatus(id, { orderStatus: value }));

  const handleShipmentUpdate = () => runAction(() => updateShipment(id, shipmentDraft));

  const handleReturnUpdate = () => runAction(() => adminUpdateReturn(id, returnDraft));

  if (loading) {
    return (
      <EcommerceLayout breadcrumb={['ORDERS', 'EDIT ORDER']}>
        <div className="text-center text-xs text-slate-400 py-10">Loading order…</div>
      </EcommerceLayout>
    );
  }

  if (loadError || !order) {
    return (
      <EcommerceLayout breadcrumb={['ORDERS', 'EDIT ORDER']}>
        <div className="px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError || 'Order not found.'}
        </div>
      </EcommerceLayout>
    );
  }

  const orderNumber = `#${order.id}`;
  const address = order.shippingAddress || {};
  const fullAddress = [address.address, address.town, address.city, address.country, address.postalCode]
    .filter(Boolean)
    .join(', ');
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;
  const canAccept = order.orderStatus === 'Order Placed' || order.orderStatus === 'Payment Confirmed';

  return (
    <EcommerceLayout
      breadcrumb={[
        <Link key="1" to="/admin/ecommerce/orders" className="hover:underline">
          ORDERS
        </Link>,
        `EDIT ORDER ${orderNumber}`
      ]}
    >
      {saveError && (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {saveError}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          {/* Order Information & Products */}
          <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-slate-800 text-sm">
                  Order information {orderNumber}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    order.orderStatus === 'Completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <tbody>
                  {(order.orderItems || []).map((item) => (
                    <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-4 w-16">
                        <img
                          src={item.image || '/planter.png'}
                          alt="Product"
                          className="w-14 h-14 object-cover rounded-md border border-slate-200"
                        />
                      </td>
                      <td className="p-4">
                        <Link
                          to={`/admin/ecommerce/products/edit/${item.product}`}
                          className="font-bold text-slate-800 hover:text-blue-600 hover:underline leading-snug block text-xs"
                        >
                          {item.name}
                        </Link>
                        <div className="text-[11px] text-slate-500 mt-1">
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 text-right whitespace-nowrap">
                        {formatMoney(item.price)}
                      </td>
                      <td className="p-4 text-slate-400 text-center whitespace-nowrap">x</td>
                      <td className="p-4 font-semibold text-slate-700 text-center whitespace-nowrap">
                        {item.qty}
                      </td>
                      <td className="p-4 font-bold text-slate-800 text-right whitespace-nowrap">
                        {formatMoney(item.lineTotal != null ? item.lineTotal : item.price * item.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col items-end">
              <div className="w-full sm:w-80 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Sub amount</span>
                  <span className="font-semibold text-slate-800">{formatMoney(order.subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="font-semibold text-slate-800">{formatMoney(order.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping fee</span>
                  <span className="font-semibold text-slate-800">{formatMoney(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="font-semibold text-slate-800">{formatMoney(order.tax)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-800">
                  <span>Total amount</span>
                  <span className="text-blue-600">{formatMoney(order.total)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Paid amount</span>
                  <span className="font-semibold text-slate-800">{formatMoney(order.paidAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Payment method</span>
                  <span className="font-medium text-slate-700 bg-white px-2 py-0.5 rounded-sm border border-slate-200">
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Payment status</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      order.paymentStatus === 'Paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Note
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add customer or administrative note about this order..."
              className="w-full border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between">
              {noteSaved && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <FiCheck size={13} /> Note saved!
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-md text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <FiSave size={13} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>

          {/* Workflow */}
          <div className="bg-white rounded-md border border-slate-200 shadow-2xs divide-y divide-slate-100">
            <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    order.orderStatus === 'Processing' || order.orderStatus === 'Completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {order.orderStatus === 'Processing' || order.orderStatus === 'Completed' ? <FiCheck size={16} /> : '1'}
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-800">Accept &amp; create shipment</div>
                  <div className="text-[11px] text-slate-400">
                    Confirms the order and generates a shipment record
                  </div>
                </div>
              </div>
              {canAccept ? (
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={saving}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-md text-xs font-semibold transition"
                >
                  Accept order
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <FiCheck size={14} /> {order.orderStatus}
                </span>
              )}
            </div>

            <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                  <FiPackage size={15} />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-800">Order status</div>
                  <div className="text-[11px] text-slate-400">Manually set the order's status</div>
                </div>
              </div>
              <select
                value={order.orderStatus}
                onChange={(e) => handleOrderStatusChange(e.target.value)}
                disabled={saving}
                className="border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-blue-500"
              >
                {ORDER_STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <FiTruck size={15} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-800">Shipment</div>
                    <div className="text-xs font-bold text-blue-600">
                      {order.shipment?.number || 'Not created'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleShipmentUpdate}
                  disabled={saving}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 disabled:opacity-60 text-slate-700 rounded-md text-xs font-semibold transition"
                >
                  Update shipment
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Status</span>
                  <select
                    value={shipmentDraft.status}
                    onChange={(e) => setShipmentDraft((d) => ({ ...d, status: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs"
                  >
                    {SHIPMENT_STATUS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Method</span>
                  <input
                    value={shipmentDraft.method}
                    onChange={(e) => setShipmentDraft((d) => ({ ...d, method: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Note</span>
                  <input
                    value={shipmentDraft.note}
                    onChange={(e) => setShipmentDraft((d) => ({ ...d, note: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs"
                  />
                </div>
              </div>
            </div>

            {order.returnStatus && order.returnStatus !== 'Not Requested' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    <FiDollarSign size={15} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-800">Return / Replace</div>
                    <div className="text-[11px] text-slate-400">Reason: {order.returnReason || '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={returnDraft}
                    onChange={(e) => setReturnDraft(e.target.value)}
                    className="border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {RETURN_STATUS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleReturnUpdate}
                    disabled={saving}
                    className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-900 disabled:opacity-60 text-white rounded-md text-xs font-semibold transition"
                  >
                    Update return status
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Customer
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                {(order.customer || '?').charAt(0)}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-xs">{order.customer}</div>
                <div className="text-[11px] text-slate-400">{order.guest ? "Doesn't have an account" : 'Registered customer'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Shipping information
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="font-semibold text-slate-900">{order.customer}</div>
              {order.phone && (
                <div className="flex items-center gap-2">
                  <FiPhone size={13} className="text-slate-400 shrink-0" />
                  <a href={`tel:${order.phone}`} className="text-blue-600 hover:underline font-medium">
                    {order.phone}
                  </a>
                </div>
              )}
              {order.customerEmail && (
                <div className="flex items-center gap-2">
                  <FiMail size={13} className="text-slate-400 shrink-0" />
                  <a href={`mailto:${order.customerEmail}`} className="text-blue-600 hover:underline break-all">
                    {order.customerEmail}
                  </a>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 space-y-0.5 text-slate-600">
                <div>{address.address}</div>
                <div>{address.town || address.city}</div>
                <div>{address.country}</div>
                <div className="font-semibold text-slate-800">{address.postalCode}</div>
              </div>
              {fullAddress && (
                <div className="pt-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold text-xs"
                  >
                    <FiMapPin size={13} />
                    <span>See on maps</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceOrderEdit;
