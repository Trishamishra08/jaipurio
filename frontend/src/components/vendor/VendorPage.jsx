import React from 'react';

const VendorPage = ({ title, hint, extra, children }) => (
  <div className="admin-app !min-h-0">
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div>
        <h1 className="admin-page-title">{title}</h1>
        {hint ? <p className="text-xs text-slate-500 mt-1 max-w-2xl">{hint}</p> : null}
      </div>
      {extra}
    </div>
    {children}
  </div>
);

export default VendorPage;
