import React from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import ProductCard from './ProductCard';

/** Decorative rule + leaf motif (reference style) */
const LeafRule = ({ flip }) => (
  <div className={`flex items-center flex-1 min-w-[40px] ${flip ? 'flex-row-reverse' : ''}`}>
    <div
      className={`flex-1 h-px ${
        flip
          ? 'bg-gradient-to-l from-transparent via-[#C4B5A0] to-[#C4B5A0]'
          : 'bg-gradient-to-r from-transparent via-[#C4B5A0] to-[#C4B5A0]'
      }`}
    />
    <svg
      width="28"
      height="14"
      viewBox="0 0 28 14"
      fill="none"
      className={`shrink-0 mx-0.5 ${flip ? '-scale-x-100' : ''}`}
      aria-hidden="true"
    >
      <path
        d="M8 7C8 7 11 3 16 2.5C14 5 14 9 16 11.5C11 11 8 7 8 7Z"
        fill="#6B8F5E"
        opacity="0.9"
      />
      <path
        d="M16 7C16 7 19 4 24 3.5C22 5.5 22 8.5 24 10.5C19 10 16 7 16 7Z"
        fill="#82977A"
      />
      <circle cx="5" cy="7" r="1.2" fill="#6B8F5E" />
      <circle cx="2" cy="7" r="0.8" fill="#82977A" opacity="0.7" />
    </svg>
  </div>
);

const BestSellers = () => {
  const { products } = useShop();
  const bestSellers = products.slice(0, 4);

  return (
    <section className="w-full bg-white pt-1.5 pb-3 px-3 sm:px-5">
      <div className="w-full max-w-7xl mx-auto">
        {/* Heading pulled up closer to offers carousel */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1.5 px-1">
          <LeafRule />
          <h2 className="font-playfair font-semibold text-[18px] sm:text-[22px] md:text-[24px] text-[#3F261B] tracking-tight whitespace-nowrap px-1.5 sm:px-2">
            Popular Picks
          </h2>
          <LeafRule flip />
        </div>

        <div className="flex justify-end mb-2">
          <Link
            to="/shop"
            className="font-dm text-[11px] sm:text-xs font-medium text-[#8B2E1E] hover:text-[#6F241D] transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {bestSellers.map((product, i) => (
            <ProductCard
              key={product._id}
              product={{
                ...product,
                badge: product.badge || ['bestseller', 'deal', 'eco', 'new'][i % 4],
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
