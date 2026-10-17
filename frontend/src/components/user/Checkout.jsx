import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import api from '../../utils/api';
import { payWithRazorpay } from '../../utils/razorpay';
import { ensureCustomerAuth, getCustomerToken } from '../../utils/customerAuth';
import { getActiveReferralCode } from '../../utils/referralTracking';
import {
  CheckCircle,
  MapPin,
  CreditCard,
  ArrowLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const PAYMENT_OPTIONS = [
  { id: 'upi', title: 'UPI (GPay / PhonePe / Paytm / QR)', desc: 'Instant verification with zero transaction fee', online: true },
  { id: 'card', title: 'Debit / Credit Card', desc: 'Visa, MasterCard, RuPay cards accepted', online: true },
  { id: 'netbanking', title: 'Net Banking', desc: 'All major Indian public & private banks', online: true },
  { id: 'cod', title: 'Cash on Delivery', desc: 'Pay safely upon doorstep delivery', online: false },
];

const inputCls =
  'w-full bg-white border rounded-xl px-3.5 py-2.5 text-[13px] sm:text-xs text-[#2B1E1A] focus:outline-none focus:border-[#A94E2C]';

const Field = ({ label, error, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-gray-600 font-semibold mb-1 text-xs">{label}</label>
    <input {...props} className={`${inputCls} ${error ? 'border-red-400' : 'border-[#E8D4B5]'}`} />
    {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
  </div>
);

const Checkout = () => {
  const { cart, cartTotal, clearCart, user, isAuthenticated } = useShop();
  const location = useLocation();
  const navigate = useNavigate();
  const appliedCoupon = location.state?.appliedCoupon || null;
  const signedIn = isAuthenticated && !!getCustomerToken();

  const [step, setStep] = useState(1);
  // Pre-filled from the customer's own account only — never sample data.
  const [address, setAddress] = useState(() => ({
    fullName: signedIn ? user?.name || '' : '',
    phone: signedIn ? String(user?.mobile || user?.phone || '').replace(/\D/g, '').slice(-10) : '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    email: signedIn ? user?.email || '' : '',
  }));
  const [addressErrors, setAddressErrors] = useState({});

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [orderComplete, setOrderComplete] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [enabledMethodCodes, setEnabledMethodCodes] = useState(null);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    api.get('/payments/methods/public')
      .then((res) => setEnabledMethodCodes((res.data?.data || []).map((m) => m.code)))
      .catch(() => setEnabledMethodCodes(['cod', 'razorpay']));
  }, []);

  const codEnabled = enabledMethodCodes === null || enabledMethodCodes.includes('cod');
  const onlineEnabled = enabledMethodCodes === null || enabledMethodCodes.includes('razorpay');

  useEffect(() => {
    if (enabledMethodCodes === null) return;
    if (paymentMethod === 'cod' && !codEnabled) setPaymentMethod(onlineEnabled ? 'upi' : '');
    if (paymentMethod !== 'cod' && !onlineEnabled) setPaymentMethod(codEnabled ? 'cod' : '');
  }, [enabledMethodCodes, paymentMethod, codEnabled, onlineEnabled]);

  const orderItemsPayload = () =>
    cart.map((item) => ({
      product: item._id,
      quantity: item.quantity,
      image: item.image,
    }));

  // Prices, coupon, shipping and COD fee exactly as the server will charge them.
  const cartKey = cart.map((i) => `${i._id}:${i.quantity}`).join(',');
  useEffect(() => {
    if (!cart.length) return undefined;
    let cancelled = false;
    api
      .post('/orders/quote', {
        items: orderItemsPayload(),
        couponCode: appliedCoupon?.code || '',
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'online',
      })
      .then((res) => !cancelled && setQuote(res.data?.data || null))
      .catch(() => !cancelled && setQuote(null));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, appliedCoupon?.code, paymentMethod]);

  // Fallback (server unreachable): estimate from the bag.
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discountType === 'percentage'
      ? Math.round((cartTotal * appliedCoupon.discountValue) / 100)
      : appliedCoupon.discountValue
    : 0;
  const subtotal = quote ? quote.subtotal : cartTotal;
  const discount = quote ? quote.discountAmount : couponDiscount;
  const shippingCost = quote ? quote.shippingAmount : 0;
  const codFee = quote ? quote.codFee : 0;
  const grandTotal = quote ? quote.total : Math.max(0, cartTotal - couponDiscount);

  const shippingPayload = () => ({
    name: address.fullName.trim(),
    fullName: address.fullName.trim(),
    phone: address.phone,
    email: address.email.trim(),
    address: address.street.trim(),
    city: address.city.trim(),
    town: address.state.trim(),
    postalCode: address.pincode,
    country: 'India',
  });

  const validateAddress = () => {
    const e = {};
    if (!address.fullName.trim()) e.fullName = 'Enter your full name';
    if (!/^[6-9]\d{9}$/.test(address.phone)) e.phone = 'Enter a valid 10-digit mobile number';
    if (address.street.trim().length < 5) e.street = 'Enter your house no. and street';
    if (!address.city.trim()) e.city = 'Enter your city';
    if (!address.state.trim()) e.state = 'Enter your state';
    if (!/^\d{6}$/.test(address.pincode)) e.pincode = 'Enter a 6-digit pincode';
    if (address.email && !/^\S+@\S+\.\S+$/.test(address.email)) e.email = 'Enter a valid email';
    setAddressErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToPayment = () => {
    if (!validateAddress()) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const persistSuccess = (serverOrder) => {
    clearCart();
    setConfirmedOrder({
      ref: String(serverOrder?.orderNumber || serverOrder?.orderId || serverOrder?._id || ''),
      total: serverOrder?.totalPrice ?? grandTotal,
      paid: !!serverOrder?.isPaid,
    });
    setOrderComplete(true);
    window.scrollTo({ top: 0 });
  };

  const handlePlaceOrder = async () => {
    setOrderError('');

    const token = await ensureCustomerAuth();
    if (!token) {
      setOrderError('Please log in to complete your order.');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (cart.length === 0) {
      setOrderError('Your cart is empty. Add products from the shop first.');
      return;
    }
    if (!validateAddress()) {
      setStep(1);
      return;
    }

    setPlacing(true);
    try {
      const items = orderItemsPayload();
      const shippingAddress = shippingPayload();
      const couponCode = appliedCoupon?.code || '';
      const referralCode = getActiveReferralCode() || '';

      if (paymentMethod === 'cod') {
        const res = await api.post('/orders', {
          items,
          shippingAddress,
          paymentMethod: 'COD',
          couponCode,
          referralCode,
        });
        persistSuccess(res.data?.data?.order);
        return;
      }

      const createRes = await api.post('/orders/razorpay/create', {
        items,
        couponCode,
      });
      const { order: razorpayOrder, quote: payQuote, keyId } = createRes.data?.data || {};

      const payment = await payWithRazorpay({
        razorpayOrder,
        quote: payQuote,
        keyId,
        customer: {
          name: address.fullName,
          email: address.email,
          phone: address.phone,
        },
        onMockPay: async (mockResponse) => mockResponse,
      });

      const verifyRes = await api.post('/orders/razorpay/verify', {
        ...payment,
        orderDetails: { items, shippingAddress, couponCode, referralCode },
      });

      persistSuccess(verifyRes.data?.data?.order);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setOrderError('Session expired. Please log in again to place your order.');
      } else {
        setOrderError(err.parsedMessage || err.message || 'Could not place order. Please try again.');
      }
    } finally {
      setPlacing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-white py-10 sm:py-16 px-4 pb-24">
        <div className="max-w-md mx-auto bg-[#FCF8F2] border-2 border-[#C69A45] rounded-3xl p-6 sm:p-8 text-center shadow-xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#82977A]/20 border-2 border-[#354B35] flex items-center justify-center mx-auto mb-4 text-[#354B35]">
            <CheckCircle size={36} />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-[#A94E2C]">Khammaghani! Order Placed</span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#6F241D] mt-1">Dhanyawad Sa!</h1>
          <p className="text-xs text-[#70452F] mt-2 mb-6">
            Your order has been received. You can follow it any time from My Orders.
          </p>

          <div className="bg-[#FAF4EA] border border-[#E8D4B5] rounded-2xl p-4 text-left space-y-2 mb-6 text-xs text-[#2B1E1A]">
            {confirmedOrder?.ref && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Order number</span>
                <span className="font-bold text-[#6F241D] break-all text-right">{confirmedOrder.ref}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">{confirmedOrder?.paid ? 'Amount paid' : 'Amount to pay on delivery'}</span>
              <span className="font-bold text-[#354B35]">{inr(confirmedOrder?.total)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/orders"
              className="w-full inline-block bg-[#6F241D] hover:bg-[#873A24] text-white py-3 rounded-full text-xs font-bold transition-all shadow-md"
            >
              View My Orders
            </Link>
            <Link
              to="/shop"
              className="w-full inline-block bg-white border border-[#A94E2C] text-[#A94E2C] hover:bg-[#FAF4EA] py-3 rounded-full text-xs font-bold transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-8">
          <span className="text-4xl">🏺</span>
          <h2 className="text-xl font-bold font-serif text-[#6F241D] mt-3">Your Bag is Empty</h2>
          <p className="text-xs text-[#70452F] mt-1 mb-6">Explore authentic handicrafts from Jaipur.</p>
          <Link to="/shop" className="bg-[#6F241D] text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#873A24]">
            Explore Handicrafts
          </Link>
        </div>
      </div>
    );
  }

  const setField = (key) => (e) => {
    let value = e.target.value;
    if (key === 'phone') value = value.replace(/\D/g, '').replace(/^(91|0)(?=\d{10})/, '').slice(0, 10);
    if (key === 'pincode') value = value.replace(/\D/g, '').slice(0, 6);
    setAddress((prev) => ({ ...prev, [key]: value }));
    if (addressErrors[key]) setAddressErrors((prev) => ({ ...prev, [key]: null }));
  };

  const paymentLabel = PAYMENT_OPTIONS.find((m) => m.id === paymentMethod)?.title || paymentMethod;
  const steps = ['Address', 'Payment', 'Review'];

  return (
    <div className="min-h-screen bg-white py-4 sm:py-8 pb-28 sm:pb-14 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-[#E8D4B5]">
          <Link to="/shop" className="flex items-center gap-1.5 text-xs font-bold text-[#70452F] hover:text-[#6F241D] shrink-0">
            <ArrowLeft size={14} />
            <span>Shop</span>
          </Link>
          <span className="font-serif font-black text-lg sm:text-xl text-[#6F241D] truncate">Checkout</span>
          <span className="text-[11px] sm:text-xs text-[#354B35] font-bold inline-flex items-center gap-1 shrink-0">
            <ShieldCheck size={14} /> <span className="hidden sm:inline">100% </span>Secure
          </span>
        </div>

        {/* Steps */}
        <div className="flex justify-center mb-5 sm:mb-8">
          <div className="flex items-center gap-1.5 sm:gap-6 text-[11px] sm:text-xs font-bold">
            {steps.map((label, i) => (
              <React.Fragment key={label}>
                <span className={`px-2.5 sm:px-3 py-1 rounded-full whitespace-nowrap ${step >= i + 1 ? 'bg-[#6F241D] text-white' : 'bg-[#F5EFE6] text-gray-400'}`}>
                  {i + 1}. {label}
                </span>
                {i < steps.length - 1 && <ChevronRight size={14} className="text-gray-400 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {!signedIn && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E8D4B5] bg-[#FFF8EC] px-4 py-3 text-xs text-[#70452F]">
            <span>Log in to place your order and track it later.</span>
            <Link to="/login" state={{ from: '/checkout' }} className="font-bold text-[#6F241D] underline">
              Log in
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Step 1: Address */}
            {step === 1 && (
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="text-[#A94E2C]" size={20} />
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#6F241D]">Shipping Address</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Field label="Full Name" value={address.fullName} onChange={setField('fullName')} error={addressErrors.fullName} autoComplete="name" />
                  <Field label="Mobile Number" value={address.phone} onChange={setField('phone')} error={addressErrors.phone} inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" />
                  <Field label="House No. / Street / Area" className="sm:col-span-2" value={address.street} onChange={setField('street')} error={addressErrors.street} autoComplete="street-address" />
                  <Field label="City" value={address.city} onChange={setField('city')} error={addressErrors.city} autoComplete="address-level2" />
                  <Field label="State" value={address.state} onChange={setField('state')} error={addressErrors.state} autoComplete="address-level1" />
                  <Field label="Pincode" value={address.pincode} onChange={setField('pincode')} error={addressErrors.pincode} inputMode="numeric" autoComplete="postal-code" />
                  <Field label="Email (optional, for order updates)" type="email" value={address.email} onChange={setField('email')} error={addressErrors.email} autoComplete="email" />
                </div>

                <div className="pt-2 sm:pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={goToPayment}
                    className="w-full sm:w-auto bg-[#6F241D] hover:bg-[#873A24] text-white px-6 py-3 sm:py-2.5 rounded-full text-xs font-bold transition-all"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-[#A94E2C]" size={20} />
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#6F241D]">Payment Method</h3>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {PAYMENT_OPTIONS.filter((method) => (method.online ? onlineEnabled : codEnabled)).map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === method.id ? 'bg-[#FAF4EA] border-2 border-[#A94E2C]' : 'bg-white border-[#E8D4B5] hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="accent-[#A94E2C] shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#6F241D]">{method.title}</h4>
                        <p className="text-[10px] text-gray-500">
                          {method.desc}
                          {method.id === 'cod' && codFee > 0 ? ` · ${inr(codFee)} COD fee` : ''}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="pt-2 sm:pt-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between sm:items-center">
                  <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-[#70452F] hover:underline py-2">
                    ← Back to Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!paymentMethod}
                    className="w-full sm:w-auto bg-[#6F241D] hover:bg-[#873A24] disabled:opacity-50 text-white px-6 py-3 sm:py-2.5 rounded-full text-xs font-bold transition-all"
                  >
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Place */}
            {step === 3 && (
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-5">
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#6F241D]">Confirm & Place Your Order</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF4EA] p-4 rounded-2xl border border-[#E8D4B5]">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-[10px] font-bold uppercase">Deliver To</span>
                      <button type="button" onClick={() => setStep(1)} className="text-[10px] font-bold text-[#A94E2C]">Change</button>
                    </div>
                    <p className="font-bold text-[#6F241D] mt-0.5 break-words">{address.fullName} ({address.phone})</p>
                    <p className="text-gray-600 break-words">{address.street}, {address.city}, {address.state} - {address.pincode}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-[10px] font-bold uppercase">Payment</span>
                      <button type="button" onClick={() => setStep(2)} className="text-[10px] font-bold text-[#A94E2C]">Change</button>
                    </div>
                    <p className="font-bold text-[#6F241D] mt-0.5">{paymentLabel}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-[#70452F] uppercase tracking-wider">Items ({cart.length})</h4>
                  {cart.map((item) => (
                    <div key={item._id} className="flex items-center gap-3 bg-white p-2.5 sm:p-3 rounded-xl border border-[#E8D4B5]">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-[#2B1E1A] line-clamp-2 leading-snug">{item.name}</h5>
                        <span className="text-[10px] text-gray-500">Qty {item.quantity} · {inr(item.price)} each</span>
                      </div>
                      <span className="text-xs font-bold text-[#6F241D] shrink-0">{inr(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {orderError && <p className="text-[11px] text-red-600 font-semibold">{orderError}</p>}

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between sm:items-center">
                  <button type="button" onClick={() => setStep(2)} className="text-xs font-bold text-[#70452F] hover:underline py-2">
                    ← Edit Payment
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    type="button"
                    className="w-full sm:w-auto bg-[#354B35] hover:bg-[#202E20] disabled:opacity-60 text-white px-6 sm:px-8 py-3.5 sm:py-3 rounded-full text-xs font-black uppercase tracking-wider shadow-lg transition-all inline-flex items-center justify-center gap-2"
                  >
                    {placing ? <Loader2 size={14} className="animate-spin" /> : null}
                    {placing ? 'Processing…' : `Place Order · ${inr(grandTotal)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-4 min-w-0">
            <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
              <h4 className="font-serif font-bold text-base text-[#6F241D]">Order Summary</h4>

              <div className="space-y-2 text-xs text-[#2B1E1A]">
                <div className="flex justify-between gap-3">
                  <span>Items ({cart.reduce((n, i) => n + i.quantity, 0)})</span>
                  <span className="font-semibold">{inr(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between gap-3 text-[#2E7D32]">
                    <span>Coupon{appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}</span>
                    <span className="font-semibold">−{inr(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <span>Shipping</span>
                  <span className="font-semibold text-[#354B35]">{quote ? (shippingCost === 0 ? 'FREE' : inr(shippingCost)) : '—'}</span>
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between gap-3">
                    <span>Cash on delivery fee</span>
                    <span className="font-semibold">{inr(codFee)}</span>
                  </div>
                )}
                <hr className="border-[#E8D4B5]" />
                <div className="flex justify-between gap-3 text-sm font-extrabold text-[#6F241D]">
                  <span>Total</span>
                  <span>{inr(grandTotal)}</span>
                </div>
                {quote?.taxAmount > 0 && <p className="text-[10px] text-gray-500 text-right">Includes {inr(quote.taxAmount)} GST</p>}
              </div>

              <div className="p-3 bg-[#FAF4EA] border border-[#C69A45]/40 rounded-xl text-center text-[11px] text-[#70452F]">
                🌸 Packed with care for fragile handicrafts.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
