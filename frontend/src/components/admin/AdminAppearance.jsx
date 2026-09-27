import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';
import AdminPageHeader from './AdminPageHeader';
import AdminThemeOptions from './AdminThemeOptions';

const AdminAppearance = () => {
  const { pathname } = useLocation();
  const section = pathname.split('/').pop();

  const title = useMemo(() => {
    const map = {
      theme: 'Theme',
      'theme-options': 'Theme options',
    };
    return map[section] || 'Appearance';
  }, [section]);

  return (
    <div>
      {section !== 'theme-options' && <AdminPageHeader title={title} hideAction />}

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

      {section === 'theme-options' && (
        <AdminThemeOptions />
      )}
    </div>
  );
};

export default AdminAppearance;
