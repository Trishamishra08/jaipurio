import React from 'react';
import { Link } from 'react-router-dom';
import { Percent } from 'lucide-react';

/**
 * Two-column coupon strip — pink theme, after Popular Picks.
 */
const CouponOffers = () => {
  return (
    <section className="w-full bg-white py-3">
      <div className="site-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white">
          <Link
            to="/shop"
            className="flex items-center gap-3 px-4 py-4 sm:py-5 sm:border-r sm:border-dashed sm:border-[#E8E2D9] hover:bg-[#FAF4EA] transition-colors"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F7F3EE] flex items-center justify-center shrink-0">
              <Percent size={18} className="text-[#6F241D]" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="font-playfair font-semibold text-[14px] sm:text-[16px] text-[#6F241D] leading-tight">
                Extra 10% off on prepaid orders
              </p>
              <p className="font-dm text-[10px] sm:text-[11px] text-[#806653] mt-0.5">
                Instant discount at checkout
              </p>
            </div>
          </Link>

          <Link
            to="/shop"
            className="relative flex items-center gap-3 px-4 py-4 sm:py-5 border-t sm:border-t-0 border-dashed border-[#E8E2D9] hover:bg-[#FAF4EA] transition-colors overflow-hidden"
          >
            <div
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 opacity-20"
              style={{
                backgroundImage: 'url(/jaipurio_banner_art.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'right center',
              }}
              aria-hidden="true"
            />
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F7F3EE] flex items-center justify-center shrink-0 relative z-[1]">
              <Percent size={18} className="text-[#6F241D]" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 relative z-[1]">
              <p className="font-playfair font-semibold text-[14px] sm:text-[16px] text-[#6F241D] leading-tight">
                Use code JAIPURIO10
              </p>
              <p className="font-dm text-[10px] sm:text-[11px] text-[#806653] mt-0.5">
                On orders above ₹999
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CouponOffers;
