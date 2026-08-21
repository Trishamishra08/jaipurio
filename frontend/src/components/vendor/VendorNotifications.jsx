import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, AlertCircle, Check } from 'lucide-react';
import api from '../../utils/api';

const TYPE_CONFIG = {
  info:    { icon: Info,          color: 'text-blue-500',   bg: 'bg-blue-50'   },
  success: { icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50'  },
  warning: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  alert:   { icon: AlertCircle,   color: 'text-red-500',    bg: 'bg-red-50'    },
};

const VendorNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/me');
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return (
    <div className="h-60 flex items-center justify-center text-xs text-gray-400 animate-pulse">
      Loading notifications...
    </div>
  );

  return (
    <div className="space-y-4 pb-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Stay updated on your store's activity</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs text-[#054425] font-medium hover:underline"
          >
            <Check size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {notifications.map(notif => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
              const IconComp = cfg.icon;
              return (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                  className={`flex items-start gap-3 p-4 transition-colors cursor-pointer ${
                    notif.isRead ? 'bg-white hover:bg-gray-50/50' : 'bg-blue-50/30 hover:bg-blue-50/50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <IconComp size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm font-medium ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(notif.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center">
            <Bell size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No notifications yet.</p>
            <p className="text-xs text-gray-300 mt-1">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorNotifications;
