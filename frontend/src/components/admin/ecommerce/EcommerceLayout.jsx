import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiShoppingBag,
  FiBox,
  FiRefreshCw,
  FiRotateCcw,
  FiTruck,
  FiFileText,
  FiDollarSign,
  FiLayers,
  FiTag,
  FiSliders,
  FiFolder,
  FiBookmark,
  FiAward,
  FiStar,
  FiZap,
  FiPercent,
  FiUsers,
  FiSearch,
  FiMoon,
  FiSun,
  FiBell,
  FiMail,
  FiShoppingCart,
  FiExternalLink,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';

export const ecommerceNavItems = [
  { id: 'reports', title: 'Report', path: '/admin/ecommerce/reports', icon: FiGrid },
  { id: 'orders', title: 'Orders', count: 17, path: '/admin/ecommerce/orders', icon: FiShoppingBag },
  { id: 'incomplete-orders', title: 'Incomplete orders', path: '/admin/ecommerce/incomplete-orders', icon: FiShoppingBag },
  { id: 'order-returns', title: 'Order returns', path: '/admin/ecommerce/order-returns', icon: FiRotateCcw },
  { id: 'shipments', title: 'Shipments', path: '/admin/ecommerce/shipments', icon: FiTruck },
  { id: 'invoices', title: 'Invoices', path: '/admin/ecommerce/invoices', icon: FiFileText },
  { id: 'products', title: 'Products', path: '/admin/ecommerce/products', icon: FiBox },
  { id: 'product-prices', title: 'Product Prices', path: '/admin/ecommerce/product-prices', icon: FiDollarSign },
  { id: 'product-inventory', title: 'Product Inventory', path: '/admin/ecommerce/product-inventory', icon: FiBox },
  { id: 'product-categories', title: 'Product categories', path: '/admin/ecommerce/product-categories', icon: FiLayers },
  { id: 'product-tags', title: 'Product tags', path: '/admin/ecommerce/product-tags', icon: FiTag },
  { id: 'product-attribute-sets', title: 'Product attributes', path: '/admin/ecommerce/product-attribute-sets', icon: FiSliders },
  { id: 'options', title: 'Product options', path: '/admin/ecommerce/options', icon: FiSliders },
  { id: 'product-collections', title: 'Product collections', path: '/admin/ecommerce/product-collections', icon: FiFolder },
  { id: 'product-labels', title: 'Product labels', path: '/admin/ecommerce/product-labels', icon: FiBookmark },
  { id: 'brands', title: 'Brands', path: '/admin/ecommerce/brands', icon: FiAward },
  { id: 'reviews', title: 'Reviews', path: '/admin/ecommerce/reviews', icon: FiStar },
  { id: 'flash-sales', title: 'Flash sales', path: '/admin/ecommerce/flash-sales', icon: FiZap },
  { id: 'discounts', title: 'Discounts', path: '/admin/ecommerce/discounts', icon: FiPercent },
  { id: 'customers', title: 'Customers', path: '/admin/customers', icon: FiUsers },
];

export const EcommerceLayout = ({ children, breadcrumb = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [ecommerceOpen, setEcommerceOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'bg-[#181F2C] text-slate-100 dark' : 'bg-[#F4F6F9] text-[#2c384e]'}`}>
      {/* Top Header Navbar */}
      <header className={`h-14 ${darkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-[#1E293B] text-white border-b border-slate-800'} px-4 flex items-center justify-between sticky top-0 z-50 shadow-xs`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Toggle navigation"
          >
            <FiMenu size={18} />
          </button>
          
          <Link to="/admin" className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-wider text-white">JAIPURIO</span>
          </Link>

          {/* Search box */}
          <div className="relative hidden md:block w-72 ml-4">
            <input 
              type="text" 
              placeholder="Search (ctrl/cmd + k)" 
              className="w-full bg-[#2A374A] border border-slate-700 text-xs text-white placeholder-slate-400 rounded-md py-1.5 pl-8 pr-3 focus:outline-hidden focus:border-blue-500"
            />
            <FiSearch className="absolute left-2.5 top-2 text-slate-400" size={14} />
          </div>
        </div>

        {/* Right tools */}
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
          >
            {darkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>

          <button className="relative p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-slate-700">
            <FiBell size={15} />
            <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-[9px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center">0</span>
          </button>

          <button className="relative p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-slate-700">
            <FiMail size={15} />
            <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-[9px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center">10</span>
          </button>

          <button className="relative p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-slate-700">
            <FiShoppingCart size={15} />
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-[9px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center">17</span>
          </button>

          {/* User profile */}
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

      {/* Main workspace container */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-0 hidden'} shrink-0 ${darkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-[#202938] border-slate-800'} text-slate-300 min-h-[calc(100vh-3.5rem)] transition-all duration-200 shadow-lg select-none`}>
          <div className="p-3 space-y-1">
            <Link 
              to="/admin" 
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-800/80 hover:text-white transition-colors ${
                location.pathname === '/admin' ? 'bg-[#0f172a] text-white font-medium' : ''
              }`}
            >
              <FiGrid size={16} />
              <span>Dashboard</span>
            </Link>

            {/* Ecommerce dropdown */}
            <div>
              <button 
                onClick={() => setEcommerceOpen(!ecommerceOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-white font-medium bg-[#111827] hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <FiShoppingBag size={16} className="text-blue-400" />
                  <span>Ecommerce</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">17</span>
                  <FiChevronDown size={14} className={`transform transition-transform ${ecommerceOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {ecommerceOpen && (
                <div className="mt-1 pl-2 space-y-0.5 border-l border-slate-700/60 ml-4 py-1">
                  {ecommerceNavItems.map(item => {
                    // Exact match for all items EXCEPT those with detail sub-routes (orders, products)
                    const hasSubRoutes = item.id === 'orders' || item.id === 'products';
                    const isActive = location.pathname === item.path ||
                      (hasSubRoutes && location.pathname.startsWith(item.path + '/'));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                          isActive 
                            ? 'bg-blue-600 text-white font-semibold' 
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                          <span>{item.title}</span>
                        </div>
                        {item.count && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-200'
                          }`}>
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Other admin links */}
            <div className="pt-2 border-t border-slate-700/60">
              <Link to="/admin/customers" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-800/80 hover:text-white transition-colors">
                <FiUsers size={16} />
                <span>Customers</span>
              </Link>
              <Link to="/admin/vendors" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-800/80 hover:text-white transition-colors">
                <FiUsers size={16} />
                <span>Vendors</span>
              </Link>
              <Link to="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-800/80 hover:text-white transition-colors">
                <FiSliders size={16} />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content View */}
        <main className="flex-1 p-5 md:p-6 overflow-x-hidden">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between mb-4">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Link to="/admin" className="text-blue-600 hover:underline uppercase">DASHBOARD</Link>
              <span>/</span>
              <span className="uppercase text-slate-400">ECOMMERCE</span>
              {breadcrumb.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span>/</span>
                  <span className={`uppercase ${idx === breadcrumb.length - 1 ? 'text-slate-600 font-semibold' : 'text-blue-600'}`}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Page Content */}
          <div className="bg-transparent">
            {children || <Outlet />}
          </div>

          {/* Footer status */}
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
