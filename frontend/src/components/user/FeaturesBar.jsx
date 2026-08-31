import React from 'react';

const IconMatka = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
    <ellipse cx="20" cy="11.5" rx="4.8" ry="2" fill="#C4784A" stroke="#5C2E1A" strokeWidth="1" />
    <path
      d="M14.2 12.5c-.2 2.2-1.2 4.5-1.2 7.2 0 6.8 3.1 13.3 7 13.3s7-6.5 7-13.3c0-2.7-1-5-1.2-7.2"
      fill="#C4784A"
      stroke="#5C2E1A"
      strokeWidth="1.1"
    />
    <path
      d="M16 20.5c1-.8 2.1-.2 2.6.7.8-1.2 2.4-1 3.1.3"
      fill="none"
      stroke="#F5EDE0"
      strokeWidth="1.15"
      strokeLinecap="round"
    />
    <circle cx="18.2" cy="24.2" r="1" fill="#F5EDE0" />
    <circle cx="22.4" cy="26.2" r="1" fill="#F5EDE0" />
  </svg>
);

const IconLeaves = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
    <path
      d="M20 31C20 20 28.5 14 34 12.5 32.5 23 26 29 20 31Z"
      fill="#6B8F5E"
      stroke="#2F4A2C"
      strokeWidth="1"
    />
    <path
      d="M20 31C20 20 11.5 14 6 12.5 7.5 23 14 29 20 31Z"
      fill="#7FA36F"
      stroke="#2F4A2C"
      strokeWidth="1"
    />
    <path d="M20 31V15.5" stroke="#2F4A2C" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const IconArtisanHeart = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
    <path
      d="M20 26.5c-5.8-3.5-8.8-7-8.8-10.2 0-2.6 1.9-4.5 4.4-4.5 1.4 0 2.7.7 3.5 1.8.8-1.1 2.1-1.8 3.5-1.8 2.5 0 4.4 1.9 4.4 4.5 0 3.2-3 6.7-8.8 10.2z"
      fill="#C6453A"
      stroke="#6F241D"
      strokeWidth="1"
    />
    <path
      d="M6.5 29c2.2-3.8 5.2-5.6 8.2-5.6h10.6c3 0 6 1.8 8.2 5.6"
      fill="none"
      stroke="#C4A484"
      strokeWidth="2.3"
      strokeLinecap="round"
    />
    <path d="M9 28.2h5.5M25.5 28.2H31" stroke="#E8D4B5" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const IconTruck = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
    <path d="M3.5 19h2.2M7 16.8h2.2M10.5 14.6h2.2" stroke="#5C3826" strokeWidth="1.3" strokeLinecap="round" />
    <rect x="12" y="14" width="13.5" height="10" rx="1.4" fill="#E08A3C" stroke="#5C2E1A" strokeWidth="1.1" />
    <path d="M25.5 17.2h5.2l2.8 3.8v3h-8V17.2z" fill="#F0A35A" stroke="#5C2E1A" strokeWidth="1.1" />
    <circle cx="16.2" cy="26.2" r="2.3" fill="#2B1E1A" />
    <circle cx="28.2" cy="26.2" r="2.3" fill="#2B1E1A" />
    <circle cx="16.2" cy="26.2" r="0.9" fill="#E8D4B5" />
    <circle cx="28.2" cy="26.2" r="0.9" fill="#E8D4B5" />
  </svg>
);

const IconPalace = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
    <path d="M9.5 30V16.5l5.2-4.2 5.3 4.2 5.2-4.2 5.3 4.2V30H9.5z" fill="#C4784A" stroke="#5C2E1A" strokeWidth="1.1" />
    <path d="M14.7 12.3l5.3-5 5.3 5" fill="#E8B896" stroke="#5C2E1A" strokeWidth="1" />
    <rect x="17.6" y="20" width="4.8" height="10" fill="#F5EDE0" stroke="#5C2E1A" strokeWidth="0.8" />
    <rect x="12" y="18.2" width="3" height="3.8" fill="#F5EDE0" stroke="#5C2E1A" strokeWidth="0.7" />
    <rect x="25" y="18.2" width="3" height="3.8" fill="#F5EDE0" stroke="#5C2E1A" strokeWidth="0.7" />
    <path d="M7.5 30h25" stroke="#5C2E1A" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const features = [
  { id: 1, label: '100% Handmade', icon: <IconMatka /> },
  { id: 2, label: 'Eco Friendly', icon: <IconLeaves /> },
  { id: 3, label: 'Support Local Artisans', icon: <IconArtisanHeart /> },
  { id: 4, label: 'Pan India Delivery', icon: <IconTruck /> },
  { id: 5, label: 'Made in Rajasthan', icon: <IconPalace /> },
];

const FeaturesBar = () => {
  return (
    <section className="site-full-bleed w-full bg-white py-2 md:py-3 border-y border-[#E8E2D9]">
      <div className="site-container">
        <div className="bg-white md:bg-transparent border border-[#E8E2D9] md:border-0 rounded-xl md:rounded-none px-0.5 py-1.5 sm:px-2 sm:py-2 md:px-0 md:py-0 shadow-sm md:shadow-none">
          <div className="grid grid-cols-5 divide-x divide-dotted divide-[#C9B89A]">
            {features.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center justify-center text-center px-0.5 sm:px-2 md:px-4 py-0.5 md:py-1 gap-0.5 md:gap-1"
              >
                <div className="flex items-center justify-center shrink-0 leading-none">{item.icon}</div>
                <span className="font-body text-[7.5px] leading-[1.12] sm:text-[10px] md:text-xs lg:text-sm font-medium text-[#3A2218] max-w-[56px] sm:max-w-[88px] md:max-w-none">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesBar;
