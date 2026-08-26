import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HEROES = ['/login_hero_1.png', '/login_hero_2.png'];

/**
 * Shared Pink-City shell for login + signup.
 */
const AuthFrame = ({ children }) => {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % HEROES.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[999] w-full h-[100dvh] bg-[#F8E6E4] font-body overflow-hidden">
      <div className="flex flex-col h-full w-full max-w-lg mx-auto md:max-w-none md:flex-row relative">
        <div className="relative w-full md:w-[48%] lg:w-[52%] h-[32vh] sm:h-[34vh] md:h-full shrink-0 overflow-hidden bg-[#E8B8B0]">
          <AnimatePresence mode="wait">
            <motion.img
              key={HEROES[slide]}
              src={HEROES[slide]}
              alt=""
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="absolute inset-0 w-full h-full object-cover object-[center_38%]"
              draggable={false}
            />
          </AnimatePresence>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 md:bottom-8">
            {HEROES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                className={`rounded-full transition-all ${
                  slide === i ? 'w-5 h-1.5 bg-[#6F241D]' : 'w-1.5 h-1.5 bg-white/80'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 relative z-20 -mt-6 md:mt-0 min-h-0">
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-40 md:hidden">
            <div className="h-[48px] w-[176px] bg-white rounded-xl shadow-[0_8px_20px_rgba(111,36,29,0.16)] ring-1 ring-[#F3D5D0] overflow-hidden flex items-center justify-center">
              <img
                src="/jaipurio_logo.png"
                alt="Jaipurio"
                className="h-[250%] w-auto max-w-none object-cover object-center select-none"
                draggable={false}
              />
            </div>
          </div>

          <div className="h-full rounded-t-[32px] md:rounded-none bg-[#FFF8F5] shadow-[0_-10px_28px_rgba(196,92,106,0.12)] md:shadow-none overflow-y-auto">
            <div className="px-5 pt-8 pb-8 sm:px-8 md:px-10 md:pt-12 lg:pt-16 max-w-md mx-auto w-full">
              <div className="hidden md:flex mb-5">
                <div className="h-[52px] w-[196px] bg-white rounded-xl shadow-sm ring-1 ring-[#F3D5D0] overflow-hidden flex items-center justify-center">
                  <img
                    src="/jaipurio_logo.png"
                    alt="Jaipurio"
                    className="h-[250%] w-auto max-w-none object-cover object-center"
                  />
                </div>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthFrame;
