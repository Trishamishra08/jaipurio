import React, { useEffect, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import ProductCard from './ProductCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { mapApiProductToStorefront } from '../../utils/storefrontProduct';

const Wishlist = () => {
  const { wishlist, wishlistAddedAt } = useShop();
  const [wishProducts, setWishProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wishlist.length) {
      setWishProducts([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get('/products', { params: { ids: wishlist.join(',') } })
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data?.data?.products || []).map(mapApiProductToStorefront).filter(Boolean);
        // Keep wishlist order rather than whatever order the server returns.
        const byId = new Map(rows.map((p) => [String(p._id), p]));
        // Newest saved first.
        setWishProducts([...wishlist].reverse().map((id) => byId.get(String(id))).filter(Boolean));
      })
      .catch(() => {
        if (!cancelled) setWishProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wishlist]);

  // Items saved today, then everything saved before — each stays until the customer removes it.
  const todayKey = new Date().toDateString();
  const savedToday = (p) => {
    const at = wishlistAddedAt?.[p._id];
    return !!at && new Date(at).toDateString() === todayKey;
  };
  const today = wishProducts.filter(savedToday);
  const earlier = wishProducts.filter((p) => !savedToday(p));

  const Group = ({ title, items }) =>
    items.length > 0 && (
      <section className="mb-8">
        <h2 className="text-sm font-bold text-[#6F241D] mb-3">
          {title} <span className="font-medium text-[#A8977F]">({items.length})</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((prod) => (
            <ProductCard key={prod._id} product={prod} />
          ))}
        </div>
      </section>
    );

  return (
    <div className="min-h-screen bg-white py-6 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="border-b border-[#E8D4B5] pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Heart className="fill-[#6F241D] text-[#6F241D]" size={24} />
            <h1
              className="text-2xl sm:text-3xl font-black text-[#6F241D]"
            >
              My Wishlist ({wishProducts.length})
            </h1>
          </div>
          <p className="text-xs text-[#70452F] mt-1">Everything you saved stays here until you remove it.</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm text-[#70452F]">Loading your wishlist…</div>
        ) : wishProducts.length === 0 ? (
          <div className="text-center py-16 bg-[#FCF8F2] rounded-3xl border border-[#E8D4B5] p-8">
            <span className="text-4xl">❤️</span>
            <h3 className="font-serif font-bold text-lg text-[#6F241D] mt-3">Your Wishlist is Empty</h3>
            <p className="text-xs text-[#70452F] mt-1 mb-6">Tap the heart icon on any craft to save it here.</p>
            <Link
              to="/shop"
              className="bg-[#6F241D] text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#873A24]"
            >
              Explore Jaipur Bazaar
            </Link>
          </div>
        ) : (
          <>
            <Group title="Added today" items={today} />
            <Group title={today.length ? 'Saved earlier' : 'Saved items'} items={earlier} />
            <p className="text-[11px] text-[#A8977F] text-center">Tap the heart on a product to remove it from your wishlist.</p>
          </>
        )}

      </div>
    </div>
  );
};

export default Wishlist;
