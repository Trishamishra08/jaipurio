import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import api from '../../utils/api';
import { payWithRazorpay } from '../../utils/razorpay';
import { payWithCashfree, savePendingCashfree, takePendingCashfree } from '../../utils/cashfree';
import { ensureCustomerAuth, getCustomerToken } from '../../utils/customerAuth';
import { getActiveReferralCode } from '../../utils/referralTracking';
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import PushPermissionPrompt from '../shared/PushPermissionPrompt';
import { usePageSeo } from '../../utils/seo';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// The customer picks UPI / card / netbanking / wallet inside the gateway's own window.
const PAYMENT_OPTIONS = [
  { id: 'online', title: 'Pay online', desc: 'UPI, debit or credit card, net banking and wallets', online: true },
  { id: 'cod', title: 'Cash on delivery', desc: 'Pay in cash when your order is delivered', online: false },
];

const inputCls =
  'w-full bg-white border rounded-lg px-3.5 py-2.5 text-[14px] text-[#2B1E1A] placeholder:text-gray-400 focus:outline-none focus:border-[#6F241D] focus:ring-1 focus:ring-[#6F241D]/20';

const Field = ({ label, error, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-[12px] font-medium text-gray-700 mb-1">{label}</label>
    <input {...props} className={`${inputCls} ${error ? 'border-red-400' : 'border-[#DCCFC0]'}`} />
    {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
  </div>
);

// What the customer typed at checkout survives the trip to /login and back
// (and a page refresh), so logging in never wipes the address.
const DRAFT_KEY = 'jaipurio_checkout_draft';
const readDraft = () => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null') || {};
  } catch {
    return {};
  }
};
const writeDraft = (draft) => {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage blocked — the form just starts empty */
  }
};
const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
};

const Checkout = () => {
  usePageSeo({ title: 'Checkout', noindex: true });
  const { cart, cartTotal, clearCart, user, isAuthenticated } = useShop();
  const location = useLocation();
  const navigate = useNavigate();
  const [draft] = useState(readDraft);
  const appliedCoupon = location.state?.appliedCoupon || draft.appliedCoupon || null;
  const signedIn = isAuthenticated && !!getCustomerToken();

  const [step, setStep] = useState(1);
  // Pre-filled from the customer's own account only — never sample data.
  const [address, setAddress] = useState(() => {
    const saved = draft.address || {};
    return {
      fullName: saved.fullName || (signedIn ? user?.name || '' : ''),
      phone: saved.phone || (signedIn ? String(user?.mobile || user?.phone || '').replace(/\D/g, '').slice(-10) : ''),
      street: saved.street || '',
      city: saved.city || '',
      state: saved.state || '',
      pincode: saved.pincode || '',
      email: saved.email || (signedIn ? user?.email || '' : ''),
    };
  });
  useEffect(() => {
    writeDraft({ address, appliedCoupon });
  }, [address, appliedCoupon]);

  // Send the customer to the OTP login and bring them straight back here.
  const goToLogin = () => {
    writeDraft({ address, appliedCoupon });
    navigate('/login', { state: { from: '/checkout' } });
  };
  const [addressErrors, setAddressErrors] = useState({});

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [orderComplete, setOrderComplete] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [enabledMethodCodes, setEnabledMethodCodes] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    api.get('/payments/methods/public')
      .then((res) => setEnabledMethodCodes((res.data?.data || []).map((m) => m.code)))
      .catch(() => setEnabledMethodCodes(['cod', 'razorpay']));
  }, []);

  const codEnabled = enabledMethodCodes === null || enabledMethodCodes.includes('cod');
  // UPI / card / netbanking go through Cashfree when it is enabled, otherwise Razorpay.
  const onlineGateway = enabledMethodCodes?.includes('cashfree') ? 'cashfree' : 'razorpay';
  const onlineEnabled = enabledMethodCodes === null || enabledMethodCodes.includes(onlineGateway);

  useEffect(() => {
    if (enabledMethodCodes === null) return;
    if (paymentMethod === 'cod' && !codEnabled) setPaymentMethod(onlineEnabled ? 'online' : '');
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
      .then((res) => {
        if (cancelled) return;
        setQuote(res.data?.data || null);
        setQuoteError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(err.parsedMessage || err.response?.data?.message || 'Could not calculate the final price. Please refresh the page.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, appliedCoupon?.code, paymentMethod]);

  // Pincode → city and state (India Post data via our backend). The customer can still edit both.
  const [pincodeStatus, setPincodeStatus] = useState('');
  useEffect(() => {
    const pin = address.pincode;
    if (!/^[1-9]\d{5}$/.test(pin)) {
      setPincodeStatus('');
      return undefined;
    }
    let cancelled = false;
    setPincodeStatus('loading');
    api
      .get(`/shipping/pincode/${pin}`)
      .then((res) => {
        if (cancelled) return;
        const { city, state } = res.data?.data || {};
        setAddress((prev) => ({ ...prev, city: city || prev.city, state: state || prev.state }));
        setAddressErrors((prev) => ({ ...prev, city: null, state: null }));
        setPincodeStatus('found');
      })
      .catch((err) => !cancelled && setPincodeStatus(err.response?.status === 404 ? 'notfound' : ''));
    return () => {
      cancelled = true;
    };
  }, [address.pincode]);

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
    if (!signedIn) {
      goToLogin();
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const persistSuccess = (serverOrder) => {
    clearCart();
    clearDraft();
    setConfirmedOrder({
      ref: String(serverOrder?.orderNumber || serverOrder?.orderId || serverOrder?._id || ''),
      total: serverOrder?.totalPrice ?? grandTotal,
      paid: !!serverOrder?.isPaid,
    });
    setOrderComplete(true);
    window.scrollTo({ top: 0 });
  };

  // Back from a redirect-based Cashfree payment (/checkout?cf_order_id=…): confirm it with the server.
  useEffect(() => {
    const cfOrderId = new URLSearchParams(location.search).get('cf_order_id');
    if (!cfOrderId) return;
    const pending = takePendingCashfree();
    navigate('/checkout', { replace: true, state: location.state });
    if (!pending || pending.orderId !== cfOrderId) {
      setOrderError('We could not confirm your payment here. If money was deducted, check My Orders or contact support.');
      return;
    }
    setPlacing(true);
    api
      .post('/orders/cashfree/verify', { orderId: cfOrderId, orderDetails: pending.orderDetails })
      .then((res) => persistSuccess(res.data?.data?.order))
      .catch((err) => setOrderError(err.parsedMessage || err.message || 'Payment could not be verified.'))
      .finally(() => setPlacing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlaceOrder = async () => {
    setOrderError('');

    const token = await ensureCustomerAuth();
    if (!token) {
      setOrderError('Please log in to complete your order.');
      goToLogin();
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

      if (onlineGateway === 'cashfree') {
        const cfRes = await api.post('/orders/cashfree/create', {
          items,
          couponCode,
          customer: { name: address.fullName, email: address.email, phone: address.phone },
        });
        const { order: cashfreeOrder, mode } = cfRes.data?.data || {};
        const orderDetails = { items, shippingAddress, couponCode, referralCode };
        savePendingCashfree({ orderId: cashfreeOrder?.id, orderDetails });
        const { orderId } = await payWithCashfree({ cashfreeOrder, mode });
        const verifyRes = await api.post('/orders/cashfree/verify', { orderId, orderDetails });
        takePendingCashfree();
        persistSuccess(verifyRes.data?.data?.order);
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
      } else if (/cancel/i.test(err.message || '') && !err.response) {
        setOrderError('Payment was cancelled. You have not been charged. You can try again.');
      } else {
        setOrderError(err.parsedMessage || err.message || 'Could not place order. Please try again.');
      }
    } finally {
      setPlacing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] py-10 sm:py-16 px-4 pb-24 font-sans">
        <div className="max-w-md mx-auto bg-white border border-[#EADFD3] rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#EEF4EC] flex items-center justify-center mx-auto mb-4 text-[#2F6B3A]">
            <CheckCircle size={28} />
          </div>
          <h1 className="font-sans text-xl sm:text-2xl font-semibold text-[#2B1E1A]">Order placed</h1>
          <p className="text-[13px] text-gray-600 mt-2 mb-6">
            Thank you for your order. You can track it any time from My Orders.
          </p>

          <PushPermissionPrompt
            role="user"
            title="Get updates for this order?"
            text="We'll notify you when it ships and is delivered."
            className="mb-5 text-left"
          />

          <div className="border border-[#EADFD3] rounded-xl p-4 text-left space-y-2.5 mb-6 text-[13px] text-[#2B1E1A]">
            {confirmedOrder?.ref && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Order number</span>
                <span className="font-semibold break-all text-right">{confirmedOrder.ref}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">{confirmedOrder?.paid ? 'Amount paid' : 'Amount to pay on delivery'}</span>
              <span className="font-semibold">{inr(confirmedOrder?.total)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Payment</span>
              <span className="font-semibold">{confirmedOrder?.paid ? 'Paid online' : 'Cash on delivery'}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link to="/orders" className="w-full inline-block bg-[#6F241D] hover:bg-[#5A1D17] text-white py-3 rounded-lg text-[13px] font-semibold transition-colors">
              View my orders
            </Link>
            <Link to="/shop" className="w-full inline-block bg-white border border-[#D9C9B6] text-[#2B1E1A] hover:bg-[#FAF8F5] py-3 rounded-lg text-[13px] font-semibold transition-colors">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] py-16 px-4 text-center font-sans">
        <div className="max-w-md mx-auto bg-white border border-[#EADFD3] rounded-2xl p-8">
          <h2 className="font-sans text-lg font-semibold text-[#2B1E1A]">Your bag is empty</h2>
          <p className="text-[13px] text-gray-600 mt-1 mb-6">Add products to your bag to check out.</p>
          <Link to="/shop" className="inline-block bg-[#6F241D] text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#5A1D17]">
            Browse products
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
  // Server-priced lines when available, so the review shows exactly what will be charged.
  const reviewItems = quote?.items?.length
    ? quote.items.map((i, idx) => ({ key: `${i.product}-${i.size || ''}-${idx}`, name: i.name, image: i.image, quantity: i.quantity, price: i.price, lineTotal: i.lineTotal }))
    : cart.map((i) => ({ key: i._id, name: i.name, image: i.image, quantity: i.quantity, price: i.price, lineTotal: i.price * i.quantity }));
  const itemCount = reviewItems.reduce((n, i) => n + Number(i.quantity || 0), 0);

  const cardCls = 'bg-white border border-[#EADFD3] rounded-2xl p-4 sm:p-6';
  const titleCls = 'font-sans text-[15px] sm:text-base font-semibold text-[#2B1E1A]';
  const primaryBtn = 'w-full sm:w-auto bg-[#6F241D] hover:bg-[#5A1D17] disabled:opacity-50 text-white px-6 py-3 rounded-lg text-[13px] font-semibold transition-colors';
  const linkBtn = 'text-[13px] font-medium text-gray-600 hover:text-[#2B1E1A] py-2';

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-4 sm:py-8 pb-28 sm:pb-14 overflow-x-hidden font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-[#EADFD3]">
          <Link to="/shop" className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600 hover:text-[#2B1E1A] shrink-0">
            <ArrowLeft size={15} />
            <span>Shop</span>
          </Link>
          <h1 className="font-sans text-base sm:text-lg font-semibold text-[#2B1E1A] truncate">Checkout</h1>
          <span className="text-[12px] text-gray-500 font-medium shrink-0">Secure checkout</span>
        </div>

        {/* Steps */}
        <ol className="flex items-center justify-center gap-2 sm:gap-3 mb-6 text-[12px] sm:text-[13px]">
          {steps.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <React.Fragment key={label}>
                <li className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                      active || done ? 'bg-[#6F241D] text-white' : 'bg-[#EFE7DD] text-gray-500'
                    }`}
                  >
                    {n}
                  </span>
                  <span className={active ? 'font-semibold text-[#2B1E1A]' : 'text-gray-500'}>{label}</span>
                </li>
                {i < steps.length - 1 && <li aria-hidden className={`h-px w-6 sm:w-12 ${done ? 'bg-[#6F241D]' : 'bg-[#E2D6C8]'}`} />}
              </React.Fragment>
            );
          })}
        </ol>

        {!signedIn && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#6F241D]/20 bg-[#FCF8F2] px-4 py-3">
            <div className="text-[13px] text-gray-700">
              <p className="font-semibold text-[#2B1E1A]">Log in with your mobile number to check out</p>
              <p className="text-[12px] text-gray-500">Quick OTP login, no password. Your address and bag are kept.</p>
            </div>
            <button type="button" onClick={goToLogin} className="rounded-full bg-[#6F241D] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#873A24]">
              Log in / Sign up
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Step 1: Address */}
            {step === 1 && (
              <div className={`${cardCls} space-y-4`}>
                <h2 className={titleCls}>Shipping address</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Field label="Full name" value={address.fullName} onChange={setField('fullName')} error={addressErrors.fullName} autoComplete="name" />
                  <Field label="Mobile number" value={address.phone} onChange={setField('phone')} error={addressErrors.phone} inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile number" />
                  <Field label="House no., street, area" className="sm:col-span-2" value={address.street} onChange={setField('street')} error={addressErrors.street} autoComplete="street-address" />
                  <div>
                    <Field label="Pincode" value={address.pincode} onChange={setField('pincode')} error={addressErrors.pincode} inputMode="numeric" autoComplete="postal-code" placeholder="6-digit pincode" />
                    {!addressErrors.pincode && pincodeStatus === 'loading' && <p className="mt-1 text-[11px] text-gray-500">Finding your city…</p>}
                    {!addressErrors.pincode && pincodeStatus === 'notfound' && <p className="mt-1 text-[11px] text-amber-700">Pincode not found. Please enter city and state.</p>}
                  </div>
                  <Field label="City" value={address.city} onChange={setField('city')} error={addressErrors.city} autoComplete="address-level2" />
                  <Field label="State" value={address.state} onChange={setField('state')} error={addressErrors.state} autoComplete="address-level1" />
                  <Field label="Email (optional, for order updates)" type="email" value={address.email} onChange={setField('email')} error={addressErrors.email} autoComplete="email" />
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="button" onClick={goToPayment} className={primaryBtn}>
                    {signedIn ? 'Continue to payment' : 'Log in & continue'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className={`${cardCls} space-y-4`}>
                <h2 className={titleCls}>Payment method</h2>

                <div className="space-y-3">
                  {PAYMENT_OPTIONS.filter((method) => (method.online ? onlineEnabled : codEnabled)).map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        paymentMethod === method.id ? 'border-[#6F241D] bg-[#FBF7F3]' : 'border-[#EADFD3] bg-white hover:border-[#CDBBA6]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="accent-[#6F241D] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#2B1E1A]">{method.title}</p>
                        <p className="text-[12px] text-gray-500">
                          {method.desc}
                          {method.id === 'cod' && codFee > 0 ? ` · ${inr(codFee)} cash on delivery fee` : ''}
                        </p>
                      </div>
                    </label>
                  ))}
                  {!onlineEnabled && !codEnabled && enabledMethodCodes !== null && (
                    <p className="text-[13px] text-red-600">No payment method is available right now. Please try again later.</p>
                  )}
                </div>

                <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between sm:items-center">
                  <button type="button" onClick={() => setStep(1)} className={linkBtn}>
                    Back to address
                  </button>
                  <button type="button" onClick={() => setStep(3)} disabled={!paymentMethod} className={primaryBtn}>
                    Review order
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Place */}
            {step === 3 && (
              <div className={`${cardCls} space-y-5`}>
                <h2 className={titleCls}>Review your order</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] border border-[#EADFD3] rounded-xl p-4">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Deliver to</span>
                      <button type="button" onClick={() => setStep(1)} className="text-[12px] font-semibold text-[#6F241D]">Change</button>
                    </div>
                    <p className="font-semibold text-[#2B1E1A] mt-1 break-words">{address.fullName}</p>
                    <p className="text-gray-600 break-words">{address.street}, {address.city}, {address.state} {address.pincode}</p>
                    <p className="text-gray-600">+91 {address.phone}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Payment</span>
                      <button type="button" onClick={() => setStep(2)} className="text-[12px] font-semibold text-[#6F241D]">Change</button>
                    </div>
                    <p className="font-semibold text-[#2B1E1A] mt-1">{paymentLabel}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[12px] font-medium uppercase tracking-wide text-gray-500">Items ({itemCount})</p>
                  {reviewItems.map((item) => (
                    <div key={item.key} className="flex items-center gap-3 p-3 rounded-xl border border-[#EADFD3]">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-white border border-[#F0E8DE] shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-[#F3EEE8] shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#2B1E1A] line-clamp-2 leading-snug">{item.name}</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Qty {item.quantity} × {inr(item.price)}</p>
                      </div>
                      <span className="text-[13px] font-semibold text-[#2B1E1A] shrink-0">{inr(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                {orderError && (
                  <p role="alert" className="text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{orderError}</p>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between sm:items-center">
                  <button type="button" onClick={() => setStep(2)} className={linkBtn}>
                    Back to payment
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing || !quote}
                    type="button"
                    className={`${primaryBtn} sm:px-8 inline-flex items-center justify-center gap-2`}
                  >
                    {placing && <Loader2 size={15} className="animate-spin" />}
                    {placing ? 'Processing…' : paymentMethod === 'cod' ? `Place order · ${inr(grandTotal)}` : `Pay ${inr(grandTotal)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-4 min-w-0">
            <div className={`${cardCls} space-y-4 lg:sticky lg:top-4`}>
              <h2 className={titleCls}>Order summary</h2>

              <div className="space-y-2.5 text-[13px] text-[#2B1E1A]">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Items ({itemCount})</span>
                  <span>{inr(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between gap-3 text-[#2F6B3A]">
                    <span>Coupon{appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}</span>
                    <span>−{inr(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Shipping</span>
                  <span>{quote ? (shippingCost === 0 ? 'Free' : inr(shippingCost)) : '—'}</span>
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Cash on delivery fee</span>
                    <span>{inr(codFee)}</span>
                  </div>
                )}
                <hr className="border-[#EADFD3]" />
                <div className="flex justify-between gap-3 text-[15px] font-semibold">
                  <span>Total</span>
                  <span>{inr(grandTotal)}</span>
                </div>
                {quote?.taxAmount > 0 && <p className="text-[11px] text-gray-500 text-right">Inclusive of {inr(quote.taxAmount)} GST</p>}
                {!quote && !quoteError && <p className="text-[11px] text-gray-500">Calculating final price…</p>}
                {quoteError && <p className="text-[12px] text-red-700">{quoteError}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
