import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

/**
 * Full-bleed hero — banner art + video slides, sourced from the admin-managed
 * "Main Slider" banners (Admin → Appearance → Banners) instead of a hardcoded
 * list. Text/CTA only render on image slides with their own copy set.
 */
const HeroCarousel = () => {
  const { banners } = useShop();
  const [active, setActive] = useState(0);
  const videoRef = useRef(null);

  const slides = useMemo(() => {
    return (banners || [])
      .filter((b) => b.type === 'Main Slider' && b.status !== 'inactive' && b.image)
      .sort((a, b) => (a.slot || a.sequence || 1) - (b.slot || b.sequence || 1))
      .map((b) => ({
        type: b.isVideo ? 'video' : 'image',
        src: b.image,
        badge: b.badge || '',
        title: b.title || b.heading || '',
        subtitle: b.subtitle || b.description || '',
        features: Array.isArray(b.features) ? b.features.filter(Boolean) : [],
        link: b.link || '/shop',
        btnText: b.btnText || 'Shop Now',
      }));
  }, [banners]);

  useEffect(() => {
    setActive(0);
  }, [slides.length]);

  const isVideo = slides[active]?.type === 'video';

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVideo) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active, isVideo]);

  if (!slides.length) return null;

  return (
    <section className="site-full-bleed relative w-full m-0 p-0 leading-none bg-[#EFE0C9]">
      <div className="relative w-full overflow-hidden">
        <div className="relative w-full max-md:aspect-[5/4] max-md:min-h-[240px] max-md:max-h-[340px] md:min-h-[520px] md:h-[62vh] md:max-h-[760px] lg:min-h-[580px] lg:h-[68vh] lg:max-h-[820px] xl:min-h-[620px] xl:h-[72vh] xl:max-h-[880px]">
          {slides.map((slide, i) => {
            const isActive = i === active;
            if (slide.type === 'image') {
              return (
                <img
                  key={slide.src}
                  src={slide.src}
                  alt={slide.title || 'Jaipurio Banner'}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className={`absolute inset-0 w-full h-full object-cover object-center select-none transition-opacity duration-700 ${
                    isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
                  }`}
                  draggable={false}
                />
              );
            }
            return (
              <video
                key={slide.src}
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover object-center select-none transition-opacity duration-700 ${
                  isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
                }`}
                src={slide.src}
                muted
                playsInline
                loop
                autoPlay
                preload="metadata"
                controls={false}
                disablePictureInPicture
                aria-label="jaipurio banner video"
              />
            );
          })}
        </div>

        {!isVideo && (slides[active]?.title || slides[active]?.subtitle) && (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-[80%] sm:w-[62%] md:w-[54%] lg:w-[46%] bg-gradient-to-r from-white/90 via-white/40 to-transparent"
              aria-hidden="true"
            />

            <div className="absolute left-4 sm:left-6 md:left-10 lg:left-16 xl:left-24 top-[14%] sm:top-[18%] md:top-[22%] lg:top-[24%] z-[3] max-w-[260px] sm:max-w-[340px] md:max-w-[400px] lg:max-w-[480px]">
              {slides[active].badge && (
                <p className="font-body text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-[#8B2E3A]/80">
                  {slides[active].badge}
                </p>
              )}
              {slides[active].title && (
                <h1 className="font-heading text-[20px] sm:text-[26px] md:text-[34px] lg:text-[40px] xl:text-[46px] font-bold text-[#8B2E3A] leading-[1.12] mt-1">
                  {slides[active].title}
                </h1>
              )}
              {slides[active].subtitle && (
                <p className="font-body text-[10px] sm:text-xs md:text-sm lg:text-base text-[#4A3A2F] mt-1.5 sm:mt-2 leading-snug">
                  {slides[active].subtitle}
                </p>
              )}
              {slides[active].features.length > 0 && (
                <ul className="mt-2.5 sm:mt-3 md:mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:gap-y-2">
                  {slides[active].features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] md:text-xs text-[#4A3A2F] font-semibold leading-tight"
                    >
                      <Check size={11} className="shrink-0 mt-[1px] text-[#8B2E3A]" strokeWidth={3} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to={slides[active].link}
                className="mt-3 sm:mt-4 md:mt-5 inline-flex items-center gap-1.5 bg-[#C45C6A] hover:bg-[#8B2E3A] text-white font-body text-[11px] sm:text-xs md:text-sm font-semibold px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full shadow-md active:scale-[0.98] transition-all"
              >
                {slides[active].btnText}
                <ArrowRight size={14} strokeWidth={2.4} />
              </Link>
            </div>
          </>
        )}

        {slides.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-[3] flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`rounded-full transition-all ${
                  active === i
                    ? 'w-2 h-2 bg-[#C45C6A]'
                    : 'w-1.5 h-1.5 bg-white/90 border border-[#C45C6A]/35'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroCarousel;
