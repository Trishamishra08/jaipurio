import React, { useEffect, useState } from 'react';
import { FiX, FiFolder, FiLink } from 'react-icons/fi';

/**
 * First-step popup when adding media: paste a URL, or open the media gallery.
 */
export default function MediaUrlInsertModal({
  open,
  onClose,
  onInsertUrl,
  onOpenGallery,
  title = 'External media',
}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setUrl('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const submitUrl = (e) => {
    e?.preventDefault?.();
    const trimmed = String(url || '').trim();
    if (!trimmed) {
      setError('Please enter a media URL');
      return;
    }
    try {
      // Allow absolute http(s) or site-relative paths
      if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/')) {
        setError('URL must start with http://, https://, or /');
        return;
      }
      onInsertUrl?.(trimmed);
      onClose?.();
    } catch {
      setError('Invalid URL');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-md bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-800 rounded"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={submitUrl} className="p-4 space-y-3">
          <label className="block text-xs font-medium text-slate-700">
            Media URL
            <div className="mt-1.5 relative">
              <FiLink
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                }}
                placeholder="https://…"
                autoFocus
                className="w-full border border-slate-300 rounded-md pl-8 pr-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </label>

          {error ? (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1.5">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenGallery?.();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium px-3 py-2 rounded-md"
            >
              <FiFolder size={14} />
              Choose from media gallery
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-md"
            >
              Insert URL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
