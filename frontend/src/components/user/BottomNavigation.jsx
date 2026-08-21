import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Grid, ShoppingBag, Package, User } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

const BottomNavigation = () => {
  const location = useLocation();
  const { cartCount } = useShop();

  const navItems = [
    { label: 'Home', path: '/home', icon: HomeIcon },
    { label: 'Categories', path: '/shop', icon: Grid },
    { label: 'Shop', path: '/shop', icon: ShoppingBag },
    { label: 'Orders', path: '/orders', icon: Package },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/vendor')) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E8E2D9] md:hidden shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(4px, env(safe-area-inset-bottom))' }}
    >
      <div className="h-[58px] flex items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive =
            item.path === '/home'
              ? location.pathname === '/home'
              : item.label === 'Profile'
                ? location.pathname.startsWith('/profile')
                : item.label === 'Orders'
                  ? location.pathname.startsWith('/orders')
                  : location.pathname.startsWith('/shop');
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center relative flex-1 h-full gap-0.5 ${
                isActive ? 'text-[#6F241D]' : 'text-[#8A7A6A]'
              }`}
            >
              <div className="relative inline-flex">
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                {item.label === 'Shop' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#A94E2C] text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span
                className={`font-dm text-[10px] leading-none tracking-tight ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
