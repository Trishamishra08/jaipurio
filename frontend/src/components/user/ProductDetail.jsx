import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { 
  Heart, 
  Star, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  MapPin, 
  ShoppingBag, 
  Minus, 
  Plus, 
  CheckCircle,
  Store,
  ChevronRight
} from 'lucide-react';
import ProductCard from './ProductCard';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, vendors, addToCart, toggleWishlist, isInWishlist, setIsCartDrawerOpen } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  const product = products.find(p => p._id === id) || products[0];
  const vendor = vendors.find(v => v._id === product.vendorId) || vendors[0];
  const isLiked = isInWishlist(product._id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToast(true);
    setIsCartDrawerOpen?.(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const relatedProducts = products.filter(p => p._id !== product._id).slice(0, 4);

  return (
    <div className="min-h-screen bg-white py-4 sm:py-8 pb-14">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 font-dm text-[10px] text-[#806653] mb-4">
          <Link to="/home" className="hover:text-[#6F241D]">Home</Link>
          <ChevronRight size={11} />
          <Link to="/shop" className="hover:text-[#6F241D]">Bazaar</Link>
          <ChevronRight size={11} />
          <span className="text-[#8B2E1E] font-medium truncate max-w-[180px]">{product.name}</span>
        </div>

        {/* Product Main Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-10 bg-white border border-[#E8E2D9] rounded-xl p-3 sm:p-6 shadow-sm">
          
          {/* Left: Product Images / Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#F5F5F4] border border-[#E8E2D9]">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => toggleWishlist(product)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-[#6F241D] hover:scale-105 transition-transform"
              >
                <Heart size={18} className={isLiked ? "fill-[#6F241D] text-[#6F241D]" : "text-[#5B4638]"} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[product.image, product.image, product.image, product.image].map((img, i) => (
                <div key={i} className="aspect-square rounded-md overflow-hidden border border-[#E8E2D9] bg-white">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product Details & Purchase Actions */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#6F241D]/8 text-[#6F241D] px-2.5 py-1 rounded-full font-dm text-[10px] font-semibold mb-2">
                100% Authentic Rajasthani Mitti
              </div>

              <h1 className="font-playfair font-semibold text-xl sm:text-2xl text-[#3F261B] leading-snug">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-[#F7F3EE] border border-[#E8E2D9] px-2 py-0.5 rounded-md font-dm text-[11px] font-medium text-[#5B4638]">
                  <Star size={12} className="fill-[#C69A45] text-[#C69A45]" />
                  <span>{product.rating}</span>
                </div>
                <span className="font-dm text-[11px] text-[#806653]">({product.reviews} reviews)</span>
              </div>

              <div className="flex items-baseline gap-2 mt-3">
                <span className="font-dm font-bold text-2xl text-[#8B2E1E]">₹{product.price}</span>
                {product.oldPrice && (
                  <span className="font-dm text-sm text-[#A89888] line-through">₹{product.oldPrice}</span>
                )}
                {product.oldPrice && (
                  <span className="font-dm text-[10px] font-semibold text-[#354B35] bg-[#E8F0E4] px-1.5 py-0.5 rounded">
                    Save {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                  </span>
                )}
              </div>

              <p className="font-dm text-[12px] sm:text-sm text-[#5B4638] mt-3 leading-relaxed">
                {product.description}
              </p>

              <div className="grid grid-cols-3 gap-2 my-4">
                <div className="bg-[#F7F3EE] p-2 rounded-lg border border-[#E8E2D9]">
                  <span className="font-dm text-[9px] uppercase text-[#806653] block">Material</span>
                  <span className="font-dm text-[11px] font-semibold text-[#3F261B]">{product.material || 'Organic Clay'}</span>
                </div>
                <div className="bg-[#F7F3EE] p-2 rounded-lg border border-[#E8E2D9]">
                  <span className="font-dm text-[9px] uppercase text-[#806653] block">Size</span>
                  <span className="font-dm text-[11px] font-semibold text-[#3F261B]">{product.size || 'Standard'}</span>
                </div>
                <div className="bg-[#F7F3EE] p-2 rounded-lg border border-[#E8E2D9]">
                  <span className="font-dm text-[9px] uppercase text-[#806653] block">Weight</span>
                  <span className="font-dm text-[11px] font-semibold text-[#3F261B]">{product.weight || '1.5 kg'}</span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <span className="font-dm text-[11px] font-semibold text-[#5B4638]">Quantity:</span>
                  <div className="flex items-center border border-[#E8E2D9] rounded-lg bg-white px-1.5 py-0.5">
                    <button 
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 text-[#6F241D] hover:bg-[#F7F3EE] rounded"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 font-dm text-xs font-bold text-[#3F261B] tabular-nums">{quantity}</span>
                    <button 
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1.5 text-[#6F241D] hover:bg-[#F7F3EE] rounded"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex items-center justify-center gap-1.5 bg-white border border-[#6F241D] text-[#6F241D] hover:bg-[#6F241D] hover:text-white py-2.5 rounded-lg font-dm text-[12px] font-semibold transition-all"
                  >
                    <ShoppingBag size={15} />
                    Add to Cart
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="flex items-center justify-center gap-1.5 bg-[#6F241D] hover:bg-[#873A24] text-white py-2.5 rounded-lg font-dm text-[12px] font-semibold transition-all"
                  >
                    Buy Now →
                  </button>
                </div>

                {addedToast && (
                  <div className="p-2 bg-[#E8F0E4] border border-[#354B35]/30 rounded-lg font-dm text-[11px] text-[#354B35] font-semibold flex items-center gap-2">
                    <CheckCircle size={14} />
                    Added to cart
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#E8E2D9] pt-3 grid grid-cols-3 gap-2 text-center font-dm text-[9px] text-[#5B4638]">
              <div className="flex flex-col items-center gap-0.5">
                <Truck size={14} className="text-[#6F241D]" />
                <span className="font-medium">Safe Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <RotateCcw size={14} className="text-[#6F241D]" />
                <span className="font-medium">7-Day Replace</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <ShieldCheck size={14} className="text-[#6F241D]" />
                <span className="font-medium">Artisan Support</span>
              </div>
            </div>
          </div>
        </div>

        {vendor && (
          <div className="mt-5 bg-white border border-[#E8E2D9] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full">
              <img 
                src={vendor.avatar} 
                alt={vendor.name}
                className="w-12 h-12 rounded-full object-cover border border-[#E8E2D9]"
              />
              <div className="min-w-0">
                <span className="font-dm text-[9px] font-semibold uppercase tracking-wider text-[#8B2E1E]">Artisan</span>
                <h3 className="font-playfair font-semibold text-base text-[#3F261B] truncate">{vendor.name}</h3>
                <p className="font-dm text-[10px] text-[#806653] flex items-center gap-1">
                  <MapPin size={11} />
                  {vendor.location}
                </p>
              </div>
            </div>
            <Link
              to={`/store/${vendor._id}`}
              className="w-full sm:w-auto bg-[#6F241D] hover:bg-[#873A24] text-white px-4 py-2 rounded-lg font-dm text-[11px] font-semibold whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <Store size={13} />
              Visit Store
            </Link>
          </div>
        )}

        <div className="mt-8">
          <h2 className="font-playfair font-semibold text-lg text-[#3F261B] mb-3">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {relatedProducts.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;