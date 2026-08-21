import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const OFFERS = [
  {
    id: 'festive',
    src: '/offers/offer_festive.png',
    alt: 'Festive Offer — Flat 20% Off on orders above ₹999',
    to: '/shop?offer=festive',
  },
  {
    id: 'new-arrival',
    src: '/offers/offer_new_arrival.png',
    alt: 'New Arrival — Handcrafted Matkas',
    to: '/shop?category=Matkas',
  },
  {
    id: 'combo',
    src: '/offers/offer_combo.png',
    alt: 'Combo Offer — Mitti Love Combo ₹899',
    to: '/shop?offer=combo',
  },
  {
    id: 'delivery',
    src: '/offers/offer_delivery.png',
    alt: 'Free Delivery on orders above ₹499',
    to: '/shop',
  },
  {
    id: 'special',
    src: '/offers/offer_special.png',
    alt: 'Special Offer — Up to 30% OFF on traditional mitti products',
    to: '/shop?offer=special',
  },
];

const INTERVAL_MS = 2800;

/**
 * Side-scroll offer banners + auto-advance. One banner visible — no top bleed.
 */
const TrendingOffers = () => {
  const scrollerRef = useRef(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const ignoreScrollRef = useRef(false);

  const scrollToIndex = (i, behavior = 'smooth') => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.children[i];
    if (!slide) return;
    ignoreScrollRef.current = true;
    el.scrollTo({ left: slide.offsetLeft, behavior });
    indexRef.current = i;
    setIndex(i);
    window.setTimeout(() => {
      ignoreScrollRef.current = false;
    }, 500);
  };

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % OFFERS.length;
      scrollToIndex(next);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  const handleScroll = () => {
    if (ignoreScrollRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const slideW = el.clientWidth;
    if (!slideW) return;
    const i = Math.round(el.scrollLeft / slideW);
    const clamped = Math.max(0, Math.min(OFFERS.length - 1, i));
    if (clamped !== indexRef.current) {
      indexRef.current = clamped;
      setIndex(clamped);
    }
  };

  return (
    <section className="w-full bg-white pt-1 pb-2.5 px-3 sm:px-5">
      <div className="w-full max-w-7xl mx-auto">
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="flex w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-none rounded-2xl"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {OFFERS.map((offer) => (
              <div
                key={offer.id}
                className="snap-start shrink-0 w-full min-w-full"
              >
                <Link
                  to={offer.to}
                  className="relative block w-full overflow-hidden rounded-2xl shadow-[0_4px_14px_rgba(45,69,43,0.12)]"
                  aria-label={offer.alt}
                >
                  {/* Fixed frame + slight scale crops any leftover edge strip */}
                  <div className="relative w-full aspect-[2.05/1] overflow-hidden bg-[#E8F0E4]">
                    <img
                      src={`${offer.src}?v=3`}
                      alt={offer.alt}
                      className="absolute inset-0 w-full h-full object-cover object-center scale-[1.04] select-none"
                      draggable={false}
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {OFFERS.map((offer, i) => (
              <button
                key={offer.id}
                type="button"
                onClick={() => {
                  setPaused(true);
                  scrollToIndex(i);
                  window.setTimeout(() => setPaused(false), 4000);
                }}
                className={`rounded-full transition-all ${
                  i === index
                    ? 'w-4 h-1.5 bg-[#2D452B]'
                    : 'w-1.5 h-1.5 bg-[#2D452B]/25'
                }`}
                aria-label={`Offer ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendingOffers;
