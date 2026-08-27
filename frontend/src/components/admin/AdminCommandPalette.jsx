import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { flattenAdminNav } from '../../data/adminNav';

const AdminCommandPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const items = useMemo(() => flattenAdminNav(), []);

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.group.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const go = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="admin-palette-overlay" onClick={onClose}>
      <div className="admin-palette" onClick={(e) => e.stopPropagation()}>
        <div className="admin-palette-search">
          <Search size={16} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, products, settings..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered[0]) go(filtered[0].path);
            }}
          />
        </div>
        <div className="admin-palette-list">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No matching pages</p>
          )}
          {filtered.slice(0, 12).map((item) => (
            <button key={`${item.group}-${item.path}`} type="button" onClick={() => go(item.path)}>
              <span>
                <strong>{item.title}</strong>
                <small>{item.group}</small>
              </span>
              <CornerDownLeft size={14} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCommandPalette;
