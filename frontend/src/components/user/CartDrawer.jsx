import React from 'react';
import { useShop } from '../../context/ShopContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const cartItemKey = (item) => String(item?._id ?? item?.id ?? '');

const CartDrawer = () => {
  const {
    cart,
    cartTotal,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
  } = useShop();

  const navigate = useNavigate();

  if (!isCartDrawerOpen) return null;

  const handleCheckout = () => {
    setIsCartDrawerOpen(false);
    navigate('/checkout');
  };

  const handleRemove = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const key = cartItemKey(item);
    if (key) removeFromCart(key);
  };

  const handleQty = (e, item, delta) => {
    e.preventDefault();
    e.stopPropagation();
    const key = cartItemKey(item);
    if (key) updateQuantity(key, delta);
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close bag"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-12 sm:pl-16">
        <div className="w-screen max-w-sm bg-white border-l border-[#E8E2D9] shadow-2xl flex flex-col h-full">
          <div className="px-3.5 py-2.5 bg-[#6F241D] text-white flex items-center justify-between shrink-0">
            <h2 className="font-playfair font-semibold text-base text-white">
              Your Mitti Bag ({cart.length})
            </h2>
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1 rounded-full text-white/90 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2 bg-white">
            {cart.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <ShoppingBag size={36} className="mx-auto text-[#A94E2C]/40" />
                <h3 className="font-playfair font-semibold text-sm text-[#3F261B]">Your Bag is Empty</h3>
                <p className="font-dm text-[11px] text-[#806653]">
                  Discover authentic Rajasthani pottery.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="mt-1 bg-[#6F241D] text-white px-4 py-1.5 rounded-full font-dm text-[11px] font-semibold"
                >
                  Browse Pottery
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const key = cartItemKey(item);
                return (
                  <div
                    key={key}
                    className="flex gap-2.5 bg-white border border-[#E8E2D9] rounded-xl p-2 items-center"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-[#EFEAE3] shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-dm text-[11px] font-semibold text-[#3F261B] truncate leading-tight">
                        {item.name}
                      </h4>
                      <p className="font-dm text-[9px] text-[#9A8B7A] truncate">{item.vendor}</p>
                      <span className="font-dm text-[11px] font-bold text-[#6F241D]">
                        ₹{item.price}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleRemove(e, item)}
                        className="p-1 text-[#9A8B7A] hover:text-[#8B2E1E] active:text-[#6F241D] transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={14} strokeWidth={2.2} />
                      </button>

                      <div className="flex items-center border border-[#D9D0C4] rounded-full bg-white px-1 py-0.5">
                        <button
                          type="button"
                          onClick={(e) => handleQty(e, item, -1)}
                          className="p-0.5 text-[#6F241D]"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-1.5 font-dm text-[11px] font-bold text-[#3F261B] min-w-[1rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleQty(e, item, 1)}
                          className="p-0.5 text-[#6F241D]"
                          aria-label="Increase quantity"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {cart.length > 0 && (
            <div className="px-3.5 py-3 bg-white border-t border-[#E8E2D9] space-y-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between">
                <span className="font-dm text-[12px] font-medium text-[#806653]">Subtotal</span>
                <span className="font-dm text-base font-bold text-[#6F241D]">₹{cartTotal}</span>
              </div>
              <p className="font-dm text-[9px] text-[#9A8B7A]">
                Shipping & taxes calculated at checkout.
              </p>
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full bg-[#6F241D] hover:bg-[#873A24] text-white py-2.5 rounded-xl font-dm text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
