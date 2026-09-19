import React, { useEffect, useState } from 'react';
import { FiX, FiImage } from 'react-icons/fi';

/** Botble-style ALT text dialog */
export default function MediaAltTextModal({ open, initialAlt = '', onClose, onSave }) {
  const [alt, setAlt] = useState(initialAlt);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setAlt(initialAlt || '');
  }, [open, initialAlt]);

  if (!open) return null;

  const handleSave = async (e) => {
    e?.preventDefault?.();
    try {
      setSaving(true);
      await onSave?.(alt);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-lg bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Alt text"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">Alt text</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <FiImage size={16} />
            </span>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              autoFocus
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-slate-500"
              placeholder="Describe this image"
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-800 border border-slate-300 rounded-md bg-white hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
