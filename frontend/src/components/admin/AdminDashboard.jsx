import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Package, ShoppingBag, Users } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import AdminPageHeader, { ManageWidgetsButton } from './AdminPageHeader';
import { getActivityLogs, getWidgetPrefs, relativeTime, setWidgetPrefs } from '../../utils/adminAuth';

const STAT_CARDS = [
  { key: 'orders', label: 'Orders', icon: ShoppingBag, tone: 'mint' },
  { key: 'products', label: 'Products', icon: Package, tone: 'peach' },
  { key: 'customers', label: 'Customers', icon: Users, tone: 'lilac' },
  { key: 'reviews', label: 'Reviews', icon: MessageCircle, tone: 'sky' },
];

const AdminDashboard = () => {
  const { products, orders, reviews, vendors } = useShop();
  const [widgets, setWidgets] = useState(getWidgetPrefs);
  const [manageOpen, setManageOpen] = useState(false);
  const logs = getActivityLogs();

  const stats = useMemo(
    () => ({
      orders: orders?.length || 18,
      products: products?.length || 0,
      customers: 177,
      reviews: reviews?.length || 0,
    }),
    [orders, products, reviews]
  );

  const posts = useMemo(() => {
    const source = products?.length ? products : [];
    return source.slice(0, 8).map((p, index) => ({
      id: index + 1,
      name: p.name,
      createdAt: '2025-05-06',
    }));
  }, [products]);

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
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="text-slate-400">{post.id}</td>
                      <td>
                        <Link to="/admin/blogs" className="admin-table-link">
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
              {logs.slice(0, 8).map((log, index) => (
                <article key={log.id} className="admin-log-item">
                  <span className={`admin-log-avatar tone-${index % 3}`}>
                    {(log.actor || 'A').charAt(0)}
                  </span>
                  <div>
                    <p>{log.message}</p>
                    <small>
                      {relativeTime(log.createdAt)} ({log.ip})
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
          <strong>{stats.orders}</strong>
          <span>Orders needing attention</span>
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
