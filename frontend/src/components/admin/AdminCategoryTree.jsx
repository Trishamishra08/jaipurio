import React, { useState } from 'react';
import { catalogTaxonomy } from '../../data/catalogTaxonomy';
import AdminPageHeader from './AdminPageHeader';

const Node = ({ node, depth = 0 }) => {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = Boolean(node.children?.length);
  return (
    <div>
      <button
        type="button"
        onClick={() => hasChildren && setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border-b border-[#f0e8de]"
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        <span className="font-medium">{node.name}</span>
        <span className="text-xs text-slate-400">{node.count ?? (hasChildren ? `${node.children.length} child` : '')} {hasChildren ? (open ? '▾' : '▸') : ''}</span>
      </button>
      {open && hasChildren && node.children.map((child) => <Node key={child.id} node={child} depth={depth + 1} />)}
    </div>
  );
};

const AdminCategoryTree = () => (
  <div>
    <AdminPageHeader title="Product Categories" hideAction extra={<p className="text-xs text-slate-400">4-level nested taxonomy — drag structure preserved</p>} />
    <div className="admin-card overflow-hidden">
      {catalogTaxonomy.map((node) => <Node key={node.id} node={node} />)}
    </div>
  </div>
);

export default AdminCategoryTree;
