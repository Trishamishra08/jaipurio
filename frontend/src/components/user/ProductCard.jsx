import React from 'react';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';
import ThumbImg from '../shared/ThumbImg';

const BADGE_STYLES = {
  bestseller: { label: 'Best Seller', className: 'bg-[#E8DCC8]/95 text-[#5C4030]' },
  deal: { label: 'Trending', className: 'bg-[#E8C4B8]/95 text-[#6F241D]' },
  new: { label: 'New Arrival', className: 'bg-[#E8E0B8]/95 text-[#5C4A20]' },
  eco: { label: 'Eco Friendly', className: 'bg-[#D4E0C8]/95 text-[#354B35]' },
};

const getBadge = (product) => {
  if (product.badge === 'bestseller' || product.bestseller) return BADGE_STYLES.bestseller;
  if (product.badge === 'deal') return BADGE_STYLES.deal;
  if (product.badge === 'new') return BADGE_STYLES.new;
  if (product.badge === 'eco' || product.handmade) return BADGE_STYLES.eco;
  return BADGE_STYLES.bestseller;
};

/**
 * Product card — Mulish type like the live jaipurio.in storefront. The photo
 * is shown whole (object-contain) so nothing gets cropped; on hover the card
 * lifts and an "Add to cart" bar slides up over the image. Touch screens have
 * no hover, so they keep the small cart button next to the price.
 */
const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const navigate = useNavigate();
  const isLiked = isInWishlist(product._id);
  const badge = getBadge(product);
  const off =
    product.oldPrice && product.price && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;
  const add = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      className="bg-white rounded-[10px] overflow-hidden border border-[#E8E2D9] shadow-[0_2px_10px_rgba(62,39,35,0.06)] hover:shadow-[0_12px_28px_rgba(62,39,35,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer font-mulish"
    >
      <div className="relative w-full aspect-square bg-white overflow-hidden">
        <ThumbImg
          src={mediaUrl(product.image)}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain object-center p-2 group-hover:scale-[1.06] transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />

        <span
          className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wide shadow-sm ${
            off > 0 ? 'bg-[#2E7D32] text-white' : badge.className
          }`}
        >
          {off > 0 ? 'Sale' : badge.label}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm border border-black/[0.04] hover:scale-110 transition-transform"
          aria-label="Wishlist"
        >
          <Heart size={13} className={isLiked ? 'fill-[#C45C6A] text-[#C45C6A]' : 'text-[#3F261B]'} strokeWidth={2} />
        </button>

        {/* Hover add-to-cart bar (pointer devices) */}
        <button
          onClick={add}
          className="hidden md:flex absolute inset-x-2 bottom-2 z-10 items-center justify-center gap-1.5 rounded-lg bg-[#F5B82E] hover:bg-[#E9A915] text-[#2B1E1A] text-[12px] font-bold py-2 shadow-md translate-y-[130%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
          aria-label="Add to cart"
        >
          <ShoppingBag size={15} strokeWidth={2.2} />
          Add to cart
        </button>
      </div>

      <div className="px-2.5 pt-2 pb-2.5 sm:px-3 sm:pt-2.5 sm:pb-3 flex flex-col flex-1 bg-white border-t border-[#F1ECE4]">
        <h3 className="font-semibold text-[13px] sm:text-[14px] text-[#3F261B] group-hover:text-[#8B2E3A] transition-colors leading-snug line-clamp-2">
          {product.name}
        </h3>

        {product.reviews > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            <Star size={11} className="fill-[#F5B82E] text-[#F5B82E] shrink-0" />
            <span className="font-semibold text-[11px] text-[#5B4638]">{product.rating}</span>
            <span className="text-[11px] text-[#5B4638]/70">({product.reviews})</span>
          </div>
        )}

        <div className="mt-auto pt-1.5 flex items-end justify-between gap-2">
          <div className="min-w-0 flex items-baseline flex-wrap gap-x-1.5">
            <span className="font-extrabold text-[15px] sm:text-[16px] text-[#8B2E1E] leading-none">
              ₹{Number(product.price || 0).toLocaleString('en-IN')}
            </span>
            {off > 0 && (
              <span className="text-[11px] text-[#9A8B7A] line-through">
                ₹{Number(product.oldPrice).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            onClick={add}
            className="md:hidden w-7 h-7 shrink-0 rounded-[6px] bg-[#354B35] text-white flex items-center justify-center shadow-sm"
            aria-label="Add to cart"
          >
            <ShoppingBag size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
