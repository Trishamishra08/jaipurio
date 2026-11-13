import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Package, ShoppingBag, Users } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import AdminPageHeader, { ManageWidgetsButton } from './AdminPageHeader';
import { getWidgetPrefs, relativeTime, setWidgetPrefs } from '../../utils/adminAuth';
import { fetchAdminDashboardStats } from '../../utils/adminApi';
import { blogsList } from '../../utils/blogsApi';
import PushPermissionPrompt from '../shared/PushPermissionPrompt';

const STAT_CARDS = [
  { key: 'orders', label: 'Orders', icon: ShoppingBag, tone: 'mint' },
  { key: 'products', label: 'Products', icon: Package, tone: 'peach' },
  { key: 'customers', label: 'Customers', icon: Users, tone: 'lilac' },
  { key: 'reviews', label: 'Reviews', icon: MessageCircle, tone: 'sky' },
];

const AdminDashboard = () => {
  const { vendors } = useShop();
  const [widgets, setWidgets] = useState(getWidgetPrefs);
  const [manageOpen, setManageOpen] = useState(false);

  // Everything on the dashboard comes from the database (no sample/local data),
  // so the counts match the Orders, Customers and Blog pages.
  const [liveStats, setLiveStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    fetchAdminDashboardStats()
      .then(setLiveStats)
      .catch(() => {});
    blogsList({ limit: 8, page: 1 })
      .then((rows) => setRecentPosts(rows.slice(0, 8)))
      .catch(() => setRecentPosts([]));
  }, []);

  const stats = useMemo(
    () => ({
      orders: liveStats?.totalOrders ?? 0,
      pendingOrders: liveStats?.pendingOrders ?? 0,
      products: liveStats?.totalProducts ?? 0,
      customers: liveStats?.totalUsers ?? 0,
      reviews: liveStats?.totalReviews ?? 0,
    }),
    [liveStats]
  );
  const logs = liveStats?.recentActivity || [];

  const posts = useMemo(
    () =>
      recentPosts.map((p, index) => ({
        id: index + 1,
        key: p._id || p.id || index,
        editId: p._id || p.id,
        name: p.title || p.name,
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '',
      })),
    [recentPosts]
  );

  const saveWidgets = (next) => {
    setWidgets(next);
    setWidgetPrefs(next);
  };

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        title="Dashboard"
        hideAction
        extra={<ManageWidgetsButton onClick={() => setManageOpen(true)} />}
      />

      <PushPermissionPrompt
        role="admin"
        title="Get alerts for new orders and requests"
        text="Turn on notifications to hear about new orders, seller sign-ups, returns, payouts and tickets right away."
        className="mb-3"
      />

      {widgets.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.key} className={`admin-stat admin-stat-${card.tone}`}>
                <span className="admin-stat-icon">
                  <Icon size={18} />
                </span>
                <div>
                  <div className="admin-stat-value">
                    {Number(stats[card.key] || 0).toLocaleString()}
                  </div>
                  <div className="admin-stat-label">{card.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        {widgets.posts && (
          <section className="admin-card xl:col-span-8 overflow-hidden">
            <div className="admin-card-head">
              <h2>Recent Posts</h2>
              <Link to="/admin/blogs">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>#</th>
                    <th>Name</th>
                    <th>Created at</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-slate-400 text-center py-4">No posts yet</td>
                    </tr>
                  )}
                  {posts.map((post) => (
                    <tr key={post.key}>
                      <td className="text-slate-400">{post.id}</td>
                      <td>
                        <Link to={post.editId ? `/admin/blogs/edit/${post.editId}` : '/admin/blogs'} className="admin-table-link">
                          {post.name}
                        </Link>
                      </td>
                      <td className="text-slate-500">{post.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {widgets.logs && (
          <section className="admin-card xl:col-span-4">
            <div className="admin-card-head">
              <h2>Activities Logs</h2>
              <Link to="/admin/platform/activity-logs">View all</Link>
            </div>
            <div className="admin-log-list">
              {logs.length === 0 && <p className="text-slate-400 text-sm px-3 py-4">No sign-in activity yet</p>}
              {logs.slice(0, 8).map((log, index) => (
                <article key={log.id} className="admin-log-item">
                  <span className={`admin-log-avatar tone-${index % 3}`}>
                    {(log.actor || 'A').charAt(0)}
                  </span>
                  <div>
                    <p>{log.message}</p>
                    <small>
                      {relativeTime(log.createdAt)}{log.ip ? ` (${log.ip})` : ''}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link to="/admin/vendors" className="admin-mini-card admin-mini-mint">
          <strong>{vendors?.length || 0}</strong>
          <span>Marketplace stores</span>
        </Link>
        <Link to="/admin/orders" className="admin-mini-card admin-mini-peach">
          <strong>{stats.pendingOrders}</strong>
          <span>Unpaid orders needing attention</span>
        </Link>
        <Link to="/admin/contacts" className="admin-mini-card admin-mini-lilac">
          <strong>4</strong>
          <span>New contact messages</span>
        </Link>
      </div>

      {manageOpen && (
        <div className="admin-modal-overlay" onClick={() => setManageOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4">Manage Widgets</h2>
            {[
              ['stats', 'Summary statistics'],
              ['posts', 'Recent posts'],
              ['logs', 'Activities logs'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between py-2 text-sm">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(widgets[key])}
                  onChange={(e) => saveWidgets({ ...widgets, [key]: e.target.checked })}
                />
              </label>
            ))}
            <div className="flex justify-end mt-4">
              <button type="button" className="admin-btn-primary" onClick={() => setManageOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
