import React, { useCallback, useEffect, useState } from 'react';
import VendorPage from './VendorPage';
import api from '../../utils/api';

const formatWhen = (createdAt) => {
  if (!createdAt) return '';
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const VendorNotifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.get('/notifications/me');
      setItems(Array.isArray(res.data?.data?.notifications) ? res.data.data.notifications : []);
    } catch (err) {
      setLoadError(err?.parsedMessage || err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* keep current state on failure */
    }
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      /* keep current state on failure */
    }
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <VendorPage
      title="Notifications"
      extra={
        <button type="button" className="admin-btn-light" onClick={markAllRead} disabled={!unreadCount}>
          Mark all read
        </button>
      }
    >
      {loading ? (
        <p className="text-xs text-slate-400 py-6 text-center">Loading notifications…</p>
      ) : loadError ? (
        <p className="text-xs text-red-600 py-6 text-center">{loadError}</p>
      ) : !items.length ? (
        <p className="text-xs text-slate-400 py-6 text-center">No notifications yet.</p>
      ) : (
        <div className="admin-card divide-y">
          {items.map((item) => (
            <article
              key={item._id}
              className={`px-4 py-3 cursor-pointer ${!item.isRead ? 'bg-[#f8eee6]' : ''}`}
              onClick={() => !item.isRead && markOneRead(item._id)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{item.title}</p>
                <span className="text-[10px] text-slate-400 shrink-0">{formatWhen(item.createdAt)}</span>
              </div>
              <p className="text-xs text-slate-500">{item.message}</p>
            </article>
          ))}
        </div>
      )}
    </VendorPage>
  );
};

export default VendorNotifications;
