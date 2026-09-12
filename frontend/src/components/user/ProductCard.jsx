import React from 'react';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';

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

const getSubtitle = (product) => {
  const bits = [];
  if (product.material) {
    bits.push(
      product.material.includes('Mitti') ||
        product.material.includes('Clay') ||
        product.material.includes('Terracotta')
        ? 'Pure Mitti'
        : product.material.split('/')[0].trim()
    );
  } else {
    bits.push('Pure Mitti');
  }
  if (product.handmade) bits.push('Handpainted');
  else bits.push(product.category || 'Handmade');
  return bits.slice(0, 2).join(' • ');
};

/**
 * Popular Picks card typography (compact):
 * Name → Playfair 600 | Subtitle/Price/Rating/Badge → DM Sans
 */
const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const navigate = useNavigate();
  const isLiked = isInWishlist(product._id);
  const badge = getBadge(product);

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      className="bg-white rounded-[10px] overflow-hidden shadow-[0_2px_10px_rgba(62,39,35,0.07)] hover:shadow-[0_6px_16px_rgba(62,39,35,0.1)] transition-shadow duration-300 flex flex-col group cursor-pointer border border-[#E8E2D9]"
    >
      <div className="relative w-full aspect-[4/3.2] bg-[#F7EFE0] overflow-hidden">
          <img
            src={mediaUrl(product.image)}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.05] transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />

        <span
          className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full font-dm text-[9px] sm:text-[10px] font-semibold tracking-wide shadow-sm backdrop-blur-[2px] ${badge.className}`}
        >
          {badge.label}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm border border-black/[0.04] hover:scale-105 transition-transform"
          aria-label="Wishlist"
        >
          <Heart
            size={13}
            className={isLiked ? 'fill-[#C45C6A] text-[#C45C6A]' : 'text-[#3F261B]'}
            strokeWidth={2}
          />
        </button>
      </div>

      <div className="px-2.5 pt-2 pb-2 sm:px-3 sm:pt-2.5 sm:pb-2.5 flex flex-col flex-1 bg-white">
        <h3
          className="font-playfair font-semibold text-[14px] sm:text-[15px] text-[#3F261B] leading-[1.2] line-clamp-2"
        >
          {product.name}
        </h3>

        <p className="font-dm font-normal text-[10.5px] sm:text-[11px] text-[#806653] leading-[1.4] mt-0.5">
          {getSubtitle(product)}
        </p>

        <div className="mt-auto pt-1.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="font-dm font-bold text-[16px] sm:text-[17px] text-[#8B2E1E] leading-none">
              ₹{product.price}
            </p>
            <div className="flex items-center gap-0.5 mt-1">
              <Star size={11} className="fill-[#C69A45] text-[#C69A45] shrink-0" />
              <span className="font-dm font-medium text-[11px] text-[#5B4638]">
                {product.rating}
              </span>
              <span className="font-dm font-medium text-[11px] text-[#5B4638]/75">
                ({product.reviews})
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, 1);
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-[6px] bg-[#354B35] text-white hover:bg-[#2A3C2A] flex items-center justify-center transition-colors shadow-sm"
            aria-label="Add to cart"
          >
            <ShoppingBag size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
