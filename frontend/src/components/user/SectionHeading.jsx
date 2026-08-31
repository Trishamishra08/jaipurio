import React from 'react';
import { Link } from 'react-router-dom';

/** Decorative rule + leaf motif — same as Popular Picks */
export const LeafRule = ({ flip }) => (
  <div className={`flex items-center flex-1 min-w-[40px] ${flip ? 'flex-row-reverse' : ''}`}>
    <div
      className={`flex-1 h-px ${
        flip
          ? 'bg-gradient-to-l from-transparent via-[#C4B5A0] to-[#C4B5A0]'
          : 'bg-gradient-to-r from-transparent via-[#C4B5A0] to-[#C4B5A0]'
      }`}
    />
    <svg
      width="28"
      height="14"
      viewBox="0 0 28 14"
      fill="none"
      className={`shrink-0 mx-0.5 ${flip ? '-scale-x-100' : ''}`}
      aria-hidden="true"
    >
      <path
        d="M8 7C8 7 11 3 16 2.5C14 5 14 9 16 11.5C11 11 8 7 8 7Z"
        fill="#6B8F5E"
        opacity="0.9"
      />
      <path
        d="M16 7C16 7 19 4 24 3.5C22 5.5 22 8.5 24 10.5C19 10 16 7 16 7Z"
        fill="#82977A"
      />
      <circle cx="5" cy="7" r="1.2" fill="#6B8F5E" />
      <circle cx="2" cy="7" r="0.8" fill="#82977A" opacity="0.7" />
    </svg>
  </div>
);

/**
 * Home section title — matches Popular Picks:
 * Playfair, 18/22/24, #3F261B, centered, leaf rules on both sides.
 */
const SectionHeading = ({ title, copy, to, link = 'View All →', compact = false }) => (
  <div className={compact ? 'mb-1.5 sm:mb-2' : 'mb-3 sm:mb-4'}>
    <div className={`flex items-center justify-center gap-1 sm:gap-2 ${compact ? 'mb-0.5' : 'mb-1.5'} px-1`}>
      <LeafRule />
      <h2
        className={`font-playfair font-semibold text-[#3F261B] tracking-tight text-center px-1.5 sm:px-2 leading-tight ${
          compact ? 'text-[15px] sm:text-[17px] md:text-[18px]' : 'text-[18px] sm:text-[22px] md:text-[24px]'
        }`}
      >
        {title}
      </h2>
      <LeafRule flip />
    </div>
    {copy && (
      <p
        className={`font-dm text-[#8A6A68] text-center max-w-xl mx-auto leading-snug px-2 ${
          compact ? 'text-[10px] sm:text-[11px] mt-0' : 'text-[11px] sm:text-[13px] mt-0.5'
        }`}
      >
        {copy}
      </p>
    )}
    {to && (
      <div className={`flex justify-end ${compact ? 'mt-0.5' : 'mt-1.5'}`}>
        <Link
          to={to}
          className="font-dm text-[11px] sm:text-xs font-medium text-[#8B2E1E] hover:text-[#6F241D] transition-colors"
        >
          {link}
        </Link>
      </div>
    )}
  </div>
);

export default SectionHeading;
