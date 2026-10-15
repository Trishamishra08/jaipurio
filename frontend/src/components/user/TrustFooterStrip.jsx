import React from 'react';
import { Lock, RotateCcw, Package, Truck, ShieldCheck, Star } from 'lucide-react';
import { useHomeSections } from '../../utils/useHomeSections';

const ICONS = { lock: Lock, returns: RotateCcw, package: Package, truck: Truck, shield: ShieldCheck, star: Star };

// Items come from Admin → Appearance → Home Page → Trust strip
const TrustFooterStrip = () => {
  const cfg = useHomeSections().sections.trustStrip;
  const items = (cfg.items || []).filter((it) => it && (it.title || it.text));
  if (!cfg.enabled || !items.length) return null;

  return (
    <section className="w-full bg-white py-2">
      <div className="site-container">
        <div className="bg-white border border-[#E8E2D9] py-2.5 px-2 sm:px-3 rounded-xl flex items-center shadow-sm">
          <div
            className="grid divide-x divide-[#EDE8E0] items-center justify-items-center w-full"
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
          >
            {items.map((item, i) => {
              const Icon = ICONS[item.icon] || ShieldCheck;
              return (
                <div key={`${item.title}-${i}`} className="flex flex-col items-center gap-0.5 px-1 text-center w-full">
                  <Icon size={14} className="text-[#6F241D] sm:w-4 sm:h-4" strokeWidth={2} />
                  <div className="flex flex-col leading-tight">
                    <span className="font-body text-[8px] sm:text-[10px] font-semibold text-[#1A1410]">{item.title}</span>
                    <span className="font-body text-[7px] sm:text-[9px] text-[#7A6B5C]">{item.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustFooterStrip;
