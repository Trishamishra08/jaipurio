import React from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from './SectionHeading';
import { CATEGORY_CHIPS as CATEGORIES } from '../../data/categoryMedia';

const CategoryItem = ({ cat, mobile }) => {
  const href = cat.to || `/shop?category=${encodeURIComponent(cat.name)}`;

  if (mobile) {
    return (
      <Link
        to={href}
        className="flex flex-col items-center group snap-start shrink-0 w-[72px] sm:w-[80px]"
      >
        <div className="relative w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-full overflow-hidden bg-[#F7EFE0] shadow-[0_2px_8px_rgba(111,36,29,0.12)] ring-1 ring-[#D5C19E]/80 group-active:scale-95 transition-transform duration-200">
          <img
            src={cat.image}
            alt={cat.name}
            className="absolute inset-0 w-full h-full object-cover object-center scale-[1.08]"
            loading="lazy"
            draggable={false}
          />
        </div>
        <h3 className="font-body mt-1.5 text-[10px] sm:text-[11px] font-medium text-[#4A3A2F] text-center leading-tight w-full px-0.5 tracking-wide">
          {cat.name}
        </h3>
      </Link>
    );
  }

  return (
    <Link
      to={href}
      className="flex flex-col items-center group shrink-0 w-[68px] lg:w-[72px]"
    >
      <div className="relative w-[58px] h-[58px] lg:w-[62px] lg:h-[62px] rounded-full overflow-hidden bg-[#F7EFE0] shadow-[0_1px_6px_rgba(111,36,29,0.1)] ring-1 ring-[#D5C19E]/80 group-hover:ring-[#6F241D] group-hover:scale-105 transition-all duration-300">
        <img
          src={cat.image}
          alt={cat.name}
          className="absolute inset-0 w-full h-full object-cover object-center scale-[1.08]"
          loading="lazy"
          draggable={false}
        />
      </div>
      <h3 className="font-body mt-1 text-[10px] font-medium text-[#4A3A2F] group-hover:text-[#6F241D] transition-colors text-center leading-tight w-full px-0.5 tracking-wide">
        {cat.name}
      </h3>
    </Link>
  );
};

const Categories = () => {
  return (
    <section className="w-full bg-white pt-2.5 pb-2 md:pt-1.5 md:pb-1.5">
      <div className="site-container">
        {/* Mobile — original app-style heading */}
        <div className="md:hidden">
          <SectionHeading title="Shop by Category" to="/shop" />
        </div>
        {/* Desktop — compact heading */}
        <div className="hidden md:block">
          <SectionHeading title="Shop by Category" to="/shop" compact />
        </div>

        {/* Mobile — horizontal scroll, single row (app layout) */}
        <div
          className="md:hidden flex flex-nowrap gap-3 sm:gap-4 overflow-x-auto pb-1.5 pl-1 pr-4 -mx-1 snap-x snap-mandatory scrollbar-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {CATEGORIES.map((cat) => (
            <CategoryItem key={cat.name} cat={cat} mobile />
          ))}
        </div>

        {/* Desktop — centered tight row */}
        <div className="hidden md:flex flex-nowrap justify-center gap-5 lg:gap-6">
          {CATEGORIES.map((cat) => (
            <CategoryItem key={cat.name} cat={cat} mobile={false} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
