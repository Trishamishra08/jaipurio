import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Circular illustrated category icons (same folk-art style as matka.png).
 * Images already include gold ring + cream circle; we crop black corners with overflow-hidden.
 */
const CATEGORIES = [
  { name: 'Matkas', image: '/matka.png' },
  { name: 'Kulhads', image: '/kulhad.png' },
  { name: 'Planters', image: '/planter.png' },
  { name: 'Home Decor', image: '/elephant.png' },
  { name: 'Puja Essentials', image: '/diya.png' },
  { name: 'More', image: '/camel.png', to: '/shop' },
];

const Categories = () => {
  return (
    <section className="w-full bg-white pt-2.5 pb-2 px-3 sm:px-5">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[#A94E2C] text-sm shrink-0" aria-hidden="true">
              ❀
            </span>
            <h2 className="font-heading text-[18px] sm:text-xl font-bold text-[#6F241D] tracking-tight truncate">
              Shop by Category
            </h2>
            <span className="text-[#A94E2C] text-sm shrink-0 hidden xs:inline" aria-hidden="true">
              ❀
            </span>
          </div>

          <Link
            to="/shop"
            className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[#70452F] hover:text-[#6F241D] transition-colors shrink-0 ml-2 font-body"
          >
            View All
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-1.5 pl-1 pr-4 -mx-1 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-none md:justify-between md:overflow-visible md:pr-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {CATEGORIES.map((cat) => {
            const href = cat.to || `/shop?category=${encodeURIComponent(cat.name)}`;
            return (
              <Link
                key={cat.name}
                to={href}
                className="flex flex-col items-center group snap-start shrink-0 w-[72px] sm:w-[88px] md:w-auto md:flex-1 md:max-w-[104px]"
              >
                {/* Perfect circle card — icon fills edge-to-edge */}
                <div className="relative w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-full overflow-hidden bg-[#F7EFE0] shadow-[0_2px_8px_rgba(111,36,29,0.12)] ring-1 ring-[#D5C19E]/80 group-hover:ring-[#6F241D] group-hover:scale-105 transition-all duration-300">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover object-center scale-[1.08]"
                    loading="lazy"
                    draggable={false}
                  />
                </div>

                <h3 className="font-body mt-1.5 text-[10px] sm:text-[11px] font-medium text-[#4A3A2F] group-hover:text-[#6F241D] transition-colors text-center leading-tight w-full px-0.5 tracking-wide">
                  {cat.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
