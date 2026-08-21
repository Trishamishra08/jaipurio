import React from 'react';
import { Leaf, Heart, Flower2, Shield, Package, Truck } from 'lucide-react';

const ITEMS = [
  { label: '100% Natural & Eco Friendly', Icon: Leaf },
  { label: 'Handmade with Love', Icon: Heart },
  { label: 'Authentic Rajasthani Craft', Icon: Flower2 },
  { label: 'Secure Payments', Icon: Shield },
  { label: 'Easy Returns', Icon: Package },
  { label: 'Pan India Delivery', Icon: Truck },
];

/**
 * Why Choose Jaipurio — replaces Meet the Makers on home.
 */
const WhyChooseJaipurio = () => {
  return (
    <section className="w-full bg-white py-4 px-3 sm:px-5">
      <div className="w-full max-w-7xl mx-auto">
        <div className="rounded-xl border border-[#E8E2D9] bg-white px-3 py-4 sm:px-6 sm:py-5 shadow-[0_2px_12px_rgba(63,38,27,0.04)]">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[#C69A45] text-sm" aria-hidden="true">
              ❀
            </span>
            <h2 className="font-playfair font-semibold text-[16px] sm:text-xl text-[#3F261B] tracking-tight text-center">
              Why Choose Jaipurio?
            </h2>
            <span className="text-[#C69A45] text-sm" aria-hidden="true">
              ❀
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-4 gap-x-1 sm:gap-x-2">
            {ITEMS.map(({ label, Icon }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center text-center px-1 sm:px-2 ${
                  i < ITEMS.length - 1 ? 'sm:border-r sm:border-[#EDE8E0]' : ''
                }`}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F7F3EE] flex items-center justify-center mb-1.5">
                  <Icon size={16} className="text-[#6F241D] sm:w-[18px] sm:h-[18px]" strokeWidth={1.8} />
                </div>
                <p className="font-dm text-[9px] sm:text-[11px] font-medium text-[#3F261B] leading-snug max-w-[90px] sm:max-w-none">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseJaipurio;
