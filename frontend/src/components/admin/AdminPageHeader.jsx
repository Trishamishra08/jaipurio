import React from 'react';
import { Plus, LayoutGrid } from 'lucide-react';

const AdminPageHeader = ({ title, actionLabel = 'Create', onAction, extra, hideAction }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 className="admin-page-title">{title}</h1>
      <div className="flex items-center gap-2">
        {extra}
        {!hideAction && onAction && (
          <button type="button" onClick={onAction} className="admin-btn-primary">
            <Plus size={15} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export const ManageWidgetsButton = ({ onClick }) => (
  <button type="button" onClick={onClick} className="admin-btn-light">
    <LayoutGrid size={15} />
    Manage Widgets
  </button>
);

export default AdminPageHeader;
