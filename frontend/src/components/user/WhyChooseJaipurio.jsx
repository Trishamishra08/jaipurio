import React from 'react';
import { Leaf, Heart, Flower2, Shield, Package, Truck } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { useHomeSections } from '../../utils/useHomeSections';

const ICONS = { leaf: Leaf, heart: Heart, flower: Flower2, shield: Shield, package: Package, truck: Truck };

/**
 * Why Choose Jaipurio — replaces Meet the Makers on home.
 */
const WhyChooseJaipurio = () => {
  // Heading and reasons come from Admin → Appearance → Home Page
  const cfg = useHomeSections().sections.whyChoose;
  const ITEMS = (cfg.items || []).filter((it) => it && it.label).map((it) => ({ label: it.label, Icon: ICONS[it.icon] || Leaf }));
  if (!cfg.enabled || !ITEMS.length) return null;
  return (
    <section className="w-full bg-white py-4">
      <div className="site-container">
        <div className="rounded-xl border border-[#E8E2D9] bg-white px-3 py-4 sm:px-6 sm:py-5 shadow-[0_2px_12px_rgba(63,38,27,0.04)]">
          <SectionHeading title={cfg.title} />

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-4 gap-x-1 sm:gap-x-2">
            {ITEMS.map(({ label, Icon }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center text-center px-1 sm:px-2 ${
                  i < ITEMS.length - 1 ? 'sm:border-r sm:border-[#EDE8E0]' : ''
                }`}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F8D0C8] flex items-center justify-center mb-1.5">
                  <Icon size={16} className="text-[#C45C6A] sm:w-[18px] sm:h-[18px]" strokeWidth={1.8} />
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
