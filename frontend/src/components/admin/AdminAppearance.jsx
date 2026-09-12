import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';
import AdminPageHeader from './AdminPageHeader';
import { loadCollection, saveCollection } from '../../utils/adminAuth';

const MENUS = [
  { id: 1, name: 'Main menu', location: 'Header', items: 'Home, Shop, About, Contact' },
  { id: 2, name: 'Footer menu', location: 'Footer', items: 'Privacy, Terms, Shipping' },
];

const WIDGETS = [
  { id: 1, name: 'Newsletter', sidebar: 'Footer' },
  { id: 2, name: 'Recent products', sidebar: 'Shop sidebar' },
  { id: 3, name: 'Product categories', sidebar: 'Shop sidebar' },
];

const AdminAppearance = () => {
  const { pathname } = useLocation();
  const section = pathname.split('/').pop();
  const storageKey = `appearance-${section}`;
  const [css, setCss] = useState(() => loadCollection(storageKey, { value: '' }).value || '');
  const [options, setOptions] = useState(() =>
    loadCollection('theme-options', {
      siteTitle: 'Jaipurio',
      tagline: 'Authentic Mitti & Handicraft Bazaar',
      headerStyle: 'Default',
      footerStyle: 'Classic',
    })
  );

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

  const saveCss = () => {
    saveCollection(storageKey, { value: css });
    window.alert('Saved successfully.');
  };

  const saveOptions = (e) => {
    e.preventDefault();
    saveCollection('theme-options', options);
    window.alert('Theme options have been saved.');
  };

  return (
    <div>
      <AdminPageHeader title={title} hideAction />

      {section === 'theme' && (
        <div className="admin-card p-5 max-w-2xl">
          <h2 className="text-base font-semibold mb-2">Activated theme</h2>
          <p className="text-sm text-slate-500 mb-4">Jaipurio Storefront â€” current public website theme.</p>
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
              {MENUS.map((menu) => (
                <tr key={menu.id}>
                  <td>{menu.name}</td>
                  <td>{menu.location}</td>
                  <td>{menu.items}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
              {WIDGETS.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.sidebar}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <button type="submit" className="admin-btn-primary">Save changes</button>
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
          <button type="button" className="admin-btn-primary mt-4" onClick={saveCss}>
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAppearance;
