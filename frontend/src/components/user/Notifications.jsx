import React, { useState, useEffect, useCallback } from 'react';
import ProfileSidebar from './ProfileSidebar';
import { Bell, CheckCircle, Info, AlertTriangle, AlertCircle, Check } from 'lucide-react';
import api from '../../utils/api';

const TYPE_CONFIG = {
  info:    { icon: Info,          color: 'text-blue-500',   bg: 'bg-blue-50'   },
  success: { icon: CheckCircle,   color: 'text-emerald-600',bg: 'bg-emerald-50'},
  warning: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  alert:   { icon: AlertCircle,   color: 'text-red-500',    bg: 'bg-red-50'    },
};

const Notifications = () => {
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
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-4 md:pt-6 pb-12 font-sans selection:bg-[#054425] selection:text-white">
      <div className="w-full px-4 lg:px-8 flex flex-col lg:flex-row gap-6">

        <ProfileSidebar activeTab="notifications" />

        <div className="flex-1 flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-1">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#054425] mb-0.5">Notifications</h1>
              <p className="text-xs text-gray-500 font-medium">Updates, offers, and account alerts</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#054425] border border-[#054425]/20 bg-[#054425]/5 hover:bg-[#054425]/10 px-3 py-1.5 rounded-lg transition-all self-start md:self-auto"
              >
                <Check size={12} /> Mark all as read ({unreadCount})
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-[#054425] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {notifications.map(notif => {
                  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                  const IconComp = cfg.icon;
                  return (
                    <div
                      key={notif._id}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                      className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-all ${
                        notif.isRead
                          ? 'bg-white hover:bg-gray-50/60'
                          : 'bg-blue-50/20 hover:bg-blue-50/40 border-l-2 border-[#054425]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <IconComp size={18} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm font-semibold leading-tight ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{timeAgo(notif.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2.5 h-2.5 bg-[#054425] rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-serif font-bold text-gray-900 mb-1">All caught up!</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  No notifications yet. We'll let you know when there's something new.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Notifications;
