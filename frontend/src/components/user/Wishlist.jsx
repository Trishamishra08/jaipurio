import React, { useEffect, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import ProductCard from './ProductCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { mapApiProductToStorefront } from '../../utils/storefrontProduct';

const Wishlist = () => {
  const { wishlist } = useShop();
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
        setWishProducts(wishlist.map((id) => byId.get(String(id))).filter(Boolean));
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

  return (
    <div className="min-h-screen bg-white py-6 pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="border-b border-[#E8D4B5] pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Heart className="fill-[#6F241D] text-[#6F241D]" size={24} />
            <h1
              className="text-2xl sm:text-3xl font-black text-[#6F241D]"
            >
              My Saved Handicrafts ({wishProducts.length})
            </h1>
          </div>
          <p className="text-xs text-[#70452F] mt-1">Pottery and Rajasthani folk artifacts you loved.</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishProducts.map(prod => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Wishlist;
