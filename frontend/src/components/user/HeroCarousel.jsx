import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { mediaUrl } from '../../data/cloudinaryMedia';

const SLIDES = [
  { type: 'image', src: mediaUrl('/jaipurio_banner_art.png') },
  { type: 'video', src: mediaUrl('/generate_a_simple_video_for_th.mp4') },
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
    <section className="site-full-bleed relative w-full m-0 p-0 leading-none bg-[#EFE0C9]">
      <div className="relative w-full overflow-hidden">
        <div className="relative w-full max-md:aspect-[5/4] max-md:min-h-[240px] max-md:max-h-[340px] md:min-h-[520px] md:h-[62vh] md:max-h-[760px] lg:min-h-[580px] lg:h-[68vh] lg:max-h-[820px] xl:min-h-[620px] xl:h-[72vh] xl:max-h-[880px]">
          {SLIDES.map((slide, i) => {
            const isActive = i === active;
            if (slide.type === 'image') {
              return (
                <img
                  key={slide.src}
                  src={slide.src}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover max-md:object-[55%_38%] md:object-[50%_72%] lg:object-[50%_78%] xl:object-[center_82%] select-none transition-opacity duration-700 ${
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
              className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-[72%] sm:w-[55%] md:w-[48%] lg:w-[42%] bg-gradient-to-r from-white/85 via-white/30 to-transparent"
              aria-hidden="true"
            />

            <div className="absolute left-4 sm:left-6 md:left-10 lg:left-16 xl:left-24 top-[26%] sm:top-[30%] md:top-[32%] lg:top-[34%] z-[3] max-w-[240px] sm:max-w-[300px] md:max-w-[360px] lg:max-w-[440px]">
              <h1 className="font-heading text-[22px] sm:text-[28px] md:text-[36px] lg:text-[42px] xl:text-[48px] font-bold text-[#8B2E3A] leading-[1.12]">
                Authentic Mitti. Pure Rajasthan.
              </h1>
              <p className="font-body text-[10px] sm:text-xs md:text-sm lg:text-base text-[#4A3A2F] mt-1.5 sm:mt-2 leading-snug">
                Traditional Matkas &amp; Mitti Products direct from Jaipur
              </p>
              <Link
                to="/shop"
                className="mt-2.5 sm:mt-3 md:mt-4 inline-flex items-center gap-1.5 bg-[#C45C6A] hover:bg-[#8B2E3A] text-white font-body text-[11px] sm:text-xs md:text-sm font-semibold px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full shadow-md active:scale-[0.98] transition-all"
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
                  ? 'w-2 h-2 bg-[#C45C6A]'
                  : 'w-1.5 h-1.5 bg-white/90 border border-[#C45C6A]/35'
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
