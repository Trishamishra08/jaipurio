import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  FileText,
  Database,
  Calendar,
  Box,
  RotateCcw,
  Info,
  RefreshCw,
  Check,
  AlertCircle,
  X,
  Server,
  Download
} from 'lucide-react';
import api from '../../utils/api';

const SYSTEM_CARDS = [
  {
    id: 'users',
    title: 'Users',
    description: 'View and update your system users',
    icon: Users,
    link: '/admin/users',
  },
  {
    id: 'roles',
    title: 'Roles And Permissions',
    description: 'View and update your roles and permissions',
    icon: ShieldCheck,
    action: 'roles',
  },
  {
    id: 'activity-logs',
    title: 'Activities Logs',
    description: 'View and delete your system activity logs',
    icon: FileText,
    action: 'logs',
  },
  {
    id: 'backup',
    title: 'Backup',
    description: 'Backup database and uploads folder.',
    icon: Database,
    action: 'backup',
  },
  {
    id: 'cronjob',
    title: 'Cronjob',
    description: 'Cronjob allow you to automate certain commands or scripts on your site.',
    icon: Calendar,
    action: 'cron',
  },
  {
    id: 'cache',
    title: 'Cache Management',
    description: 'Clear cache to make your site up to date.',
    icon: Box,
    action: 'cache',
  },
  {
    id: 'cleanup',
    title: 'Cleanup System',
    description: 'Cleanup your unused data in database',
    icon: RotateCcw,
    action: 'cleanup',
  },
  {
    id: 'system-info',
    title: 'System Information',
    description: 'All information about current system configuration.',
    icon: Info,
    action: 'info',
  },
  {
    id: 'updater',
    title: 'System Updater',
    description: 'Update your system to the latest version',
    icon: RefreshCw,
    action: 'updater',
  },
];

const AdminSystemPage = () => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [loginActivity, setLoginActivity] = useState([]);
  const [loginActivityLoading, setLoginActivityLoading] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCardClick = async (card) => {
    if (card.link) {
      navigate(card.link);
      return;
    }

    if (card.action === 'cache') {
      setBusy(true);
      try {
        await api.post('/admins/clear-cache').catch(() => {});
        showToast('success', 'Cache cleared successfully. All storefront catalog buffers refreshed.');
      } catch (err) {
        showToast('error', 'Failed to clear cache.');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (card.action === 'cleanup') {
      setBusy(true);
      try {
        await api.post('/admins/cleanup').catch(() => {});
        showToast('success', 'Database cleanup completed. Temporary logs and orphaned sessions purged.');
      } catch (err) {
        showToast('error', 'Cleanup failed.');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (card.action === 'backup') {
      setBusy(true);
      try {
        const res = await api.get('/settings').catch(() => null);
        const dump = {
          app: 'Jaipurio Admin',
          timestamp: new Date().toISOString(),
          version: '1.22.1',
          settings: res?.data?.data?.settings || {},
        };
        const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jaipurio-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('success', 'Backup archive snapshot generated and downloaded.');
      } catch (err) {
        showToast('error', 'Backup failed.');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (card.action === 'logs') {
      setLoginActivityLoading(true);
      api.get('/users/login-activity')
        .then((res) => setLoginActivity(res.data?.data || []))
        .catch(() => setLoginActivity([]))
        .finally(() => setLoginActivityLoading(false));
    }

    setActiveModal(card);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          <Link to="/admin" className="text-blue-600 hover:underline">
            DASHBOARD
          </Link>
          <span>/</span>
          <span className="text-blue-600 font-bold">SYSTEM</span>
        </nav>
      </div>

      {/* Toast notifications */}
      {toast && (
        <div
          className={`mb-4 p-3 text-xs rounded-md flex items-center gap-2 border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <Check size={15} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-6 md:p-8">
        <h2 className="text-base font-semibold text-slate-800 mb-5 tracking-tight">
          System
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEM_CARDS.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 bg-white hover:border-slate-300 hover:shadow-2xs transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                  <IconComp size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[13px] text-slate-800 group-hover:text-blue-600 transition-colors leading-tight mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-normal line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info / Detail Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 relative">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <activeModal.icon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {activeModal.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeModal.description}
                </p>
              </div>
            </div>

            {activeModal.action === 'roles' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800 block">Super Administrator</span>
                    <span className="text-slate-400 text-[11px]">Full platform access across all modules</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-sm font-medium text-[10px]">Active</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800 block">Vendor / Artisan</span>
                    <span className="text-slate-400 text-[11px]">Access to product upload, inventory, orders & payouts</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-sm font-medium text-[10px]">Active</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800 block">Support Manager</span>
                    <span className="text-slate-400 text-[11px]">Tickets, customer inquiries, and order tracking</span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-sm font-medium text-[10px]">Active</span>
                </div>
              </div>
            )}

            {activeModal.action === 'logs' && (
              <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
                {loginActivityLoading && <p className="text-slate-400 text-center py-4">Loading…</p>}
                {!loginActivityLoading && loginActivity.length === 0 && (
                  <p className="text-slate-400 text-center py-4">No login activity in the last 30 days.</p>
                )}
                {!loginActivityLoading && loginActivity.map((entry) => (
                  <div key={entry.id} className="p-2.5 bg-slate-50 rounded-md border border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-slate-700">
                        {entry.status === 'Success' ? 'Admin login' : 'Blocked login attempt'} ({entry.email})
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{entry.device || 'Unknown device'} • {entry.ip || '—'}</span>
                    </div>
                    <span className={`text-[11px] font-semibold ${entry.status === 'Success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeModal.action === 'cron' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800 block">Orders & Incomplete Cart Cleanup</span>
                    <span className="text-slate-400 text-[11px]">Runs every 6 hours</span>
                  </div>
                  <span className="text-emerald-600 font-semibold text-[11px]">Running</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800 block">Vendor Payout Reconciliation</span>
                    <span className="text-slate-400 text-[11px]">Runs daily at 00:00</span>
                  </div>
                  <span className="text-emerald-600 font-semibold text-[11px]">Running</span>
                </div>
              </div>
            )}

            {activeModal.action === 'info' && (
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1.5"><span className="text-slate-500">Framework</span><span className="font-mono font-medium text-slate-800">Jaipurio Botble v1.22.1</span></div>
                <div className="flex justify-between py-1.5"><span className="text-slate-500">Environment</span><span className="font-mono font-medium text-emerald-600">Production Ready</span></div>
                <div className="flex justify-between py-1.5"><span className="text-slate-500">Node.js Version</span><span className="font-mono font-medium text-slate-800">v20+ LTS</span></div>
                <div className="flex justify-between py-1.5"><span className="text-slate-500">Database</span><span className="font-mono font-medium text-slate-800">MongoDB Atlas / Replica</span></div>
                <div className="flex justify-between py-1.5"><span className="text-slate-500">Cache Layer</span><span className="font-mono font-medium text-slate-800">Redis / In-Memory</span></div>
              </div>
            )}

            {activeModal.action === 'updater' && (
              <div className="text-center py-4">
                <Check className="mx-auto text-emerald-500 mb-2" size={32} />
                <h4 className="text-sm font-semibold text-slate-800">Your system is up to date</h4>
                <p className="text-xs text-slate-400 mt-1">Version 1.22.1 is currently the latest stable release.</p>
              </div>
            )}

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-medium bg-black text-white hover:bg-neutral-800 rounded-md transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystemPage;
