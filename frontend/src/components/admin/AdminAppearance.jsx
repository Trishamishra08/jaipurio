import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';
import AdminPageHeader from './AdminPageHeader';
import api from '../../utils/api';

const DEFAULT_THEME = {
  siteTitle: 'Jaipurio',
  tagline: 'Authentic Mitti & Handicraft Bazaar',
  headerStyle: 'Default',
  footerStyle: 'Classic',
};

const AdminAppearance = () => {
  const { pathname } = useLocation();
  const section = pathname.split('/').pop();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [options, setOptions] = useState(DEFAULT_THEME);
  const [menus, setMenus] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [css, setCss] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/settings');
      const s = res.data?.data?.settings || {};
      setSettings(s);
      setOptions({ ...DEFAULT_THEME, ...(s.theme || {}) });
      setMenus(Array.isArray(s.menus) ? s.menus : []);
      setWidgets(Array.isArray(s.widgets) ? s.widgets : []);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!settings) return;
    const field = { 'custom-css': 'customCss', 'custom-js': 'customJs', 'custom-html': 'customHtml', robots: 'robotsTxt' }[section];
    if (field) setCss(settings[field] || '');
  }, [section, settings]);

  const title = useMemo(() => {
    const map = {
      theme: 'Theme',
      menus: 'Menus',
      widgets: 'Widgets',
      'theme-options': 'Theme options',
      'custom-css': 'Custom CSS',
      'custom-js': 'Custom JS',
      'custom-html': 'Custom HTML',
      robots: 'Robots.txt Editor',
    };
    return map[section] || 'Appearance';
  }, [section]);

  const persist = async (patch) => {
    setSaving(true);
    setError('');
    try {
      await api.put('/settings', patch);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const saveCss = () => {
    const field = { 'custom-css': 'customCss', 'custom-js': 'customJs', 'custom-html': 'customHtml', robots: 'robotsTxt' }[section];
    if (field) persist({ [field]: css });
  };

  const saveOptions = (e) => {
    e.preventDefault();
    persist({ theme: options });
  };

  const addMenu = () => setMenus((prev) => [...prev, { name: 'New menu', location: 'Header', items: '' }]);
  const addWidget = () => setWidgets((prev) => [...prev, { name: 'New widget', sidebar: 'Footer' }]);

  return (
    <div>
      <AdminPageHeader title={title} hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {saved && <p className="text-sm text-emerald-700 mb-3">Saved successfully.</p>}

      {section === 'theme' && (
        <div className="admin-card p-5 max-w-2xl">
          <h2 className="text-base font-semibold mb-2">Activated theme</h2>
          <p className="text-sm text-slate-500 mb-4">Jaipurio Storefront — current public website theme.</p>
          <div className="rounded-lg overflow-hidden border border-slate-200">
            <img src={mediaUrl('/jaipurio_home_banner.jpg')} alt="Current theme" className="w-full h-40 object-cover" />
            <div className="p-3 text-sm font-medium">Jaipurio Heritage</div>
          </div>
        </div>
      )}

      {section === 'menus' && (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu, i) => (
                <tr key={i}>
                  <td><input className="admin-input" value={menu.name} onChange={(e) => setMenus((prev) => prev.map((m, idx) => idx === i ? { ...m, name: e.target.value } : m))} /></td>
                  <td><input className="admin-input" value={menu.location} onChange={(e) => setMenus((prev) => prev.map((m, idx) => idx === i ? { ...m, location: e.target.value } : m))} /></td>
                  <td><input className="admin-input" value={menu.items} onChange={(e) => setMenus((prev) => prev.map((m, idx) => idx === i ? { ...m, items: e.target.value } : m))} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 flex gap-2">
            <button type="button" className="admin-btn-light" onClick={addMenu}>Add menu</button>
            <button type="button" className="admin-btn-primary" disabled={saving} onClick={() => persist({ menus })}>Save menus</button>
          </div>
        </div>
      )}

      {section === 'widgets' && (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Widget</th>
                <th>Sidebar</th>
              </tr>
            </thead>
            <tbody>
              {widgets.map((w, i) => (
                <tr key={i}>
                  <td><input className="admin-input" value={w.name} onChange={(e) => setWidgets((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} /></td>
                  <td><input className="admin-input" value={w.sidebar} onChange={(e) => setWidgets((prev) => prev.map((x, idx) => idx === i ? { ...x, sidebar: e.target.value } : x))} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 flex gap-2">
            <button type="button" className="admin-btn-light" onClick={addWidget}>Add widget</button>
            <button type="button" className="admin-btn-primary" disabled={saving} onClick={() => persist({ widgets })}>Save widgets</button>
          </div>
        </div>
      )}

      {section === 'theme-options' && (
        <form onSubmit={saveOptions} className="admin-card p-5 max-w-2xl space-y-4">
          <label className="admin-field">
            <span>Site title</span>
            <input value={options.siteTitle} onChange={(e) => setOptions((p) => ({ ...p, siteTitle: e.target.value }))} />
          </label>
          <label className="admin-field">
            <span>Tagline</span>
            <input value={options.tagline} onChange={(e) => setOptions((p) => ({ ...p, tagline: e.target.value }))} />
          </label>
          <label className="admin-field">
            <span>Header style</span>
            <select value={options.headerStyle} onChange={(e) => setOptions((p) => ({ ...p, headerStyle: e.target.value }))}>
              <option>Default</option>
              <option>Centered</option>
              <option>Transparent</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Footer style</span>
            <select value={options.footerStyle} onChange={(e) => setOptions((p) => ({ ...p, footerStyle: e.target.value }))}>
              <option>Classic</option>
              <option>Minimal</option>
              <option>Columns</option>
            </select>
          </label>
          <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </form>
      )}

      {(section === 'custom-css' || section === 'custom-js' || section === 'custom-html' || section === 'robots') && (
        <div className="admin-card p-5">
          <textarea
            className="admin-code"
            rows={16}
            value={css}
            onChange={(e) => setCss(e.target.value)}
            placeholder={
              section === 'custom-css'
                ? '/* Custom CSS */'
                : section === 'custom-js'
                  ? '// Custom JS'
                  : section === 'custom-html'
                    ? '<!-- Custom HTML -->'
                    : 'User-agent: *\nDisallow:'
            }
          />
          <button type="button" className="admin-btn-primary mt-4" disabled={saving} onClick={saveCss}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-slate-400 mt-3">Loading…</p>}
    </div>
  );
};

export default AdminAppearance;
