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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E8E2D9] md:hidden shadow-[0_-1px_8px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'max(2px, env(safe-area-inset-bottom))' }}
    >
      <div className="h-10 flex items-center justify-around px-1">
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
              className={`flex flex-col items-center justify-center relative flex-1 h-full ${
                isActive ? 'text-[#6F241D]' : 'text-[#8A7A6A]'
              }`}
            >
              <div className="relative inline-flex">
                <Icon size={15} strokeWidth={2.2} />
                {item.label === 'Shop' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-[#A94E2C] text-white text-[7px] font-bold min-w-[11px] h-[11px] px-0.5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="font-dm text-[7.5px] mt-0.5 font-medium leading-none">
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
