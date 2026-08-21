import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { 
  CheckCircle, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Truck, 
  ArrowLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const Checkout = () => {
  const { cart, cartTotal, clearCart, addOrder } = useShop();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState({
    fullName: 'Padharo Sa',
    phone: '+91 98290 12345',
    street: 'Haveli 12, Johari Bazaar',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302003'
  });

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [orderComplete, setOrderComplete] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  const shippingCost = cartTotal > 499 ? 0 : 50;
  const grandTotal = cartTotal + shippingCost;

  const handlePlaceOrder = () => {
    const newOrd = addOrder({
      shippingAddress: `${address.fullName}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode} (${address.phone})`,
      paymentMethod
    });
    setConfirmedOrderId(newOrd.id);
    setOrderComplete(true);
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="max-w-md mx-auto bg-[#FCF8F2] border-2 border-[#C69A45] rounded-3xl p-8 text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-[#82977A]/20 border-2 border-[#354B35] flex items-center justify-center mx-auto mb-4 text-[#354B35]">
            <CheckCircle size={40} />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-[#A94E2C]">Khammaghani! Order Placed</span>
          <h1 
            className="text-2xl sm:text-3xl font-black text-[#6F241D] mt-1"
          >
            Dhanyawad Sa!
          </h1>
          <p className="text-xs text-[#70452F] mt-2 mb-6">
            Your authentic Rajasthani handicraft order has been received by our Jaipur master potters.
          </p>

          <div className="bg-[#FAF4EA] border border-[#E8D4B5] rounded-2xl p-4 text-left space-y-2 mb-6 text-xs text-[#2B1E1A]">
            <div className="flex justify-between">
              <span className="text-gray-500">Order Reference:</span>
              <span className="font-bold text-[#6F241D]">{confirmedOrderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="font-bold text-[#354B35]">₹{grandTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fragile Packaging:</span>
              <span className="font-bold text-[#A94E2C]">Standard Ceramic Box</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/orders"
              className="w-full inline-block bg-[#6F241D] hover:bg-[#873A24] text-white py-3 rounded-full text-xs font-bold transition-all shadow-md"
            >
              Track Order Status
            </Link>
            <Link
              to="/shop"
              className="w-full inline-block bg-white border border-[#A94E2C] text-[#A94E2C] hover:bg-[#FAF4EA] py-3 rounded-full text-xs font-bold transition-all"
            >
              Continue Shopping Bazaar
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
          <h2 className="text-xl font-bold font-serif text-[#6F241D] mt-3">Your Mitti Bag is Empty</h2>
          <p className="text-xs text-[#70452F] mt-1 mb-6">Explore authentic matkas, kulhads, and decor from Jaipur.</p>
          <Link
            to="/shop"
            className="bg-[#6F241D] text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#873A24]"
          >
            Explore Handicrafts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 pb-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Checkout Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E8D4B5]">
          <Link to="/shop" className="flex items-center gap-1.5 text-xs font-bold text-[#70452F] hover:text-[#6F241D]">
            <ArrowLeft size={14} />
            <span>Return to Bazaar</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏺</span>
            <span className="font-serif font-black text-xl text-[#6F241D]">Jaipur Mitti Checkout</span>
          </div>
          <span className="text-xs text-[#354B35] font-bold hidden sm:inline">🌸 100% Secure Checkout</span>
        </div>

        {/* Steps Breadcrumb Bar */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 sm:gap-6 text-xs font-bold">
            <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-[#6F241D] text-white' : 'bg-white text-gray-400'}`}>
              1. Address
            </span>
            <ChevronRight size={14} className="text-gray-400" />
            <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-[#6F241D] text-white' : 'bg-white text-gray-400'}`}>
              2. Payment UI
            </span>
            <ChevronRight size={14} className="text-gray-400" />
            <span className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-[#6F241D] text-white' : 'bg-white text-gray-400'}`}>
              3. Review Order
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Checkout Form Box */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Address */}
            {step === 1 && (
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="text-[#A94E2C]" size={20} />
                  <h3 className="font-serif font-bold text-lg text-[#6F241D]">Shipping Address in India</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Full Name</label>
                    <input 
                      type="text"
                      value={address.fullName}
                      onChange={e => setAddress({...address, fullName: e.target.value})}
                      className="w-full bg-white border border-[#E8D4B5] rounded-xl px-3.5 py-2.5 text-[#2B1E1A] focus:outline-none focus:border-[#A94E2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Mobile Phone (for delivery updates)</label>
                    <input 
                      type="text"
                      value={address.phone}
                      onChange={e => setAddress({...address, phone: e.target.value})}
                      className="w-full bg-white border border-[#E8D4B5] rounded-xl px-3.5 py-2.5 text-[#2B1E1A] focus:outline-none focus:border-[#A94E2C]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-600 font-semibold mb-1">Street Address / Haveli / House No.</label>
                    <input 
                      type="text"
                      value={address.street}
                      onChange={e => setAddress({...address, street: e.target.value})}
                      className="w-full bg-white border border-[#E8D4B5] rounded-xl px-3.5 py-2.5 text-[#2B1E1A] focus:outline-none focus:border-[#A94E2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">City</label>
                    <input 
                      type="text"
                      value={address.city}
                      onChange={e => setAddress({...address, city: e.target.value})}
                      className="w-full bg-white border border-[#E8D4B5] rounded-xl px-3.5 py-2.5 text-[#2B1E1A] focus:outline-none focus:border-[#A94E2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Pincode</label>
                    <input 
                      type="text"
                      value={address.pincode}
                      onChange={e => setAddress({...address, pincode: e.target.value})}
                      className="w-full bg-white border border-[#E8D4B5] rounded-xl px-3.5 py-2.5 text-[#2B1E1A] focus:outline-none focus:border-[#A94E2C]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-[#6F241D] hover:bg-[#873A24] text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all"
                  >
                    Proceed to Payment Method →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment UI */}
            {step === 2 && (
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="text-[#A94E2C]" size={20} />
                  <h3 className="font-serif font-bold text-lg text-[#6F241D]">Select Payment Method</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'upi', title: 'UPI (GPay / PhonePe / Paytm / QR)', desc: 'Instant verification with zero transaction fee' },
                    { id: 'card', title: 'Debit / Credit Card', desc: 'Visa, MasterCard, RuPay cards accepted' },
                    { id: 'netbanking', title: 'Net Banking', desc: 'All major Indian public & private banks' },
                    { id: 'cod', title: 'Cash on Delivery', desc: 'Pay safely upon doorstep delivery' },
                  ].map(method => (
                    <label 
                      key={method.id}
                      className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === method.id 
                          ? 'bg-[#FAF4EA] border-2 border-[#A94E2C]' 
                          : 'bg-white border-[#E8D4B5] hover:border-gray-300'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="accent-[#A94E2C]"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#6F241D]">{method.title}</h4>
                        <p className="text-[10px] text-gray-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-[#70452F] hover:underline"
                  >
                    ← Back to Address
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="bg-[#6F241D] hover:bg-[#873A24] text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all"
                  >
                    Review Order Summary →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review Order & Place */}
            {step === 3 && (
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-6 sm:p-8 space-y-6">
                <h3 className="font-serif font-bold text-lg text-[#6F241D]">Confirm & Place Your Order</h3>

                {/* Address & Payment summary pill */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF4EA] p-4 rounded-2xl border border-[#E8D4B5]">
                  <div>
                    <span className="text-gray-400 text-[10px] font-bold uppercase">Deliver To</span>
                    <p className="font-bold text-[#6F241D] mt-0.5">{address.fullName} ({address.phone})</p>
                    <p className="text-gray-600">{address.street}, {address.city}, {address.state} - {address.pincode}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] font-bold uppercase">Payment Choice</span>
                    <p className="font-bold text-[#6F241D] mt-0.5 uppercase">{paymentMethod}</p>
                    <p className="text-gray-600">Standard Fragile-Care Ceramic Shipping</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#70452F] uppercase tracking-wider">Ordered Items ({cart.length})</h4>
                  {cart.map(item => (
                    <div key={item._id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E8D4B5]">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-[#2B1E1A] truncate">{item.name}</h5>
                        <span className="text-[10px] text-gray-500">Qty: {item.quantity} • ₹{item.price} each</span>
                      </div>
                      <span className="text-xs font-bold text-[#6F241D]">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-[#70452F] hover:underline"
                  >
                    ← Edit Payment
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    className="bg-[#354B35] hover:bg-[#202E20] text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-wider shadow-lg transition-all"
                  >
                    Confirm & Place Order (₹{grandTotal})
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Summary Column */}
          <div className="space-y-4">
            <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="font-serif font-bold text-base text-[#6F241D]">Order Cost Breakdown</h4>

              <div className="space-y-2 text-xs text-[#2B1E1A]">
                <div className="flex justify-between">
                  <span>Cart Items Subtotal:</span>
                  <span className="font-semibold">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fragile Courier Shipping:</span>
                  <span className="font-semibold text-[#354B35]">{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Artisan Support Donation:</span>
                  <span className="font-semibold text-gray-400">₹0 (Included)</span>
                </div>
                <hr className="border-[#E8D4B5]" />
                <div className="flex justify-between text-sm font-extrabold text-[#6F241D]">
                  <span>Total Amount:</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              <div className="p-3 bg-[#FAF4EA] border border-[#C69A45]/40 rounded-xl text-center text-[11px] text-[#70452F]">
                <span>🌸 Shipped safely in foam-cushioned wooden crates.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Checkout;
