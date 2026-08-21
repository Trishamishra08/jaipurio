import React from 'react';
import { Lock, RotateCcw, Package, Users } from 'lucide-react';

const TrustFooterStrip = () => {
  const items = [
    { id: 1, title: 'Secure', subtitle: 'Payments', Icon: Lock },
    { id: 2, title: 'Easy', subtitle: 'Returns', Icon: RotateCcw },
    { id: 3, title: 'Premium', subtitle: 'Packaging', Icon: Package },
    { id: 4, title: 'Trusted by', subtitle: '10K+ Customers', Icon: Users },
  ];

  return (
    <section className="w-full bg-white py-2 px-3 sm:px-5">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white border border-[#E8E2D9] py-2.5 px-2 sm:px-3 rounded-xl flex items-center shadow-sm">
          <div className="grid grid-cols-4 divide-x divide-[#EDE8E0] items-center justify-items-center w-full">
            {items.map(({ id, title, subtitle, Icon }) => (
              <div
                key={id}
                className="flex flex-col items-center gap-0.5 px-1 text-center w-full"
              >
                <Icon size={14} className="text-[#6F241D] sm:w-4 sm:h-4" strokeWidth={2} />
                <div className="flex flex-col leading-tight">
                  <span className="font-body text-[8px] sm:text-[10px] font-semibold text-[#1A1410]">
                    {title}
                  </span>
                  <span className="font-body text-[7px] sm:text-[9px] text-[#7A6B5C]">
                    {subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustFooterStrip;
