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
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFF8F5] border-t border-[#F3D5D0] md:hidden shadow-[0_-4px_16px_rgba(196,92,106,0.12)]"
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
                isActive ? 'text-[#6F241D]' : 'text-[#B08980]'
              }`}
            >
              <div
                className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full ${
                  isActive ? 'bg-[#F8D0C8]' : ''
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.label === 'Shop' && cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-1 bg-[#6F241D] text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span
                className={`font-body text-[10px] leading-none tracking-tight ${
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
