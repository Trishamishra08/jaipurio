import React, { useEffect, useMemo, useState } from 'react';
import { FiCode, FiSearch, FiX } from 'react-icons/fi';
import { uiBlocksList } from '../../../utils/blogsApi';

/**
 * Botble-style UI Blocks picker modal.
 * Fetches blocks from API and inserts selected markup into the editor.
 */
export default function UiBlocksModal({ open, onClose, onUse }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const list = await uiBlocksList();
        if (!cancelled) {
          setBlocks(Array.isArray(list) ? list : []);
          setSelectedId(null);
          setSearch('');
        }
      } catch (err) {
        if (!cancelled) {
          setBlocks([]);
          setError(err?.parsedMessage || err?.message || 'Failed to load UI blocks');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return blocks;
    return blocks.filter(
      (b) =>
        String(b.name || '')
          .toLowerCase()
          .includes(q) ||
        String(b.description || '')
          .toLowerCase()
          .includes(q) ||
        String(b.key || '')
          .toLowerCase()
          .includes(q)
    );
  }, [blocks, search]);

  const selected = filtered.find((b) => String(b.id || b._id) === String(selectedId));

  const useBlock = (block) => {
    if (!block?.markup) return;
    onUse?.(block);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="Close overlay"
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-md shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-800">UI Blocks</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full border border-slate-300 rounded-md pl-9 pr-9 py-2 text-xs focus:outline-hidden focus:border-blue-500"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <FiX size={14} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">Loading blocks…</div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-rose-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">No UI blocks found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filtered.map((block) => {
                const id = String(block.id || block._id);
                const active = selectedId === id;
                return (
                  <div
                    key={id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedId(id);
                    }}
                    className={`border rounded-md overflow-hidden bg-white text-left transition cursor-pointer ${
                      active
                        ? 'border-blue-500 ring-1 ring-blue-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="aspect-4/3 bg-slate-100 flex items-center justify-center border-b border-slate-100">
                      {block.previewImage ? (
                        <img
                          src={block.previewImage}
                          alt={block.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rotate-45 border-2 border-slate-300 bg-white flex items-center justify-center shadow-xs">
                          <FiCode className="-rotate-45 text-slate-400" size={22} />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{block.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {block.description || block.name}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          useBlock(block);
                        }}
                        className="shrink-0 px-2.5 py-1 text-[11px] font-semibold border border-slate-300 rounded-sm bg-white hover:bg-slate-50 text-slate-700"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-700"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => useBlock(selected)}
            className="px-4 py-1.5 text-xs font-semibold rounded-md text-white bg-slate-500 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Use
          </button>
        </div>
      </div>
    </div>
  );
}
