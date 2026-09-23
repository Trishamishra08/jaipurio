import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Pencil, Trash2, Search, X } from 'lucide-react';
import AdminPageHeader from './AdminPageHeader';
import { findModule } from '../../data/adminModules';
import { loadCollection, saveCollection, getActivityLogs } from '../../utils/adminAuth';
import { useShop } from '../../context/ShopContext';
import api from '../../utils/api';

const unwrap = (res) => res.data?.data ?? res.data;

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

const selectDisplayValue = (field, raw) => {
  if (typeof raw === 'boolean') {
    if (field.options?.includes('Yes') || field.options?.includes('No')) return raw ? 'Yes' : 'No';
    if (field.options?.includes('true') || field.options?.includes('false')) return String(raw);
  }
  return raw ?? '';
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
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const isApiBacked = Boolean(module?.api);

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

  const reloadFromApi = async () => {
    if (!module?.api) return;
    setLoading(true);
    setLoadError('');
    try {
      if (module.kind === 'settings') {
        const res = await api.get(`/${module.api}`);
        setSettings(unwrap(res) || module.seed || {});
      } else {
        const res = await api.get(`/${module.api}`, { params: module.apiListParams });
        const rows = unwrap(res);
        setItems((Array.isArray(rows) ? rows : []).map((r) => ({ ...r, id: r.id || r._id })));
      }
    } catch (err) {
      setLoadError(err?.parsedMessage || err?.message || 'Failed to load data');
      if (module.kind !== 'settings') setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!module) return;
    setQuery('');
    setModal(null);
    setLoadError('');
    if (module.api) {
      reloadFromApi();
      return;
    }
    if (module.kind === 'settings') {
      const saved = loadCollection(module.id, null);
      setSettings(saved && !Array.isArray(saved) ? saved : module.seed || {});
      return;
    }
    setItems(loadCollection(module.id, hydratedSeed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, hydratedSeed]);

  if (!module) {
    return (
      <div className="admin-card p-10 text-center">
        <h1 className="admin-page-title justify-center mb-2">Page not found</h1>
        <p className="text-sm text-slate-500">This admin section is not registered.</p>
      </div>
    );
  }

  const persist = async (next, action, payload) => {
    if (isApiBacked) {
      try {
        if (action === 'create') {
          await api.post(`/${module.api}`, { ...payload, ...module.apiCreateDefaults });
        } else if (action === 'update') {
          await api.put(`/${module.api}/${payload.id}`, payload);
        } else if (action === 'delete') {
          await api.delete(`/${module.api}/${payload.id}`);
        }
        await reloadFromApi();
      } catch (err) {
        window.alert(err?.parsedMessage || err?.message || 'Save failed');
      }
      return;
    }
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

  const saveRow = async (e) => {
    e.preventDefault();
    if (modal === 'create') {
      await persist([{ id: Date.now(), ...form }, ...items], 'create', form);
    } else {
      await persist(
        items.map((row) => (row.id === form.id ? { ...row, ...form } : row)),
        'update',
        form
      );
    }
    setModal(null);
  };

  const removeRow = async (id) => {
    if (!window.confirm('Do you really want to delete this record?')) return;
    await persist(items.filter((row) => row.id !== id), 'delete', { id });
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    if (isApiBacked) {
      try {
        await api.put(`/${module.api}`, settings);
        window.alert('Settings have been saved.');
      } catch (err) {
        window.alert(err?.parsedMessage || err?.message || 'Save failed');
      }
      return;
    }
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
                  value={selectDisplayValue(field, settings[field.key])}
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

      {loadError ? (
        <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
          {loadError}
        </div>
      ) : null}

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
                    {loading ? 'Loading…' : 'No data'}
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
