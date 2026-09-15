import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiRefreshCw } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import { generateCouponCode, getDiscountById } from '../../../data/discounts';

const emptyDiscount = {
  type: 'coupon',
  code: '',
  title: '',
  canUseWithPromotion: false,
  unlimited: true,
  applyViaUrl: false,
  displayAtCheckout: false,
  couponType: 'amount',
  value: '',
  applyFor: 'all_orders',
  minOrderAmount: '',
  startDate: new Date().toISOString().slice(0, 10),
  startTime: '0:00',
  endDate: new Date().toISOString().slice(0, 10),
  endTime: '23:59',
  neverExpired: true,
};

const COUPON_TYPES = [
  { value: 'amount', label: '₹' },
  { value: 'percentage', label: 'Percentage discount (%)' },
  { value: 'free_shipping', label: 'Free shipping' },
  { value: 'same_price', label: 'Same price' },
];

const APPLY_FOR = [
  { value: 'all_orders', label: 'All orders' },
  { value: 'order_amount_from', label: 'Order amount from' },
  { value: 'product_collection', label: 'Product collection' },
  { value: 'product_category', label: 'Product category' },
  { value: 'product', label: 'Product' },
  { value: 'customer', label: 'Customer' },
  { value: 'variant', label: 'Variant' },
  { value: 'once_per_customer', label: 'Once per customer' },
];

export const AdminEcommerceDiscountEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';
  const existing = useMemo(() => (isCreate ? null : getDiscountById(id)), [id, isCreate]);
  const seed = existing || emptyDiscount;

  const [type, setType] = useState(seed.type || 'coupon');
  const [code, setCode] = useState(seed.code || '');
  const [title, setTitle] = useState(seed.title || '');
  const [canUseWithPromotion, setCanUseWithPromotion] = useState(Boolean(seed.canUseWithPromotion));
  const [unlimited, setUnlimited] = useState(seed.unlimited !== false);
  const [applyViaUrl, setApplyViaUrl] = useState(Boolean(seed.applyViaUrl));
  const [displayAtCheckout, setDisplayAtCheckout] = useState(Boolean(seed.displayAtCheckout));
  const [couponType, setCouponType] = useState(seed.couponType || 'amount');
  const [value, setValue] = useState(seed.value ?? '');
  const [applyFor, setApplyFor] = useState(seed.applyFor || 'all_orders');
  const [minOrderAmount, setMinOrderAmount] = useState(seed.minOrderAmount || '');
  const [startDate, setStartDate] = useState(seed.startDate || emptyDiscount.startDate);
  const [startTime, setStartTime] = useState(seed.startTime || '0:00');
  const [endDate, setEndDate] = useState(seed.endDate || emptyDiscount.endDate);
  const [endTime, setEndTime] = useState(seed.endTime || '23:59');
  const [neverExpired, setNeverExpired] = useState(seed.neverExpired !== false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const next = isCreate ? emptyDiscount : getDiscountById(id) || emptyDiscount;
    setType(next.type || 'coupon');
    setCode(next.code || '');
    setTitle(next.title || '');
    setCanUseWithPromotion(Boolean(next.canUseWithPromotion));
    setUnlimited(next.unlimited !== false);
    setApplyViaUrl(Boolean(next.applyViaUrl));
    setDisplayAtCheckout(Boolean(next.displayAtCheckout));
    setCouponType(next.couponType || 'amount');
    setValue(next.value ?? '');
    setApplyFor(next.applyFor || 'all_orders');
    setMinOrderAmount(next.minOrderAmount || '');
    setStartDate(next.startDate || emptyDiscount.startDate);
    setStartTime(next.startTime || '0:00');
    setEndDate(next.endDate || emptyDiscount.endDate);
    setEndTime(next.endTime || '23:59');
    setNeverExpired(isCreate ? true : Boolean(next.neverExpired));
  }, [id, isCreate]);

  const pageTitle = isCreate ? 'Create discount' : `Edit discount`;

  const handleSave = () => {
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 1800);
    navigate('/admin/ecommerce/discounts');
  };

  return (
    <EcommerceLayout breadcrumb={['DISCOUNTS', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Discount saved successfully!</span>
        </div>
      )}

      <div className="bg-white rounded-md border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-6 max-w-4xl">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select type of discount
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full max-w-md border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="coupon">Coupon code</option>
            <option value="promotion">Promotion</option>
          </select>
        </div>

        {type === 'coupon' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Create coupon code
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="flex-1 min-w-[200px] border border-slate-300 rounded-md py-2 px-3 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setCode(generateCouponCode())}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <FiRefreshCw size={12} />
                  Generate coupon code
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Customers will enter this coupon code when they checkout.
              </p>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={canUseWithPromotion}
                onChange={(e) => setCanUseWithPromotion(e.target.checked)}
                className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              <span>Can be used with promotion?</span>
            </label>

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={unlimited}
                onChange={(e) => setUnlimited(e.target.checked)}
                className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              <span>Unlimited coupon?</span>
            </label>

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={applyViaUrl}
                onChange={(e) => setApplyViaUrl(e.target.checked)}
                className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              <span>
                Apply via URL? This setting will apply coupon code when customers access the URL with
                the parameter &quot;?coupon=code&quot;.
              </span>
            </label>

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={displayAtCheckout}
                onChange={(e) => setDisplayAtCheckout(e.target.checked)}
                className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              <span>
                Display coupon code at the checkout page? The list of coupon codes will be displayed
                at the checkout page and customers can choose to apply.
              </span>
            </label>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Promotion name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Promotion name"
              className="w-full max-w-md border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="border border-slate-200 rounded-md overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Coupon type
            </h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <select
                  value={couponType}
                  onChange={(e) => setCouponType(e.target.value)}
                  className="border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  {COUPON_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {couponType !== 'free_shipping' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Discount
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-28 border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>
                  {couponType === 'percentage'
                    ? '% apply for'
                    : couponType === 'free_shipping'
                      ? 'Free shipping apply for'
                      : '₹ apply for'}
                </span>
                <select
                  value={applyFor}
                  onChange={(e) => setApplyFor(e.target.value)}
                  className="border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  {APPLY_FOR.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {applyFor === 'order_amount_from' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Minimum order amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  className="w-40 border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="border border-slate-200 rounded-md overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Time</h4>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Start date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="hh:mm"
                    className="w-24 border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">End date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={endDate}
                    disabled={neverExpired}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <input
                    type="text"
                    value={endTime}
                    disabled={neverExpired}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="hh:mm"
                    className="w-24 border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={neverExpired}
                onChange={(e) => setNeverExpired(e.target.checked)}
                className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              <span>Never expired?</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            Save
          </button>
          <Link
            to="/admin/ecommerce/discounts"
            className="inline-flex items-center justify-center px-5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            Cancel
          </Link>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceDiscountEdit;
