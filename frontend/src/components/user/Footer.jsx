import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { PHOTOS } from '../../data/photos';

const HAWA = PHOTOS.buddha;
const OFFICE =
  '133-134, Flat No. F1, Jandu 4 Apartment, Ashok Nagar, Niwaru Road, Jaipur, Rajasthan 302012';
const MAPS_QUERY = encodeURIComponent(`${OFFICE}`);
const MAPS_EMBED = `https://maps.google.com/maps?q=${MAPS_QUERY}&z=15&output=embed`;
const MAPS_OPEN = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
    <path d="M15 8h3V4h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V9a1 1 0 011-1z" />
  </svg>
);

const IconPinterest = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.1 2.5 7.6 6 9.1-.1-.8-.2-2 0-2.9.2-.8 1.3-5.5 1.3-5.5s-.3-.7-.3-1.6c0-1.5.9-2.6 2-2.6.9 0 1.4.7 1.4 1.5 0 .9-.6 2.3-.9 3.5-.3 1.1.5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8-3.1 0-5 2.3-5 4.8 0 .9.3 1.8.7 2.4.1.1.1.2.1.3l-.3 1.1c0 .2-.1.3-.3.2-1.3-.5-1.9-1.9-1.9-3.5 0-2.6 2.2-5.7 6.5-5.7 3.5 0 5.8 2.5 5.8 5.2 0 3.6-2 6.2-4.9 6.2-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.8-.8 1.8-1.2 2.4.9.3 1.9.4 2.9.4 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
  </svg>
);

const STATS = [
  ['6', 'Artisan houses'],
  ['40+', 'Product categories'],
  ['6', 'Languages supported'],
  ['Global', 'Wholesale & retail shipping'],
  ['24/7', 'Customer support'],
];

const ACTIONS = [
  {
    icon: Search,
    title: 'Discover',
    copy: 'Browse matkas, kulhads, décor & puja sets across 40+ categories.',
    to: '/shop',
    link: 'Shop all products →',
  },
  {
    icon: ShoppingCart,
    title: 'Shop & Track',
    copy: 'Secure checkout, order tracking, easy returns — pan India.',
    to: '/orders',
    link: 'Track your order →',
  },
  {
    icon: ShoppingBag,
    title: 'Sell & Earn',
    copy: 'Open a storefront as an artisan house, or join as a partner.',
    to: '/vendor/register',
    link: 'Start selling →',
  },
];

const DIRECTORY = [
  {
    title: 'Shop by Category',
    links: [
      ['Matkas', '/shop?category=Matkas'],
      ['Kulhads', '/shop?category=Kulhads'],
      ['Planters', '/shop?category=Planters'],
      ['Home Decor', '/shop?category=Home Decor'],
      ['Puja Essentials', '/shop?category=Puja Essentials'],
      ['Gift Sets', '/shop'],
    ],
  },
  {
    title: 'Our Houses',
    links: [
      ['Shyam Pottery', '/shop?category=Matkas'],
      ['Kulhad House', '/shop?category=Kulhads'],
      ['Meera Terracotta', '/shop?category=Planters'],
      ['Rajputana Crafts', '/shop?category=Home Decor'],
      ['Pushkar Clay Arts', '/shop?category=Puja Essentials'],
      ['Jaipurio Flagship', '/shop'],
    ],
  },
  {
    title: 'Kitchen & Decor',
    links: [
      ['Mitti Tawa', '/shop'],
      ['Clay Handi', '/shop'],
      ['Diya Sets', '/shop?category=Puja Essentials'],
      ['Figurines', '/shop?category=Home Decor'],
      ['Planters', '/shop?category=Planters'],
    ],
  },
  {
    title: 'Customer Care',
    links: [
      ['Order Tracking', '/orders'],
      ['Returns & Refunds', '/return-policy'],
      ['FAQs', '/contact'],
      ['Contact Us', '/contact'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About Us', '/about'],
      ['Journal', '/blog'],
      ['Our Story', '/about'],
      ['Privacy Policy', '/privacy-policy'],
      ['Terms & Conditions', '/terms-conditions'],
    ],
  },
  {
    title: 'Sell & Partner',
    links: [
      ['Sell on Jaipurio', '/vendor/register'],
      ['Vendor Login', '/vendor/login'],
      ['Terms of Use', '/terms-conditions'],
      ['Cookie Policy', '/privacy-policy'],
    ],
  },
  {
    title: 'Popular Searches',
    links: [
      ['Jaipur Matka', '/shop?search=matka'],
      ['Clay Kulhad', '/shop?search=kulhad'],
      ['Terracotta Planter', '/shop?search=planter'],
      ['Festive Diya Set', '/shop?search=diya'],
    ],
  },
];

const INDIA_CITIES = [
  'Jaipur',
  'Delhi NCR',
  'Mumbai',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
];

const INTL = ['USA & Canada', 'United Kingdom', 'Europe (EU)', 'UAE & GCC', 'Australia', 'Singapore'];

const Social = () => (
  <div className="flex items-center gap-1.5">
    {[
      ['https://instagram.com', 'Instagram', <IconInstagram key="ig" />],
      ['https://facebook.com', 'Facebook', <IconFacebook key="fb" />],
      ['https://pinterest.com', 'Pinterest', <IconPinterest key="pin" />],
    ].map(([href, label, icon]) => (
      <a
        key={label}
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        className="w-7 h-7 rounded-full border border-white/25 flex items-center justify-center text-white/85 hover:bg-white/10"
      >
        {icon}
      </a>
    ))}
  </div>
);

const StoreBadge = ({ store, sub }) => (
  <div className="relative">
    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-[1] px-1.5 py-[1px] rounded-full bg-[#C45C6A] text-white font-body text-[7px] font-bold tracking-wide whitespace-nowrap">
      COMING SOON
    </span>
    <span className="inline-flex flex-col justify-center bg-black text-white rounded-md px-2 py-1.5 min-w-[96px] sm:min-w-[108px] border border-white/10">
      <span className="font-body text-[8px] text-white/70 leading-none">{sub}</span>
      <span className="font-body text-[11px] font-semibold leading-tight mt-0.5">{store}</span>
    </span>
  </div>
);

const Footer = () => {
  const [open, setOpen] = useState(null);

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full text-white pb-[68px] md:pb-0">
      <button
        type="button"
        onClick={toTop}
        className="w-full bg-[#4A1614] py-2 font-body text-[11px] sm:text-[12px] tracking-wide text-white/90 hover:bg-[#3F1311]"
      >
        ▲ Back to top
      </button>

      <div className="relative overflow-hidden bg-[#2A100E]">
        <img
          src={HAWA}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-35 pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2A100E]/70 via-[#3F1612]/80 to-[#2A100E]" />

        <div className="relative z-[1]">
          <div className="footer-pichwai" aria-hidden />

          {/* Layer 1 — Heritage + brand + app */}
          <div className="site-container pt-4 pb-3 sm:pt-8 sm:pb-6 text-center">
            <p className="font-body text-[8px] sm:text-[10px] font-semibold tracking-[0.22em] uppercase text-[#E8C4A0]">
              — Rajasthani Heritage —
            </p>
            <h2 className="font-playfair font-semibold text-[16px] sm:text-[26px] md:text-[32px] leading-snug mt-1 px-2">
              Painted like a Pichwai, packed like an heirloom
            </h2>
            <p className="font-body text-[10px] sm:text-[13px] text-white/75 mt-1.5 max-w-xl mx-auto leading-snug line-clamp-2 sm:line-clamp-none">
              The same devotion Nathdwara artists bring to a temple hanging goes into every parcel that leaves our Jaipur workshops.
            </p>
          </div>

          <div className="site-container pb-3 sm:pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <img src="/jaipurio_logo.png" alt="Jaipurio" className="h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0" />
                <p className="font-playfair text-[13px] sm:text-[18px] leading-snug">
                  Commission a bespoke piece, or open your own boutique on Jaipurio.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  to="/vendor/register"
                  className="bg-[#6F241D] hover:bg-[#5A1C17] text-white font-body text-[11px] sm:text-[13px] font-semibold px-3.5 sm:px-5 py-2 rounded-full"
                >
                  Sell on Jaipurio
                </Link>
                <Link to="/contact" className="font-body text-[11px] sm:text-[13px] text-white/80 hover:text-white">
                  Contact Us
                </Link>
                <Social />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/10">
              <div className="min-w-0">
                <p className="font-body text-[11px] sm:text-[13px] font-semibold">Get the Jaipurio App</p>
                <p className="font-body text-[9px] sm:text-[11px] text-white/65 leading-snug">
                  Shop mitti crafts on the go.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <StoreBadge store="App Store" sub="Download on the" />
                <StoreBadge store="Google Play" sub="Get it on" />
              </div>
            </div>
          </div>

          {/* Layer 2 — Stats + actions + directory */}
          <div className="bg-[#F6EFE4] text-[#2B1E1A]">
            <div className="site-container py-2.5 sm:py-3">
              <div className="flex md:grid md:grid-cols-5 gap-3 overflow-x-auto scrollbar-none snap-x">
                {STATS.map(([n, l]) => (
                  <div key={l} className="snap-start shrink-0 min-w-[118px] md:min-w-0 text-center">
                    <p className="font-playfair font-semibold text-[15px] sm:text-[18px] leading-none">{n}</p>
                    <p className="font-body text-[9px] sm:text-[11px] text-[#6B5748] mt-0.5 leading-tight">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="site-container py-3 sm:py-5">
            <div className="flex lg:grid lg:grid-cols-3 gap-2 overflow-x-auto scrollbar-none snap-x">
              {ACTIONS.map((a) => (
                <Link
                  key={a.title}
                  to={a.to}
                  className="snap-start shrink-0 w-[232px] lg:w-auto rounded-xl border border-white/15 bg-black/25 p-3 hover:bg-black/35"
                >
                  <a.icon size={16} className="text-[#E8C4A0]" strokeWidth={1.8} />
                  <h3 className="font-playfair font-semibold text-[14px] sm:text-[16px] mt-1.5">{a.title}</h3>
                  <p className="font-body text-[10px] sm:text-[11px] text-white/70 mt-1 leading-snug line-clamp-2">
                    {a.copy}
                  </p>
                  <span className="font-body text-[10px] sm:text-[12px] font-semibold text-[#E8C4A0] mt-1.5 inline-block">
                    {a.link}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-4 sm:mt-6">
              <div className="flex items-end justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-playfair font-semibold text-[15px] sm:text-[20px]">Complete site directory</h3>
                  <p className="font-body text-[9px] sm:text-[11px] text-white/60 hidden sm:block">
                    Every category, artisan house, and customer page — tap a heading to open.
                  </p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full border border-white/20 font-body text-[9px] text-white/70">
                  40+ linked pages
                </span>
              </div>

              <div className="md:grid md:grid-cols-4 lg:grid-cols-7 md:gap-4 border-t border-white/10 md:border-0">
                {DIRECTORY.map((col, i) => {
                  const isOpen = open === i;
                  return (
                    <div key={col.title} className="border-b border-white/10 md:border-0">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between py-2 md:py-0 md:mb-2 md:pointer-events-none"
                        onClick={() => setOpen(isOpen ? null : i)}
                        aria-expanded={isOpen}
                      >
                        <span className="font-body text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E8C4A0]">
                          {col.title}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`md:hidden text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <ul className={`${isOpen ? 'block pb-2' : 'hidden'} md:block space-y-1`}>
                        {col.links.map(([label, to]) => (
                          <li key={label}>
                            <Link to={to} className="font-body text-[11px] text-white/80 hover:text-white">
                              {label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Layer 3 — Shipping + office */}
          <div className="border-t border-white/10">
            <div className="site-container py-3 sm:py-5">
              <p className="font-body text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E8C4A0] mb-1.5">
                Ships across India
              </p>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {INDIA_CITIES.map((c) => (
                  <span
                    key={c}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/20 font-body text-[10px] text-white/85"
                  >
                    <MapPin size={10} />
                    {c}
                  </span>
                ))}
              </div>

              <p className="font-body text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E8C4A0] mt-2.5 mb-1.5">
                International
              </p>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {INTL.map((c) => (
                  <span
                    key={c}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/20 font-body text-[10px] text-white/85"
                  >
                    <MapPin size={10} />
                    {c}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 sm:mt-4 items-start">
                <div>
                  <h4 className="font-playfair font-semibold text-[14px] sm:text-[16px]">Jaipurio Head Office</h4>
                  <p className="font-body text-[10px] sm:text-[12px] text-white/70 mt-1 leading-snug">{OFFICE}</p>
                  <a
                    href={MAPS_OPEN}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-1.5 font-body text-[11px] font-semibold text-[#E8C4A0]"
                  >
                    Open in Maps →
                  </a>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-white/15 h-[88px] sm:h-[140px] bg-black/30">
                  <iframe
                    title="Jaipurio Head Office map"
                    src={MAPS_EMBED}
                    className="w-full h-full pointer-events-none grayscale contrast-125 opacity-90"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <a
                    href={MAPS_OPEN}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0"
                    aria-label="Open Jaipurio head office in Google Maps"
                  />
                </div>
              </div>

              <p className="mt-3 pt-2 border-t border-white/10 font-body text-[9px] sm:text-[10px] text-white/45 text-center sm:text-left">
                © 2026 Jaipurio. All Rights Reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
