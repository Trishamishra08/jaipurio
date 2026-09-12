import React, { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';
import {
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  User,
  X,
} from 'lucide-react';
import { adminNav, isNavItemActive } from '../../data/adminNav';
import {
  getAdminTheme,
  getAdminUser,
  logoutAdmin,
  setAdminTheme,
} from '../../utils/adminAuth';
import { fetchAdminPendingCounts } from '../../utils/adminApi';
import AdminCommandPalette from './AdminCommandPalette';
import './admin.css';

const emptyBadges = {
  pendingProducts: 0,
  pendingOrders: 0,
  pendingReturns: 0,
  pendingPayouts: 0,
  pendingVendors: 0,
  pendingActions: 0,
  unreadNotifications: 0,
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [openMenus, setOpenMenus] = useState({});
  const [theme, setTheme] = useState(getAdminTheme);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [badges, setBadges] = useState(emptyBadges);
  const user = getAdminUser();

  const loadBadges = useCallback(async () => {
    try {
      const data = await fetchAdminPendingCounts();
      setBadges({ ...emptyBadges, ...data });
    } catch {
      setBadges(emptyBadges);
    }
  }, []);

  useEffect(() => {
    loadBadges();
    const interval = setInterval(loadBadges, 30000);
    const onRefresh = () => loadBadges();
    window.addEventListener('jaipurio:admin-badges-refresh', onRefresh);
    window.addEventListener('focus', onRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('jaipurio:admin-badges-refresh', onRefresh);
      window.removeEventListener('focus', onRefresh);
    };
  }, [loadBadges]);

  useEffect(() => {
    loadBadges();
  }, [location.pathname, loadBadges]);

  useEffect(() => {
    const parent = adminNav.find((item) => isNavItemActive(item, location.pathname) && item.children);
    if (parent) {
      setOpenMenus((prev) => ({ ...prev, [parent.id]: true }));
    }
    if (window.innerWidth < 1024) setSidebarOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || 'dashboard';
    const label = last.replace(/-/g, ' ');
    document.title = `${label.charAt(0).toUpperCase()}${label.slice(1)} | Jaipurio`;
  }, [location.pathname]);

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setAdminTheme(next);
  };

  return (
    <div className={`admin-app ${theme === 'dark' ? 'admin-dark' : ''}`}>
      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay lg:hidden"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-logo-wrap">
          <Link to="/admin" className="admin-logo-box">
            <img src={mediaUrl('/jaipurio_logo_sidebar.png')} alt="Jaipurio" />
          </Link>
        </div>

        <nav className="admin-nav">
          {adminNav.filter((item) => !item.hidden).map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item, location.pathname);
            const expanded = Boolean(openMenus[item.id]);
            const badge = item.badgeKey ? badges[item.badgeKey] : null;
            const showBadge = Number(badge) > 0;

            if (!item.children) {
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.title}</span>
                </NavLink>
              );
            }

            return (
              <div key={item.id} className="admin-nav-group">
                <button
                  type="button"
                  className={`admin-nav-link ${active ? 'is-active' : ''}`}
                  onClick={() => toggleMenu(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.title}</span>
                  {showBadge ? <em className="admin-nav-badge">{badge}</em> : null}
                  <ChevronDown size={14} className={`admin-nav-chevron ${expanded ? 'rotate-180' : ''}`} />
                </button>
                {expanded && (
                  <div className="admin-subnav">
                    {item.children.map((child) => {
                      const childBadge = child.badgeKey ? badges[child.badgeKey] : null;
                      const showChildBadge = Number(childBadge) > 0;
                      return (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) => `admin-subnav-link ${isActive ? 'is-active' : ''}`}
                      >
                        <span>{child.title}</span>
                        {showChildBadge ? <em className="admin-subnav-badge">{childBadge}</em> : null}
                      </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className={`admin-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <header className="admin-header">
          <button type="button" className="admin-icon-ghost" onClick={() => setSidebarOpen((v) => !v)}>
            {sidebarOpen && window.innerWidth < 1024 ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button type="button" className="admin-search" onClick={() => setPaletteOpen(true)}>
            <Search size={15} />
            <span>Search</span>
            <kbd>ctrl/cmd k</kbd>
          </button>

          <div className="admin-header-actions">
            <Link to="/home" target="_blank" className="admin-view-site">
              <Globe size={15} />
              View website
            </Link>

            <button type="button" className="admin-icon-ghost" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
              <button type="button" className="admin-icon-ghost" onClick={() => setNotifOpen((v) => !v)}>
                <Bell size={18} />
                {badges.pendingProducts > 0 ? (
                  <span className="admin-header-badge">{badges.pendingProducts}</span>
                ) : null}
              </button>
              {notifOpen && (
                <div className="admin-dropdown w-72">
                  <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm">Notifications</div>
                  {badges.pendingProducts > 0 ? (
                    <Link
                      to="/admin/products"
                      className="block px-4 py-3 text-sm hover:bg-slate-50 border-b border-slate-50"
                      onClick={() => setNotifOpen(false)}
                    >
                      <strong className="text-[#6F241D]">{badges.pendingProducts} product{badges.pendingProducts === 1 ? '' : 's'}</strong>
                      <span className="block text-slate-500 text-xs mt-0.5">Pending vendor approval</span>
                    </Link>
                  ) : (
                    <p className="px-4 py-6 text-sm text-slate-400 text-center">No pending approvals</p>
                  )}
                </div>
              )}
            </div>

            <Link to="/admin/orders" className="admin-icon-ghost">
              <ShoppingCart size={18} />
              {badges.pendingOrders > 0 ? (
                <span className="admin-header-badge">{badges.pendingOrders}</span>
              ) : null}
            </Link>

            <button type="button" className="admin-user" onClick={() => setProfileOpen((v) => !v)}>
              <span className="admin-avatar">{(user?.name || 'A').charAt(0)}</span>
              <span className="admin-user-meta">
                <strong>{user?.name || 'Admin Final'}</strong>
                <small>{user?.email || 'admin@gmail.com'}</small>
              </span>
            </button>

            {profileOpen && (
              <div className="admin-dropdown admin-user-menu">
                <Link to="/admin/settings" onClick={() => setProfileOpen(false)}>
                  <User size={15} /> Profile
                </Link>
                <Link to="/admin/settings" onClick={() => setProfileOpen(false)}>
                  <Settings size={15} /> Settings
                </Link>
                <button type="button" onClick={handleLogout}>
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>

      <AdminCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default AdminLayout;
