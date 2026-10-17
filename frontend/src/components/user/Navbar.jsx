import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';
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
import { useMobileMenu } from '../../utils/useMobileMenu';
import { useCategoryTree } from '../../utils/useCategoryTree';
import { CATEGORIES_TOKEN, isExternalUrl, resolveMenuUrl } from '../../utils/menuUrl';

const DESKTOP_NAV = [
  { to: '/home', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/blog', label: 'Journal' },
  { to: '/orders', label: 'Orders' },
  { to: '/contact', label: 'Contact' },
];

const ROW =
  'flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium text-[#3F261B] hover:bg-[#F7F3EE] transition-colors';

const MenuLink = ({ url, className = ROW, onNavigate, categories, children }) => {
  const href = resolveMenuUrl(url, categories);
  return isExternalUrl(href) ? (
    <a href={href} target="_blank" rel="noreferrer" onClick={onNavigate} className={className}>
      {children}
    </a>
  ) : (
    <Link to={href} onClick={onNavigate} className={className}>
      {children}
    </Link>
  );
};

/** Categories (flat list with parent ids) → nested tree, keeping the API's order. */
const buildCategoryTree = (categories) => {
  const nodes = new Map(categories.map((c) => [c.id, { ...c, children: [] }]));
  const roots = [];
  nodes.forEach((n) => {
    const parent = n.parent && nodes.get(n.parent);
    (parent ? parent.children : roots).push(n);
  });
  return roots;
};

/** The slide-out menu: admin-managed items; "Shop by Category" opens the live category tree, level by level. */
const DrawerMenu = ({ items, categories, wishlistCount, onNavigate }) => {
  // Every section opens and closes on its own — opening a sub-category keeps its parents open.
  const [open, setOpen] = useState(() => new Set());
  const toggle = (key) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const tree = buildCategoryTree(categories);
  const shopHref = (name) => `/shop?category=${encodeURIComponent(name)}`;

  // A row that opens/closes a list of children (the label itself still links to its page).
  const renderExpander = (id, label, to, children, depth = 0) => (
    <div key={id}>
      <div className="flex items-stretch">
        <MenuLink url={to} categories={categories} onNavigate={onNavigate} className={`${ROW} flex-1 ${depth ? '!py-2 !text-[12.5px]' : ''}`}>
          <span>{label}</span>
        </MenuLink>
        <button
          type="button"
          onClick={() => toggle(id)}
          aria-expanded={open.has(id)}
          aria-label={`${open.has(id) ? 'Hide' : 'Show'} ${label}`}
          className="px-3 text-[#9A8B7A] hover:text-[#6F241D]"
        >
          <ChevronDown size={16} className={`transition-transform ${open.has(id) ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open.has(id) && <div className="ml-3 pl-3 border-l border-[#EDE8E0] mb-1 space-y-0.5">{children}</div>}
    </div>
  );

  // One category and everything below it, as deep as the tree goes.
  const renderCategory = (node, depth = 0) =>
    node.children.length ? (
      renderExpander(`cat-${node.id}`, node.name, shopHref(node.name), node.children.map((c) => renderCategory(c, depth + 1)), depth)
    ) : (
      <MenuLink
        key={node.id}
        url={shopHref(node.name)}
        categories={categories}
        onNavigate={onNavigate}
        className={`${ROW} ${depth ? '!py-2 !text-[12.5px]' : ''}`}
      >
        {node.name}
      </MenuLink>
    );

  return (
    <>
      {items.map((item) => {
        if (item.url === CATEGORIES_TOKEN) {
          return renderExpander(item.id, item.title, '/shop', tree.map((n) => renderCategory(n, 1)));
        }
        if (item.children && item.children.length) {
          return renderExpander(
            item.id,
            item.title,
            item.url || '/shop',
            item.children.map((child) => (
              <MenuLink key={child.id} url={child.url} categories={categories} onNavigate={onNavigate} className={`${ROW} !py-2 !text-[12.5px]`}>
                {child.title}
              </MenuLink>
            )),
            0
          );
        }
        const isWishlist = resolveMenuUrl(item.url, categories) === '/wishlist';
        return (
          <MenuLink key={item.id} url={item.url} categories={categories} onNavigate={onNavigate}>
            <span>
              {item.title}
              {isWishlist && wishlistCount > 0 ? ` (${wishlistCount})` : ''}
            </span>
            <ChevronRight size={14} className="text-[#9A8B7A]" />
          </MenuLink>
        );
      })}
    </>
  );
};

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [desktopSearch, setDesktopSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { cartCount, wishlistCount, setIsCartDrawerOpen, deliveryLocation } = useShop();
  const menuItems = useMobileMenu();
  const { categories: menuCategories } = useCategoryTree();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  // Any navigation (menu row, bottom tab, logo, back button) closes the side menu.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.key]);
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

  // On the home page (until you scroll) the phone header's menu/logo/icon row
  // sits on top of the hero banner; the delivery-location strip stays solid.
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
        <div className={`relative ${homeOverlay ? '' : 'border-b border-[#E8E2D9]'}`}>
          <div className="w-full border-b border-[#E8E2D9]/80 bg-white">
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

          <div
            className={
              homeOverlay
                ? 'absolute left-0 right-0 top-full z-50 bg-gradient-to-b from-white/90 via-white/55 to-transparent'
                : 'bg-white'
            }
          >
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

                <Link to="/home" className="flex items-center justify-center px-2 flex-1 min-w-0" aria-label="Jaipurio home">
                  <img
                    src={mediaUrl('/jaipurio_logo_trim.png')}
                    alt="Jaipurio"
                    className="h-7 sm:h-8 w-auto object-contain"
                  />
                </Link>

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
                src={mediaUrl('/jaipurio_logo_header.png')}
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
            <div className="px-4 py-2 bg-white border-b-2 border-[#C45C6A] flex items-center justify-between">
              <Link to="/home" onClick={() => setMobileMenuOpen(false)} aria-label="Jaipurio home">
                <img src={mediaUrl('/jaipurio_logo_trim.png')} alt="Jaipurio" className="h-9 w-auto object-contain my-2" />
              </Link>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-1 text-[#6F241D]">
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
              <DrawerMenu
                items={menuItems}
                categories={menuCategories}
                wishlistCount={wishlistCount}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
