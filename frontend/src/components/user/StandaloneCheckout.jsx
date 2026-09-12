import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiChevronDown,
  FiCheck,
  FiShoppingBag,
  FiTag,
  FiLock,
  FiMinus,
  FiPlus
} from 'react-icons/fi';

export const StandaloneCheckout = () => {
  const { token, id } = useParams();
  const navigate = useNavigate();

  // Cart item state for incomplete order #395 / token bc40dd9c7b6b8a014ad9ae2735b8c468
  const [quantity, setQuantity] = useState(2);
  const unitPrice = 89000;
  const subtotal = unitPrice * quantity;
  const shippingFee = 0;
  const tax = 0;
  const total = subtotal + shippingFee + tax;

  // Coupon
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [registerAccount, setRegisterAccount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderNotes, setOrderNotes] = useState('');
  const [requiresCompanyInvoice, setRequiresCompanyInvoice] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Success state
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim()) {
      setCouponApplied(true);
    }
  };

  const handleSubmitCheckout = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-slate-800">Order Placed Successfully!</h2>
          <p className="text-xs text-slate-500">
            Thank you for your order. We have received your order details and will process it shortly.
          </p>
          <div className="bg-slate-50 p-3 rounded-md text-xs text-slate-700 font-mono">
            Order Reference: #ORD-REC-{Date.now().toString().slice(-6)}
          </div>
          <button
            onClick={() => navigate('/home')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md transition"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 font-sans text-xs">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ========================================================================= */}
          {/* LEFT / MAIN COLUMN: Customer, Shipping & Payment (7 cols)                 */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
            {/* Header Logo */}
            <div className="pb-4 border-b border-slate-200">
              <Link to="/home" className="inline-block">
                <span className="font-serif font-black text-2xl tracking-wider text-[#3F261B]">
                  JAIPURIO
                </span>
                <span className="block text-[10px] uppercase tracking-widest text-[#806653]">
                  Premier Marketplace for Handmade Rajasthani Crafts
                </span>
              </Link>
            </div>

            {/* Section: Shipping information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Shipping information</h2>
                <div className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                    Login
                  </Link>
                </div>
              </div>

              <form onSubmit={handleSubmitCheckout} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your mobile number"
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="India">India</option>
                      <option value="United States of America">United States of America</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Select / enter state..."
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Select / enter city..."
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House / Street / Area"
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Zip code</label>
                    <input
                      type="text"
                      required
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="e.g. 302001"
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={registerAccount}
                      onChange={(e) => setRegisterAccount(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Register an account with above information?</span>
                  </label>
                </div>

                {/* Section: Payment Method */}
                <div className="pt-6 space-y-3">
                  <h3 className="text-base font-bold text-slate-900">Payment method</h3>
                  <div className="space-y-2 border border-slate-200 rounded-md overflow-hidden bg-white">
                    <label className="flex items-start gap-3 p-3.5 cursor-pointer hover:bg-slate-50 transition border-b border-slate-100">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-xs">
                          Cash on delivery (COD)
                        </div>
                        {paymentMethod === 'cod' && (
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            Please pay money directly to the postman, if you choose cash on delivery
                            method (COD).
                          </p>
                        )}
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 cursor-pointer hover:bg-slate-50 transition border-b border-slate-100">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-xs">Bank transfer</div>
                        {paymentMethod === 'bank' && (
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            Make your payment directly into our bank account. Please use your Order ID as
                            the payment reference.
                          </p>
                        )}
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={() => setPaymentMethod('online')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-xs">
                          Online Payment (Razorpay / UPI / Cards / Netbanking)
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Section: Order Notes */}
                <div className="pt-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Order notes
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Notes about your order, e.g. special notes for delivery."
                    className="w-full border border-slate-300 rounded-md p-2.5 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Company Invoice checkbox */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={requiresCompanyInvoice}
                      onChange={(e) => setRequiresCompanyInvoice(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>
                      Requires company invoice (Please fill in your company information to receive the
                      invoice)?
                    </span>
                  </label>
                </div>

                {/* Terms Agreement */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                    <input
                      type="checkbox"
                      required
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>
                      I agree to the{' '}
                      <Link
                        to="/terms-conditions"
                        target="_blank"
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Terms and Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                {/* Action buttons */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
                  <Link
                    to="/shop"
                    className="flex items-center gap-1.5 text-blue-600 hover:underline font-semibold text-xs"
                  >
                    <FiArrowLeft size={14} />
                    <span>Back to cart</span>
                  </Link>

                  <button
                    type="submit"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-md shadow-md transition hover:shadow-lg flex items-center gap-2"
                  >
                    <FiLock size={13} />
                    <span>Checkout</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Order Items, Summary & Coupon (5 cols)                      */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5 order-1 lg:order-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-3">Product(s):</h3>

              {/* Product Item Card */}
              <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
                <div className="relative w-16 h-16 rounded-md border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src="/planter.png"
                    alt="Poshak"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute -top-1.5 -right-1.5 bg-slate-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {quantity}
                  </span>
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 text-xs leading-snug line-clamp-2">
                    Yellow Chanderi Work Rajputi Poshak Set (Unstitched) | Real Silver Work, Pure Satin
                    Fabric | Jaipurio Ethnic Wear
                  </h4>

                  {/* Quantity control */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center border border-slate-300 rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600"
                      >
                        <FiMinus size={10} />
                      </button>
                      <span className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600"
                      >
                        <FiPlus size={10} />
                      </button>
                    </div>

                    <span className="font-bold text-slate-900 text-xs ml-auto">
                      ₹{unitPrice.toLocaleString('en-IN')}.0
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="space-y-1">
              <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Shipping method:
              </h5>
              <p className="text-[11px] text-slate-500">Fetching shipping options...</p>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">
                  ₹{subtotal.toLocaleString('en-IN')}.0
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span className="font-semibold text-slate-900">₹0.0</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping fee:</span>
                <span className="font-semibold text-slate-900">₹0.0</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-sm font-bold text-slate-900">
                <span>Total:</span>
                <span className="text-blue-600 text-base">₹{total.toLocaleString('en-IN')}.0</span>
              </div>
            </div>

            {/* Coupon Code Accordion */}
            <div className="pt-2">
              {!showCoupon ? (
                <button
                  type="button"
                  onClick={() => setShowCoupon(true)}
                  className="text-blue-600 hover:underline flex items-center gap-1.5 font-medium text-xs"
                >
                  <FiTag size={13} />
                  <span>You have a coupon code?</span>
                </button>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-md text-xs"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponApplied && (
                <p className="text-[11px] text-emerald-600 font-medium mt-1.5">
                  Coupon "{couponCode}" applied successfully!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandaloneCheckout;
