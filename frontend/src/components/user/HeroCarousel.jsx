import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SLIDES = [
  { type: 'image', src: '/jaipurio_banner_art.png' },
  { type: 'video', src: '/generate_a_simple_video_for_th.mp4' },
];

/**
 * Full-bleed hero — banner art + looping video slides.
 * Text/CTA only on image slide (hidden on video).
 */
const HeroCarousel = () => {
  const [active, setActive] = useState(0);
  const videoRef = useRef(null);
  const isVideo = SLIDES[active]?.type === 'video';

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, 6500);
    return () => clearInterval(id);
  }, []);

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

  return (
    <section className="relative w-full m-0 p-0 -mt-0 leading-none bg-[#EFE0C9]">
      <div className="relative w-full overflow-hidden">
        <div className="relative w-full aspect-[5/4] sm:aspect-[16/10] md:aspect-[2/1] max-h-[580px]">
          {SLIDES.map((slide, i) => {
            const isActive = i === active;
            if (slide.type === 'image') {
              return (
                <img
                  key={slide.src}
                  src={slide.src}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover object-[58%_38%] md:object-center select-none transition-opacity duration-700 ${
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

        {!isVideo && (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-[70%] sm:w-[52%] md:w-[45%] bg-gradient-to-r from-[#F8F1E3]/80 via-[#F8F1E3]/25 to-transparent"
              aria-hidden="true"
            />

            <div className="absolute left-3 right-[26%] sm:left-5 sm:right-auto sm:max-w-[280px] md:left-8 md:max-w-[340px] top-[32%] sm:top-[34%] md:top-[36%] z-[3]">
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
          </>
        )}

        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-[3] flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
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
