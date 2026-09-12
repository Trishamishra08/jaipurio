import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import {
  FiFileText,
  FiPrinter,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiTruck,
  FiDollarSign,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiExternalLink,
  FiRotateCcw,
  FiXCircle,
  FiEdit,
  FiSave,
  FiCheck,
  FiAlertCircle,
  FiPackage,
  FiCreditCard
} from 'react-icons/fi';

export const AdminEcommerceOrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = id || '370';
  const orderNumber = `#10000${orderId}`;
  const shipmentNumber = '#10000162';

  // Order state
  const [orderStatus, setOrderStatus] = useState('Uncompleted');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [shippingStatus, setShippingStatus] = useState('Pending');
  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [emailResent, setEmailResent] = useState(false);

  // Customer & Shipping details
  const [customer, setCustomer] = useState({
    name: 'Singh',
    email: 'vaibhavsingh8032@gmail.com',
    phone: '8839665405',
    address: 'Village Naugai post Katgodi',
    city: 'Baikunthpur',
    state: 'Chhattisgarh',
    country: 'India',
    pincode: '497339'
  });

  const handleSaveNote = () => {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleResendEmail = () => {
    setEmailResent(true);
    setTimeout(() => setEmailResent(false), 2500);
  };

  const fullAddress = `${customer.address}, ${customer.city}, ${customer.state}, ${customer.country}, ${customer.pincode}`;
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;

  return (
    <EcommerceLayout
      breadcrumb={[
        <Link key="1" to="/admin/ecommerce/orders" className="hover:underline">
          ORDERS
        </Link>,
        `EDIT ORDER ${orderNumber}`
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Order Details, Notes, Fulfillment, History (8 cols)         */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card: Order Information & Products */}
          <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-slate-800 text-sm">
                  Order information {orderNumber}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    orderStatus === 'Completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {orderStatus}
                </span>
              </div>
            </div>

            {/* Products List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <tbody>
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 w-16">
                      <img
                        src="/planter.png"
                        alt="Product"
                        className="w-14 h-14 object-cover rounded-md border border-slate-200"
                      />
                    </td>
                    <td className="p-4">
                      <Link
                        to="/admin/ecommerce/products/edit/7878"
                        className="font-bold text-slate-800 hover:text-blue-600 hover:underline leading-snug block text-xs"
                      >
                        Comfy White Hunting Style Cotton Shirt - Premium Comfort Style | Jaipurio
                      </Link>
                      <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                        <div>
                          (SKU: <strong className="text-slate-700 font-mono">JAI-CL-CWH-001</strong>)
                        </div>
                        <div className="text-slate-600">
                          (Material: Brocade , Size (S,M,L): XL, Color: White)
                        </div>
                        <div className="text-slate-500 flex items-center gap-1 mt-1">
                          <span>↳ Shipping</span>
                          <Link
                            to="/admin/ecommerce/shipments"
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            Shiprocket
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 text-right whitespace-nowrap">
                      ₹1,700.0
                    </td>
                    <td className="p-4 text-slate-400 text-center whitespace-nowrap">x</td>
                    <td className="p-4 font-semibold text-slate-700 text-center whitespace-nowrap">
                      1
                    </td>
                    <td className="p-4 font-bold text-slate-800 text-right whitespace-nowrap">
                      ₹1,700.0
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations and Breakdown Table */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col items-end">
              <div className="w-full sm:w-80 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Quantity</span>
                  <span className="font-semibold text-slate-800">1</span>
                </div>
                <div className="flex justify-between">
                  <span>Sub amount</span>
                  <span className="font-semibold text-slate-800">₹1,700.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="font-semibold text-slate-800">₹0.0</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span>Shipping fee</span>
                    <div className="text-[10px] text-slate-400">Shiprocket 7,000 grams</div>
                  </div>
                  <span className="font-semibold text-slate-800">₹0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="font-semibold text-slate-800">₹0.0</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-800">
                  <span>Total amount</span>
                  <span className="text-blue-600">₹1,700.0</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Paid amount</span>
                  <span className="font-semibold text-slate-800">₹0.0</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Payment method</span>
                  <span className="font-medium text-slate-700 bg-white px-2 py-0.5 rounded-sm border border-slate-200">
                    Cash on delivery (COD)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Payment status</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      paymentStatus === 'Completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice Action Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => alert('Generating official invoice PDF...')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-semibold transition border border-blue-200"
              >
                <FiFileText size={14} />
                <span>Generate invoice</span>
              </button>
            </div>
          </div>

          {/* Card: Order Note */}
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
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <FiSave size={13} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card: Order Workflow & Fulfillment Actions */}
          <div className="bg-white rounded-md border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {/* Step 1: Confirm Order */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isConfirmed ? <FiCheck size={16} /> : '1'}
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-800">
                    {isConfirmed ? 'Order confirmed' : 'Confirm order'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Verify items and mark order as verified
                  </div>
                </div>
              </div>

              {!isConfirmed ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmed(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition"
                >
                  Confirm
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <FiCheck size={14} /> Confirmed
                </span>
              )}
            </div>

            {/* Step 2: Payment Verification */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    paymentStatus === 'Completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <FiDollarSign size={15} />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-800">
                    {paymentStatus === 'Completed' ? 'Payment received' : 'Pending payment'}
                  </div>
                  <div className="text-[11px] text-slate-400">Cash on delivery (COD)</div>
                </div>
              </div>

              {paymentStatus !== 'Completed' ? (
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Completed')}
                  className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-900 text-white rounded-md text-xs font-semibold transition"
                >
                  Confirm payment
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Pending')}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Mark as Unpaid
                </button>
              )}
            </div>

            {/* Step 3: Delivery & Shipping */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <FiTruck size={15} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-800">Delivery Shipping</div>
                    <Link
                      to="/admin/ecommerce/shipments"
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      {shipmentNumber}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setShippingStatus(shippingStatus === 'Pending' ? 'Shipped' : 'Delivered')
                    }
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold transition flex items-center gap-1"
                  >
                    <FiRefreshCw size={12} />
                    <span>Update shipping status</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition flex items-center gap-1 border border-slate-200"
                  >
                    <FiPrinter size={13} />
                    <span>Print shipping label</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-semibold text-amber-700">{shippingStatus}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Shipping method</span>
                  <span className="font-semibold text-slate-700">Shiprocket</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Weight (g)</span>
                  <span className="font-semibold text-slate-700">7000 g</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Update</span>
                  <span className="font-semibold text-slate-700">2026-05-13 12:12:19</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: History Timeline */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              History
            </h4>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                <div className="flex-1">
                  <span className="font-semibold">New order {orderNumber} from {customer.name}</span>
                  <div className="text-[11px] text-slate-400">2026-05-13 12:12:22</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span>The email confirmation was sent to customer</span>
                    <div className="text-[11px] text-slate-400">2026-05-13 12:12:22</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    className="px-2 py-0.5 border border-slate-300 rounded-sm text-[11px] hover:bg-slate-50 font-medium text-slate-600"
                  >
                    {emailResent ? 'Sent ✓' : 'Resend'}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                <div className="flex-1">
                  <span>Order is created from checkout page</span>
                  <div className="text-[11px] text-slate-400">2026-05-13 12:12:19</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDEBAR: Customer, Shipping Address, Actions (4 cols)               */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: Customer */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Customer
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                {customer.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-xs">{customer.name}</div>
                <div className="text-[11px] text-slate-400">Don't have an account yet</div>
              </div>
            </div>
          </div>

          {/* Card: Shipping Information */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Shipping information
              </h4>
              <button
                type="button"
                className="text-slate-400 hover:text-blue-600 p-1"
                title="Edit address"
              >
                <FiEdit size={13} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="font-semibold text-slate-900">{customer.name}</div>

              <div className="flex items-center gap-2">
                <FiPhone size={13} className="text-slate-400 shrink-0" />
                <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline font-medium">
                  {customer.phone}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <FiMail size={13} className="text-slate-400 shrink-0" />
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline break-all">
                  {customer.email}
                </a>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-0.5 text-slate-600">
                <div>{customer.address}</div>
                <div>{customer.city}</div>
                <div>{customer.state}</div>
                <div>{customer.country}</div>
                <div className="font-semibold text-slate-800">{customer.pincode}</div>
              </div>

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
            </div>
          </div>

          {/* Card: Order Action Controls */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
            <button
              type="button"
              onClick={() => alert(`Creating reorder clone for order ${orderNumber}...`)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition"
            >
              <FiRotateCcw size={13} />
              <span>Reorder</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this order?')) {
                  setOrderStatus('Canceled');
                }
              }}
              className="w-full flex items-center justify-center gap-2 border border-red-300 hover:bg-red-50 text-red-600 font-semibold py-1.5 px-3 rounded-md text-xs transition"
            >
              <FiXCircle size={13} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceOrderEdit;
