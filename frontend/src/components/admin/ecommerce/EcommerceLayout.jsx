import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  FiSearch,
  FiMoon,
  FiSun,
  FiBell,
  FiMail,
  FiShoppingCart,
  FiExternalLink,
  FiMenu,
  FiChevronDown,
} from 'react-icons/fi';
import { adminNav, isNavItemActive, isChildNavActive } from '../../../data/adminNav';

/** Default destinations for common breadcrumb labels (last crumb stays plain text). */
const DEFAULT_CRUMB_LINKS = {
  DASHBOARD: '/admin',
  BLOG: '/admin/blogs',
  POSTS: '/admin/blogs',
  CATEGORIES: '/admin/blog/categories',
  PAGES: '/admin/pages',
  PRODUCTS: '/admin/ecommerce/products',
  CUSTOMERS: '/admin/ecommerce/customers',
  ORDERS: '/admin/ecommerce/orders',
  BRANDS: '/admin/ecommerce/brands',
  DISCOUNTS: '/admin/ecommerce/discounts',
  REVIEWS: '/admin/ecommerce/product-reviews',
  MARKETPLACE: '/admin/marketplaces/stores',
  STORES: '/admin/marketplaces/stores',
  WITHDRAWALS: '/admin/marketplaces/withdrawals',
  MEDIA: '/admin/media',
  SETTINGS: '/admin/settings',
};

const normalizeCrumb = (crumb) => {
  if (crumb && typeof crumb === 'object') {
    return {
      label: String(crumb.label || crumb.name || crumb.title || ''),
      to: crumb.to || crumb.path || null,
    };
  }
  const label = String(crumb || '');
  const key = label.trim().toUpperCase();
  return {
    label,
    to: DEFAULT_CRUMB_LINKS[key] || null,
  };
};

export const ecommerceNavItems = (adminNav.find((item) => item.id === 'ecommerce')?.children || []).map(
  (child, index) => ({
    id: child.path.split('/').pop() || `ecom-${index}`,
    title: child.title,
    path: child.path,
    count: child.badgeKey === 'pendingOrders' ? 17 : undefined,
  })
);

export const EcommerceLayout = ({ children, breadcrumb = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const crumbs = breadcrumb.map(normalizeCrumb).filter((c) => c.label);

  useEffect(() => {
    const parent = adminNav.find(
      (item) => item.children && isNavItemActive(item, location.pathname)
    );
    if (parent) {
      setOpenMenus((prev) => ({ ...prev, [parent.id]: true }));
    }
  }, [location.pathname]);

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const showEcommerceCrumb =
    location.pathname.startsWith('/admin/ecommerce') || location.pathname === '/admin/customers';

  return (
    <div className={`h-screen overflow-hidden flex flex-col font-sans ${darkMode ? 'bg-[#181F2C] text-slate-100 dark' : 'bg-[#F4F6F9] text-[#2c384e]'}`}>
      <header className={`h-14 shrink-0 ${darkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-[#1E293B] text-white border-b border-slate-800'} px-4 flex items-center justify-between z-50 shadow-xs`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Toggle navigation"
            type="button"
          >
            <FiMenu size={18} />
          </button>

          <Link to="/admin" className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-wider text-white">JAIPURIO</span>
          </Link>

          <div className="relative hidden md:block w-72 ml-4">
            <input
              type="text"
              placeholder="Search (ctrl/cmd + k)"
              className="w-full bg-[#2A374A] border border-slate-700 text-xs text-white placeholder-slate-400 rounded-md py-1.5 pl-8 pr-3 focus:outline-hidden focus:border-blue-500"
            />
            <FiSearch className="absolute left-2.5 top-2 text-slate-400" size={14} />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <a
            href="/home"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-slate-300 hover:text-white px-2 py-1 rounded-md hover:bg-slate-700 transition"
          >
            <FiExternalLink size={13} />
            <span>View website</span>
          </a>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-slate-700"
            title="Toggle theme"
            type="button"
          >
            {darkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>

          <button type="button" className="relative p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-slate-700">
            <FiBell size={15} />
            <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-[9px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center">0</span>
          </button>

          <button type="button" className="relative p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-slate-700">
            <FiMail size={15} />
            <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-[9px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center">10</span>
          </button>

          <button type="button" className="relative p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-slate-700">
            <FiShoppingCart size={15} />
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-[9px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center">17</span>
          </button>

          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-700">
            <div className="w-8 h-8 rounded-md bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div className="hidden lg:block text-left">
              <div className="font-semibold text-white leading-tight">Admin Final</div>
              <div className="text-[10px] text-slate-400">admin@gmail.com</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-0 hidden'} shrink-0 h-full ${darkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-[#202938] border-slate-800'} text-slate-300 transition-all duration-200 shadow-lg select-none overflow-y-auto overscroll-contain`}>
          <div className="p-3 space-y-0.5">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(item, location.pathname);
              const expanded = Boolean(openMenus[item.id]);
              const badge =
                item.badgeKey === 'pendingActions'
                  ? 17
                  : item.badgeKey === 'contacts'
                    ? 10
                    : null;

              if (!item.children) {
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      active
                        ? 'bg-[#0f172a] text-white font-medium'
                        : 'hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-blue-400' : ''} />
                    <span>{item.title}</span>
                  </Link>
                );
              }

              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition ${
                      active || expanded
                        ? 'text-white font-medium bg-[#111827] hover:bg-slate-800'
                        : 'hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={active ? 'text-blue-400' : ''} />
                      <span>{item.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {badge != null && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {badge}
                        </span>
                      )}
                      <FiChevronDown
                        size={14}
                        className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {expanded && (
                    <div className="mt-1 pl-2 space-y-0.5 border-l border-slate-700/60 ml-4 py-1">
                      {item.children.map((child) => {
                        const childActive = isChildNavActive(child.path, location.pathname);
                        const childCount =
                          child.badgeKey === 'pendingOrders'
                            ? 17
                            : child.badgeKey === 'pendingProducts'
                              ? null
                              : null;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                              childActive
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <span>{child.title}</span>
                            {childCount != null && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                  childActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-200'
                                }`}
                              >
                                {childCount}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-h-0 min-w-0 p-5 md:p-6 overflow-y-auto overflow-x-hidden overscroll-contain">
          {(crumbs.length > 0 || showEcommerceCrumb) && (
            <div className="flex items-center justify-between mb-4">
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
                <Link to="/admin" className="text-blue-600 hover:underline uppercase">
                  DASHBOARD
                </Link>
                {showEcommerceCrumb && (
                  <>
                    <span>/</span>
                    <Link to="/admin/ecommerce/products" className="uppercase text-blue-600 hover:underline">
                      ECOMMERCE
                    </Link>
                  </>
                )}
                {crumbs.map((crumb, idx) => {
                  const isLast = idx === crumbs.length - 1;
                  const className = `uppercase ${
                    isLast ? 'text-slate-600 font-semibold' : 'text-blue-600 hover:underline'
                  }`;
                  return (
                    <React.Fragment key={`${crumb.label}-${idx}`}>
                      <span>/</span>
                      {!isLast && crumb.to ? (
                        <Link to={crumb.to} className={className}>
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={className}>{crumb.label}</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>
          )}

          <div className="bg-transparent">{children || <Outlet />}</div>

          <footer className="mt-12 pt-4 border-t border-slate-200 text-slate-400 text-xs flex items-center justify-between">
            <span>Copyright 2026 © Jaipurio Admin. Version 1.22.1</span>
            <span>Page loaded in 0.42 seconds</span>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default EcommerceLayout;
