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
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    const onScroll = () => setScrolled(window.scrollY > 220);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const openLocationPage = () => navigate('/location');

  const homeOverlay = isHome && !scrolled;

  return (
    <header
      className={`sticky top-0 z-50 ${homeOverlay ? 'bg-transparent' : 'bg-white'} ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="relative z-[60] bg-[#C45C6A] text-[#FFF0EE] py-1 px-3 text-center text-[10px] sm:text-xs tracking-wider font-dm">
        <span className="font-medium">Free Shipping on Orders Above ₹499 | 100% Pure Mitti</span>
      </div>

      <div
        className={
          homeOverlay
            ? 'absolute left-0 right-0 top-full z-50'
            : 'relative bg-white border-b border-[#E8E2D9]'
        }
      >
        <div
          className={`w-full border-b border-[#E8E2D9]/80 ${
            homeOverlay ? 'bg-white/95 backdrop-blur-[2px]' : 'bg-white'
          }`}
        >
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-5">
            <button
              type="button"
              onClick={openLocationPage}
              className="flex items-center gap-1.5 py-1 text-left w-full sm:w-auto hover:opacity-80 transition-opacity"
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
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-5">
            <div className="flex items-center justify-between py-1.5 sm:py-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 -ml-1 text-[#2B1E1A] hover:text-[#A94E2C] transition-colors"
                aria-label="Open Menu"
              >
                <Menu size={22} strokeWidth={2.2} />
              </button>

              <div className="flex flex-col items-center justify-center text-center px-2 flex-1 min-w-0">
                <Link to="/home" className="flex flex-col items-center max-w-full">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                    <span className="text-[#A94E2C] text-sm sm:text-base font-brand leading-none" aria-hidden="true">
                      ✦
                    </span>
                    <span className="font-brand text-[26px] sm:text-[32px] md:text-[38px] font-bold tracking-[0.05em] text-[#C45C6A] truncate leading-none">
                      jaipurio
                    </span>
                    <span className="text-[#A94E2C] text-sm sm:text-base font-brand leading-none" aria-hidden="true">
                      ✦
                    </span>
                  </div>
                  <span className="font-brand text-[10px] sm:text-[11px] font-medium text-[#4A3A2F] tracking-wide truncate max-w-[300px] sm:max-w-none italic leading-tight">
                    Mitti ki khushboo, Rajasthan ki pehchaan
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1.5 text-[#2B1E1A]">
                <button
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
                <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
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

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] flex">
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
              {[
                { to: '/home', label: 'Home' },
                { to: '/shop', label: 'All Mitti Crafts' },
                { to: '/orders', label: 'My Orders' },
                { to: '/wishlist', label: `Saved Wishlist (${wishlistCount})` },
                { to: '/profile', label: 'My Profile' },
                { to: '/contact', label: 'Help & Support' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium text-[#3F261B] hover:bg-[#F7F3EE] transition-colors"
                >
                  <span>{item.label}</span>
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
