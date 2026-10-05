import React, { useCallback, useEffect, useState } from 'react';
import AdminPageHeader from './AdminPageHeader';
import { AdminDataTable } from './ecommerce/AdminDataTable';
import api from '../../utils/api';

const ALL_PERMISSIONS = [
  { key: 'manage_users', label: 'Manage Users' },
  { key: 'manage_settings', label: 'Manage Settings' },
  { key: 'manage_affiliates', label: 'Manage Affiliates' },
  { key: 'view_reports', label: 'View Reports' },
  { key: 'manage_orders', label: 'Manage Orders' },
  { key: 'manage_support', label: 'Manage Support' },
];

const EMPTY_FORM = { name: '', description: '', permissions: [] };

const AdminRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingId, setEditingId] = useState(null); // null = closed, 'new' = creating
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.get('/roles');
      setRoles(res.data?.data || []);
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load roles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId('new');
    setSaveError('');
  };

  const openEdit = (role) => {
    setForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions.includes('all') ? ['all'] : role.permissions,
    });
    setEditingId(role._id);
    setSaveError('');
  };

  const togglePermission = (key) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions.filter((p) => p !== 'all'), key],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setSaveError('Role name is required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      if (editingId === 'new') {
        await api.post('/roles', form);
      } else {
        await api.put(`/roles/${editingId}`, form);
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setSaveError(err.parsedMessage || err.message || 'Failed to save role.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role) => {
    if (role.isSystem) {
      window.alert(`"${role.name}" is a default system role and can't be deleted.`);
      return;
    }
    if (!window.confirm(`Delete role "${role.name}"? Admins assigned to it will lose this role's permissions.`)) return;
    try {
      await api.delete(`/roles/${role._id}`);
      await load();
    } catch (err) {
      window.alert(err.parsedMessage || err.message || 'Failed to delete role.');
    }
  };

  const columns = [
    {
      header: 'Role',
      accessor: 'name',
      cell: (row) => (
        <button type="button" onClick={() => openEdit(row)} className="text-blue-600 hover:underline font-semibold text-left">
          {row.name}
        </button>
      ),
    },
    { header: 'Description', accessor: 'description', cell: (row) => <span className="text-slate-500">{row.description || '—'}</span> },
    {
      header: 'Permissions',
      accessor: 'permissions',
      sortable: false,
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.permissions.includes('all') ? (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold">All permissions</span>
          ) : row.permissions.length ? (
            row.permissions.map((p) => (
              <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">{p}</span>
            ))
          ) : (
            <span className="text-slate-400 text-[11px]">No permissions</span>
          )}
        </div>
      ),
    },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => openEdit(row)} className="text-blue-600 hover:underline text-xs font-semibold">Edit</button>
          <button type="button" onClick={() => handleDelete(row)} className="text-red-600 hover:underline text-xs font-semibold">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Roles And Permissions" hideAction />

      {editingId && (
        <div className="admin-card p-4 space-y-3 border border-blue-100 bg-blue-50/30">
          <h3 className="text-sm font-semibold text-slate-800">{editingId === 'new' ? 'Create role' : 'Edit role'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="admin-field">
              <span>Name</span>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Description</span>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.permissions.includes('all')}
                onChange={(e) => setForm((f) => ({ ...f, permissions: e.target.checked ? ['all'] : [] }))}
              />
              <span className="text-xs font-semibold text-slate-700">All permissions (Super Administrator)</span>
            </label>
            {!form.permissions.includes('all') && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-6">
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePermission(p.key)} />
                    {p.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 bg-admin-dark text-white rounded-lg text-xs font-bold hover:bg-black transition-all disabled:opacity-60">{saving ? 'Saving…' : 'Save role'}</button>
            <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 py-8 text-center">Loading roles…</p>
      ) : loadError ? (
        <p className="text-sm text-red-600 py-8 text-center">{loadError}</p>
      ) : (
        <AdminDataTable
          title="Roles"
          columns={columns}
          data={roles}
          onCreate={openCreate}
          createLabel="Add role"
          onReload={load}
          showExport={false}
          showBulkActions={false}
        />
      )}
    </div>
  );
};

export default AdminRoles;
