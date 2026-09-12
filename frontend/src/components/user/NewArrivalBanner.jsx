import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { mediaUrl } from '../../data/cloudinaryMedia';

/**
 * Mid-page New Arrival promo — pink palace/matka banner after categories.
 */
const NewArrivalBanner = () => {
  return (
    <section className="w-full bg-white pt-2 pb-3">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-none sm:rounded-2xl min-h-[148px] sm:min-h-[180px] md:min-h-[240px] lg:min-h-[280px]">
          <img
            src={mediaUrl('/jaipurio_banner_art.png')}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[55%_42%] select-none"
            draggable={false}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.45) 42%, rgba(255,255,255,0.05) 100%)',
            }}
            aria-hidden="true"
          />

          <div className="relative z-[1] flex flex-col justify-center px-4 sm:px-7 py-6 sm:py-8 max-w-[78%] sm:max-w-[52%]">
            <p className="font-dm text-[9px] sm:text-[10px] font-semibold tracking-[0.18em] uppercase text-[#C45C6A]">
              New Arrival
            </p>
            <h3 className="font-playfair font-semibold text-[18px] sm:text-[24px] md:text-[28px] text-[#6F241D] leading-tight mt-1">
              Handcrafted Matkas.
            </h3>
            <p className="font-dm text-[11px] sm:text-[13px] text-[#5B4638] mt-1 leading-snug">
              Bringing tradition to your home.
            </p>
            <Link
              to="/shop?category=Matkas"
              className="mt-3 inline-flex items-center gap-1.5 self-start bg-[#C45C6A] hover:bg-[#8B2E3A] text-white font-dm text-[10px] sm:text-[11px] font-semibold tracking-wide px-4 py-2 rounded-full shadow-md transition-colors"
            >
              Explore Now
              <ArrowRight size={13} strokeWidth={2.4} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewArrivalBanner;
