import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Pencil, Trash2, Search, X } from 'lucide-react';
import AdminPageHeader from './AdminPageHeader';
import { findModule } from '../../data/adminModules';
import { loadCollection, saveCollection, getActivityLogs } from '../../utils/adminAuth';
import { useShop } from '../../context/ShopContext';

const badgeClass = (status) => {
  const value = String(status || '').toLowerCase();
  if (['published', 'enabled', 'paid', 'completed', 'delivered', 'activated', 'subscribed', 'replied', 'verified'].includes(value)) {
    return 'admin-badge admin-badge-success';
  }
  if (['pending', 'unread', 'abandoned', 'awaiting payment', 'in transit', 'draft'].includes(value)) {
    return 'admin-badge admin-badge-warning';
  }
  if (['failed', 'rejected', 'disabled', 'deactivated', 'unsubscribed'].includes(value)) {
    return 'admin-badge admin-badge-danger';
  }
  return 'admin-badge admin-badge-info';
};

const emptyFromFields = (fields) =>
  (fields || []).reduce((acc, field) => {
    acc[field.key] = field.type === 'number' ? '' : field.options?.[0] || '';
    return acc;
  }, {});

const AdminCrudPage = () => {
  const { pathname } = useLocation();
  const module = findModule(pathname);
  const { products } = useShop();
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState({});
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const hydratedSeed = useMemo(() => {
    if (!module) return [];
    if (module.hydrate === 'product-prices') {
      return products.map((p, index) => ({
        id: p._id || index + 1,
        name: p.name,
        sku: `JP-${String(index + 1).padStart(4, '0')}`,
        price: p.price,
        oldPrice: p.oldPrice || '',
        status: 'Published',
      }));
    }
    if (module.hydrate === 'activity-logs') {
      return getActivityLogs().map((log, index) => ({
        id: log.id || index + 1,
        actor: log.actor,
        message: log.message,
        ip: log.ip,
        createdAt: log.createdAt?.slice(0, 10),
      }));
    }
    return module.seed || [];
  }, [module, products]);

  useEffect(() => {
    if (!module) return;
    if (module.kind === 'settings') {
      const saved = loadCollection(module.id, null);
      setSettings(saved && !Array.isArray(saved) ? saved : module.seed || {});
      return;
    }
    setItems(loadCollection(module.id, hydratedSeed));
    setQuery('');
    setModal(null);
  }, [module, hydratedSeed]);

  if (!module) {
    return (
      <div className="admin-card p-10 text-center">
        <h1 className="admin-page-title justify-center mb-2">Page not found</h1>
        <p className="text-sm text-slate-500">This admin section is not registered.</p>
      </div>
    );
  }

  const persist = (next) => {
    setItems(next);
    saveCollection(module.id, next);
  };

  const filtered = items.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return Object.values(row).some((value) => String(value).toLowerCase().includes(q));
  });

  const openCreate = () => {
    setForm(emptyFromFields(module.fields));
    setModal('create');
  };

  const openEdit = (row) => {
    setForm({ ...row });
    setModal('edit');
  };

  const saveRow = (e) => {
    e.preventDefault();
    if (modal === 'create') {
      persist([{ id: Date.now(), ...form }, ...items]);
    } else {
      persist(items.map((row) => (row.id === form.id ? { ...row, ...form } : row)));
    }
    setModal(null);
  };

  const removeRow = (id) => {
    if (!window.confirm('Do you really want to delete this record?')) return;
    persist(items.filter((row) => row.id !== id));
  };

  const saveSettings = (e) => {
    e.preventDefault();
    saveCollection(module.id, settings);
    window.alert('Settings have been saved.');
  };

  if (module.kind === 'settings') {
    return (
      <div>
        <AdminPageHeader title={module.title} hideAction extra={null} />
        <form onSubmit={saveSettings} className="admin-card p-5 max-w-3xl space-y-4">
          {(module.fields || []).map((field) => (
            <label key={field.key} className="admin-field">
              <span>{field.label}</span>
              {field.type === 'select' ? (
                <select
                  value={settings[field.key] ?? ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))}
                >
                  {field.options.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  rows={4}
                  value={settings[field.key] ?? ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  value={settings[field.key] ?? ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              )}
            </label>
          ))}
          <button type="submit" className="admin-btn-primary">Save settings</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title={module.title}
        hideAction={module.create === false}
        onAction={module.create === false ? undefined : openCreate}
      />

      <div className="admin-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="admin-input pl-8 w-64"
            />
          </div>
          <p className="text-xs text-slate-400">{filtered.length} record(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                {module.columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th className="text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={module.columns.length + 2} className="text-center text-slate-400 py-10">
                    No data
                  </td>
                </tr>
              )}
              {filtered.map((row, index) => (
                <tr key={row.id}>
                  <td className="text-slate-400">{index + 1}</td>
                  {module.columns.map((col) => (
                    <td key={col.key}>
                      {col.type === 'badge' ? (
                        <span className={badgeClass(row[col.key])}>{row[col.key] || '—'}</span>
                      ) : (
                        row[col.key] ?? '—'
                      )}
                    </td>
                  ))}
                  <td className="text-right whitespace-nowrap">
                    {module.create !== false && (
                      <button type="button" className="admin-icon-btn" onClick={() => openEdit(row)} title="Edit">
                        <Pencil size={14} />
                      </button>
                    )}
                    <button type="button" className="admin-icon-btn danger" onClick={() => removeRow(row.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <form className="admin-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveRow}>
            <div className="flex items-center justify-between mb-4">
              <h2>{modal === 'create' ? `Create ${module.title}` : `Edit ${module.title}`}</h2>
              <button type="button" onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {(module.fields || []).map((field) => (
                <label key={field.key} className="admin-field">
                  <span>{field.label}</span>
                  {field.type === 'select' ? (
                    <select value={form[field.key] ?? ''} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}>
                      {field.options.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea rows={3} value={form[field.key] ?? ''} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))} />
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      value={form[field.key] ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="admin-btn-light" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="admin-btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminCrudPage;
