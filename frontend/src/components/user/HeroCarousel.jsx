import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Full-bleed under announcement — nav overlays top (no cream gap).
 */
const HeroCarousel = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="relative w-full m-0 p-0 -mt-0 leading-none bg-[#EFE0C9]">
      <div className="relative w-full overflow-hidden">
        {/* Starts under announcement; location+nav float on top */}
        <div className="relative w-full aspect-[5/4] sm:aspect-[16/10] md:aspect-[2/1] max-h-[580px]">
          <img
            src="/jaipurio_banner_art.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[58%_38%] md:object-center select-none"
            draggable={false}
          />
        </div>

        {/* Soft left wash for text only — no top fade / no cream gap */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[70%] sm:w-[52%] md:w-[45%] bg-gradient-to-r from-[#F8F1E3]/80 via-[#F8F1E3]/25 to-transparent"
          aria-hidden="true"
        />

        {/* Headline sits below overlay nav */}
        <div className="absolute left-3 right-[26%] sm:left-5 sm:right-auto sm:max-w-[280px] md:left-8 md:max-w-[340px] top-[32%] sm:top-[34%] md:top-[36%] z-[2]">
          <h1 className="font-heading text-[22px] sm:text-[28px] md:text-[34px] font-bold text-[#6F241D] leading-[1.15]">
            Authentic Mitti. Pure Rajasthan.
          </h1>
          <p className="font-body text-[10px] sm:text-xs md:text-sm text-[#4A3A2F] mt-1.5 sm:mt-2 leading-snug max-w-[220px] sm:max-w-none">
            Traditional Matkas &amp; Mitti Products direct from Jaipur
          </p>
          <Link
            to="/shop"
            className="mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 bg-[#6F241D] hover:bg-[#873A24] text-white font-body text-[11px] sm:text-xs font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-md active:scale-[0.98] transition-all"
          >
            Shop Now
            <ArrowRight size={14} strokeWidth={2.4} />
          </Link>
        </div>

        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-[2] flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`rounded-full transition-all ${
                active === i
                  ? 'w-2 h-2 bg-[#6F241D]'
                  : 'w-1.5 h-1.5 bg-white/90 border border-[#6F241D]/35'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
