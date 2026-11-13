import React, { useState, useEffect, useCallback } from 'react';
import {
  FiBell, FiTrash2, FiSend, FiRefreshCw,
  FiUsers, FiUser, FiInfo, FiCheckCircle,
  FiAlertTriangle, FiAlertCircle, FiShoppingBag
} from 'react-icons/fi';
import api from '../../utils/api';
import PushPermissionPrompt from '../shared/PushPermissionPrompt';
import { getPushState } from '../../services/pushNotificationService';

const TYPE_CONFIG = {
  info:    { icon: FiInfo,          color: 'text-blue-500',   bg: 'bg-blue-50',    border: 'border-blue-100'   },
  success: { icon: FiCheckCircle,   color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-100'  },
  warning: { icon: FiAlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50',  border: 'border-orange-100' },
  alert:   { icon: FiAlertCircle,   color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-100'    },
};

const ROLE_BADGE = {
  all:    { label: 'Everyone',     emoji: '👥', cls: 'text-purple-700 bg-purple-50 border-purple-100' },
  vendor: { label: 'Vendors',      emoji: '🏪', cls: 'text-green-700 bg-green-50 border-green-100'   },
  user:   { label: 'Customers',    emoji: '🧑', cls: 'text-blue-700 bg-blue-50 border-blue-100'      },
};

const initialForm = { title: '', message: '', type: 'info', targetRole: 'all', link: '', promotion: false };

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [form, setForm]             = useState(initialForm);
  const [mainTab, setMainTab]       = useState('send');    // 'send' | 'history'
  const [filterTab, setFilterTab]   = useState('all');     // 'all' | 'vendor' | 'user'
  const [stats, setStats]           = useState(null);      // { pushEnabled, devices: [{ role, platform, count }] }
  const [notice, setNotice]         = useState(null);      // { ok, text }
  const [testing, setTesting]       = useState(false);

  const loadStats = useCallback(() => {
    api.get('/admins/notifications/stats').then((res) => setStats(res.data?.data || null)).catch(() => setStats(null));
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  const sendTest = async () => {
    setTesting(true);
    setNotice(null);
    try {
      const res = await api.post('/admins/notifications/test');
      setNotice({ ok: Boolean(res.data?.success), text: res.data?.message || 'Done.' });
    } catch (err) {
      setNotice({ ok: false, text: err?.parsedMessage || 'Could not send the test notification.' });
    } finally {
      setTesting(false);
      loadStats();
    }
  };

  const deviceCount = (role) => (stats?.devices || []).filter((d) => d.role === role).reduce((n, d) => n + d.count, 0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admins/notifications');
      setNotifications(res.data.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    try {
      setSending(true);
      const payload = { ...form, link: form.link.trim() };
      if (!payload.link) delete payload.link;
      const res = await api.post('/admins/notifications', payload);
      setNotice(
        res.data?.data?.pushEnabled
          ? { ok: true, text: 'Sent: saved to inboxes and pushed to registered devices.' }
          : { ok: true, text: 'Saved to inboxes. Push was not sent because Firebase is not configured on the server yet.' }
      );
      loadStats();
      setForm(initialForm);
      setMainTab('history');
      setFilterTab(form.targetRole === 'all' ? 'all' : form.targetRole);
      fetchNotifications();
    } catch (err) {
      alert(err?.parsedMessage || err?.response?.data?.message || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await api.delete(`/admins/notifications/${id}`);
      fetchNotifications();
    } catch {
      alert('Delete failed.');
    }
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  // Filtered list for history
  const filteredNotifs = notifications.filter(n => {
    if (filterTab === 'all')    return true;
    if (filterTab === 'vendor') return n.targetRole === 'vendor' || n.targetRole === 'all';
    if (filterTab === 'user')   return n.targetRole === 'user'   || n.targetRole === 'all';
    return true;
  });

  const countFor = (role) => {
    if (role === 'all') return notifications.length;
    return notifications.filter(n => n.targetRole === role || n.targetRole === 'all').length;
  };

  return (
    <div className="px-6 py-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Notifications</h1>
          <p className="text-xs text-gray-400 mt-0.5">Broadcast updates to vendors and customers</p>
        </div>
        <button
          onClick={fetchNotifications}
          className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <FiRefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Push status for this browser and the whole site */}
      <PushPermissionPrompt
        role="admin"
        title="Get admin alerts on this device"
        text="New orders, seller sign-ups, returns, payout requests and support tickets, even when this tab is closed."
        dismissible={false}
        showBlocked
        onEnabled={loadStats}
      />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-gray-100 bg-white px-4 py-3 text-xs text-gray-600 shadow-sm">
        <span className={`inline-flex items-center gap-1.5 font-semibold ${stats?.pushEnabled ? 'text-green-700' : 'text-orange-600'}`}>
          <span className={`h-2 w-2 rounded-full ${stats?.pushEnabled ? 'bg-green-500' : 'bg-orange-400'}`} />
          {stats == null ? 'Checking push status…' : stats.pushEnabled ? 'Push is on' : 'Push is off (Firebase credentials missing on the server)'}
        </span>
        {stats && (
          <span>
            Devices: <strong>{deviceCount('user')}</strong> customers · <strong>{deviceCount('vendor')}</strong> sellers · <strong>{deviceCount('admin')}</strong> admins
          </span>
        )}
        <span>This browser: <strong>{{ enabled: 'registered', ready: 'allowed, not registered', default: 'not asked', denied: 'blocked', unsupported: 'unsupported', 'in-app': 'native app' }[getPushState('admin')]}</strong></span>
        <button
          type="button"
          onClick={sendTest}
          disabled={testing}
          className="ml-auto rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {testing ? 'Sending…' : 'Send test to my devices'}
        </button>
      </div>
      {notice && (
        <p className={`rounded-lg px-3 py-2 text-xs ${notice.ok ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>{notice.text}</p>
      )}

      {/* Main Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: 'send',    label: 'Send Notification' },
          { key: 'history', label: `History (${notifications.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              mainTab === tab.key
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── SEND FORM ─── */}
      {mainTab === 'send' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 max-w-2xl">
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. New Feature Available"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Write your notification message here..."
                required
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 bg-white"
                >
                  <option value="info">ℹ️ Info</option>
                  <option value="success">✅ Success</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="alert">🚨 Alert</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Send To</label>
                <select
                  value={form.targetRole}
                  onChange={e => setForm({ ...form, targetRole: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 bg-white"
                >
                  <option value="all">👥 Everyone</option>
                  <option value="vendor">🏪 All Vendors</option>
                  <option value="user">🧑 All Customers</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Opens (optional page)</label>
                <input
                  type="text"
                  value={form.link}
                  onChange={e => setForm({ ...form, link: e.target.value })}
                  placeholder="/shop or /vendor/orders"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all"
                />
              </div>
              <label className="flex items-end gap-2 pb-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={form.promotion}
                  onChange={e => setForm({ ...form, promotion: e.target.checked })}
                  className="mb-0.5 h-4 w-4"
                />
                <span>
                  Promotional message
                  <span className="block text-[10px] text-gray-400">Only people who opted in to offers get the push</span>
                </span>
              </label>
            </div>

            {/* Live Preview */}
            {form.title && (
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${TYPE_CONFIG[form.type]?.bg} ${TYPE_CONFIG[form.type]?.border}`}>
                {React.createElement(TYPE_CONFIG[form.type]?.icon, {
                  size: 16, className: TYPE_CONFIG[form.type]?.color
                })}
                <div>
                  <p className={`text-xs font-semibold ${TYPE_CONFIG[form.type]?.color}`}>{form.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{form.message || '...'}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    → {ROLE_BADGE[form.targetRole]?.emoji} {ROLE_BADGE[form.targetRole]?.label}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 bg-[#054425] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#043518] transition-colors disabled:opacity-60"
            >
              <FiSend size={13} />
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>
      )}

      {/* ─── HISTORY ─── */}
      {mainTab === 'history' && (
        <div className="space-y-3">
          {/* Filter tabs — separate vendor / user / all */}
          <div className="flex items-center gap-2">
            {[
              { key: 'all',    label: 'All',       icon: FiUsers,       count: countFor('all')    },
              { key: 'vendor', label: 'Vendors',   icon: FiShoppingBag, count: countFor('vendor') },
              { key: 'user',   label: 'Customers', icon: FiUser,        count: countFor('user')   },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setFilterTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filterTab === t.key
                      ? 'bg-[#054425] text-white border-[#054425] shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={12} />
                  {t.label}
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none ${
                    filterTab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-10 text-center text-xs text-gray-400 animate-pulse">Loading...</div>
            ) : filteredNotifs.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {filteredNotifs.map(n => {
                  const cfg  = TYPE_CONFIG[n.type]   || TYPE_CONFIG.info;
                  const role = ROLE_BADGE[n.targetRole] || ROLE_BADGE.all;
                  const IconComp = cfg.icon;
                  return (
                    <div
                      key={n._id}
                      className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-gray-50/40 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                          <IconComp size={14} className={cfg.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] rounded-full border font-semibold leading-none shrink-0 ${role.cls}`}>
                              {role.emoji} {role.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(n._id)}
                        title="Delete"
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0 mt-0.5"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <FiBell size={24} className="text-gray-200 mx-auto mb-3" />
                <p className="text-xs text-gray-400 italic">No notifications in this category.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
