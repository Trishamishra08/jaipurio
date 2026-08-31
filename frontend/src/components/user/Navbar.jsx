import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  ShoppingBag,
  X,
  ChevronRight,
  ChevronDown,
  MapPin,
  User,
  Heart,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';

const DESKTOP_NAV = [
  { to: '/home', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/blog', label: 'Journal' },
  { to: '/orders', label: 'Orders' },
  { to: '/contact', label: 'Contact' },
];

const MOBILE_NAV = [
  { to: '/home', label: 'Home' },
  { to: '/shop', label: 'All Mitti Crafts' },
  { to: '/blog', label: 'Journal' },
  { to: '/orders', label: 'My Orders' },
  { to: '/wishlist', label: 'Saved Wishlist' },
  { to: '/profile', label: 'My Profile' },
  { to: '/contact', label: 'Help & Support' },
];

const JaipurioLogo = ({ size = 'md' }) => {
  const titleSize =
    size === 'lg'
      ? 'text-[36px] xl:text-[40px]'
      : size === 'compact'
        ? 'text-[28px] xl:text-[30px]'
        : 'text-[26px] sm:text-[32px]';
  const tagSize =
    size === 'lg' ? 'text-[12px]' : size === 'compact' ? 'text-[9px] xl:text-[10px]' : 'text-[10px] sm:text-[11px]';
  const starSize = size === 'compact' ? 'text-xs' : 'text-sm sm:text-base';
  const showTagline = size !== 'compact';

  return (
    <Link to="/home" className="flex flex-col items-center max-w-full group">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        <span className={`text-[#A94E2C] ${starSize} font-brand leading-none`} aria-hidden="true">
          ✦
        </span>
        <span
          className={`font-brand ${titleSize} font-bold tracking-[0.06em] text-[#C45C6A] leading-none group-hover:text-[#8B2E3A] transition-colors`}
        >
          jaipurio
        </span>
        <span className={`text-[#A94E2C] ${starSize} font-brand leading-none`} aria-hidden="true">
          ✦
        </span>
      </div>
      {showTagline && (
        <span
          className={`font-brand ${tagSize} font-medium text-[#4A3A2F] tracking-wide italic leading-tight mt-0.5`}
        >
          Mitti ki khushboo, Rajasthan ki pehchaan
        </span>
      )}
    </Link>
  );
};

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [desktopSearch, setDesktopSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { cartCount, wishlistCount, setIsCartDrawerOpen, deliveryLocation } = useShop();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === '/home';
  const locationLabel = deliveryLocation?.label || 'Jaipur, Rajasthan';

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return undefined;
    }
    const onScroll = () => {
      if (window.innerWidth >= 1024) {
        setScrolled(false);
        return;
      }
      const threshold = 200;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isHome]);

  const handleSearch = (e, query, closeMobile = false) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/shop?search=${encodeURIComponent(q)}`);
      if (closeMobile) setSearchOpen(false);
    }
  };

  const openLocationPage = () => navigate('/location');

  const homeOverlay = isHome && !scrolled;

  const isActive = (to) =>
    pathname === to || (to !== '/home' && pathname.startsWith(to));

  const IconActions = ({ className = '' }) => (
    <div className={`flex items-center gap-1 sm:gap-1.5 text-[#2B1E1A] ${className}`}>
      <Link
        to="/wishlist"
        className="p-1.5 hover:text-[#A94E2C] transition-colors hidden sm:flex"
        aria-label="Wishlist"
      >
        <Heart size={20} strokeWidth={2.2} />
      </Link>
      <Link
        to="/notifications"
        className="p-1.5 hover:text-[#A94E2C] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={2.2} />
      </Link>
      <Link
        to="/profile"
        className="p-1.5 hover:text-[#A94E2C] transition-colors hidden sm:flex"
        aria-label="Profile"
      >
        <User size={20} strokeWidth={2.2} />
      </Link>
      <button
        type="button"
        onClick={() => setIsCartDrawerOpen(true)}
        className="p-1.5 -mr-1 hover:text-[#A94E2C] transition-colors relative"
        aria-label="Shopping Cart"
      >
        <div className="relative">
          <ShoppingBag size={21} strokeWidth={2.2} className="text-[#6F241D]" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#A94E2C] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white">
              {cartCount}
            </span>
          )}
        </div>
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-50">
      {/* Promo bar — all screens */}
      <div className="relative z-[60] bg-[#C45C6A] text-[#FFF0EE] py-1 px-3 text-center text-[10px] sm:text-xs tracking-wider font-dm">
        <span className="font-medium">Free Shipping on Orders Above ₹499 | 100% Pure Mitti</span>
      </div>

      {/* ─── MOBILE APP HEADER (unchanged behaviour) ─── */}
      <div
        className={`lg:hidden ${homeOverlay ? 'bg-transparent' : 'bg-white'} ${scrolled ? 'shadow-sm' : ''}`}
      >
        <div
          className={
            homeOverlay
              ? 'absolute left-0 right-0 top-full z-50'
              : 'relative border-b border-[#E8E2D9]'
          }
        >
          <div
            className={`w-full border-b border-[#E8E2D9]/80 ${
              homeOverlay ? 'bg-white/95 backdrop-blur-[2px]' : 'bg-white'
            }`}
          >
            <div className="site-container">
              <button
                type="button"
                onClick={openLocationPage}
                className="flex items-center gap-1.5 py-1 text-left w-full hover:opacity-80 transition-opacity"
                aria-label="Change delivery location"
              >
                <MapPin size={14} className="text-[#A94E2C] shrink-0" strokeWidth={2.4} />
                <div className="min-w-0 flex items-center gap-1">
                  <span className="text-[10px] text-[#806653] font-dm shrink-0">Deliver to</span>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#3F261B] truncate font-dm">
                    {locationLabel}
                  </span>
                  <ChevronDown size={13} className="text-[#6F241D] shrink-0" />
                </div>
              </button>
            </div>
          </div>

          <div className={homeOverlay ? 'bg-transparent' : 'bg-white'}>
            <div className="site-container">
              <div className="flex items-center justify-between py-1.5 sm:py-2">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-1.5 -ml-1 text-[#2B1E1A] hover:text-[#A94E2C] transition-colors"
                  aria-label="Open Menu"
                >
                  <Menu size={22} strokeWidth={2.2} />
                </button>

                <div className="flex flex-col items-center justify-center text-center px-2 flex-1 min-w-0">
                  <JaipurioLogo />
                </div>

                <div className="flex items-center gap-0.5 text-[#2B1E1A]">
                  <button
                    type="button"
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="p-1.5 hover:text-[#A94E2C] transition-colors"
                    aria-label="Search"
                  >
                    <Search size={20} strokeWidth={2.2} />
                  </button>
                  <Link
                    to="/notifications"
                    className="p-1.5 hover:text-[#A94E2C] transition-colors hidden xs:flex items-center"
                    aria-label="Notifications"
                  >
                    <Bell size={20} strokeWidth={2.2} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsCartDrawerOpen(true)}
                    className="p-1.5 -mr-1 hover:text-[#A94E2C] transition-colors relative"
                    aria-label="Shopping Cart"
                  >
                    <div className="relative">
                      <ShoppingBag size={21} strokeWidth={2.2} className="text-[#6F241D]" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-[#A94E2C] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                          {cartCount}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {searchOpen && (
                <div className="pb-3 pt-0.5">
                  <form
                    onSubmit={(e) => handleSearch(e, searchQuery, true)}
                    className="relative max-w-md mx-auto"
                  >
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search matkas, kulhads, planters..."
                      className="w-full pl-9 pr-20 py-1.5 bg-white border border-[#A94E2C] rounded-full text-xs text-[#2B1E1A] focus:outline-none focus:ring-1 focus:ring-[#A94E2C] font-dm shadow-sm"
                      autoFocus
                    />
                    <Search className="absolute left-3 top-2 text-[#A94E2C]" size={14} />
                    <button
                      type="submit"
                      className="absolute right-1 top-1 bottom-1 px-3 bg-[#6F241D] text-white text-[11px] font-semibold rounded-full font-dm"
                    >
                      Search
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP WEBSITE HEADER (compact) ─── */}
      <div className="hidden lg:block bg-white border-b border-[#E8E2D9] shadow-[0_1px_0_rgba(111,36,29,0.06)]">
        {/* Utility strip */}
        <div className="bg-[#FCF8F2] border-b border-[#E8E2D9]/80">
          <div className="site-container flex items-center justify-between py-0.5 text-[10px] xl:text-[11px] font-dm text-[#806653]">
            <button
              type="button"
              onClick={openLocationPage}
              className="flex items-center gap-1 hover:text-[#6F241D] transition-colors"
            >
              <MapPin size={12} className="text-[#A94E2C] shrink-0" strokeWidth={2.4} />
              <span>Deliver to</span>
              <span className="font-semibold text-[#3F261B]">{locationLabel}</span>
              <ChevronDown size={12} className="text-[#6F241D]" />
            </button>
            <div className="flex items-center gap-3 xl:gap-4">
              <span className="hidden xl:inline text-[#9A8B7A]">100% Handmade · Pan India Delivery</span>
              <Link to="/login" className="hover:text-[#6F241D] transition-colors">
                Login
              </Link>
              <span className="text-[#C4B5A0]">|</span>
              <Link to="/register" className="hover:text-[#6F241D] transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        </div>

        {/* Logo left · search fills middle · icons right */}
        <div className="site-container py-2">
          <div className="flex items-center gap-3 xl:gap-4">
            <Link
              to="/home"
              className="header-logo-wrap header-logo-animated shrink-0"
              aria-label="jaipurio home"
            >
              <img
                src="/jaipurio_logo_header.png"
                alt="Jaipurio"
                className="header-logo-img h-10 xl:h-11 w-auto min-w-[120px] object-contain object-left"
                draggable={false}
              />
            </Link>

            <form
              onSubmit={(e) => handleSearch(e, desktopSearch)}
              className="relative flex-1 min-w-0"
            >
              <input
                type="text"
                value={desktopSearch}
                onChange={(e) => setDesktopSearch(e.target.value)}
                placeholder="Search matkas, kulhads, planters..."
                className="w-full h-10 pl-10 pr-[92px] bg-[#FCF8F2] border border-[#E8D4B5] rounded-full text-[13px] text-[#2B1E1A] placeholder:text-[#9A8B7A] focus:outline-none focus:border-[#A94E2C] focus:ring-2 focus:ring-[#A94E2C]/15 font-dm shadow-[inset_0_1px_2px_rgba(111,36,29,0.04)]"
              />
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A94E2C] pointer-events-none"
                size={16}
                strokeWidth={2.2}
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-8 px-4 bg-[#6F241D] hover:bg-[#501914] text-white text-[11px] font-semibold rounded-full font-dm transition-colors"
              >
                Search
              </button>
            </form>

            <div className="shrink-0">
              <IconActions className="gap-0.5" />
            </div>
          </div>
        </div>

        {/* Nav row */}
        <nav className="border-t border-[#E8E2D9] bg-white" aria-label="Main navigation">
          <div className="site-container flex flex-wrap items-center justify-center gap-x-5 xl:gap-x-7 gap-y-0.5 py-1.5">
            {DESKTOP_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`font-dm text-xs xl:text-[13px] font-semibold tracking-wide uppercase transition-colors whitespace-nowrap ${
                  isActive(item.to)
                    ? 'text-[#6F241D] border-b-2 border-[#6F241D] pb-0.5'
                    : 'text-[#2B1E1A] hover:text-[#A94E2C]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/wishlist"
              className={`font-dm text-xs xl:text-[13px] font-semibold tracking-wide uppercase transition-colors whitespace-nowrap ${
                pathname.startsWith('/wishlist')
                  ? 'text-[#6F241D] border-b-2 border-[#6F241D] pb-0.5'
                  : 'text-[#2B1E1A] hover:text-[#A94E2C]'
              }`}
            >
              Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] flex lg:hidden">
          <div className="fixed inset-0 bg-black/55" onClick={() => setMobileMenuOpen(false)} />

          <div className="relative w-[82%] max-w-xs bg-white h-full shadow-2xl flex flex-col z-10">
            <div className="p-4 bg-[#6F241D] text-white flex items-center justify-between">
              <div>
                <h3 className="font-playfair font-semibold text-xl text-white tracking-wide">jaipurio</h3>
                <p className="font-playfair text-[10px] text-white/80 italic">
                  Mitti ki khushboo, Rajasthan ki pehchaan
                </p>
              </div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-1 text-white">
                <X size={20} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openLocationPage();
              }}
              className="mx-3 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-left shadow-sm"
            >
              <MapPin size={16} className="text-[#A94E2C] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-dm text-[9px] text-[#806653]">Deliver to</p>
                <p className="font-dm text-xs font-semibold text-[#3F261B] truncate">{locationLabel}</p>
              </div>
              <ChevronDown size={14} className="text-[#6F241D] shrink-0" />
            </button>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 font-dm">
              {MOBILE_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium text-[#3F261B] hover:bg-[#F7F3EE] transition-colors"
                >
                  <span>
                    {item.label}
                    {item.to === '/wishlist' && wishlistCount > 0 ? ` (${wishlistCount})` : ''}
                  </span>
                  <ChevronRight size={14} className="text-[#9A8B7A]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
