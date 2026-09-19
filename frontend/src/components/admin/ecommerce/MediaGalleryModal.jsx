import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiX,
  FiUpload,
  FiFolderPlus,
  FiRefreshCw,
  FiSearch,
  FiGrid,
  FiList,
  FiChevronDown,
  FiEye,
  FiEdit2,
  FiCopy,
  FiLink,
  FiStar,
  FiDownload,
  FiTrash2,
  FiFolder,
  FiImage,
  FiCheck,
  FiCrop,
  FiShare2,
  FiColumns,
} from 'react-icons/fi';
import {
  listMedia,
  ensureMediaFolders,
  createMediaFolder,
  uploadMediaFiles,
  renameMedia,
  updateMediaAlt,
  replaceMediaFile,
  toggleMediaFavorite,
  copyMedia,
  trashMedia,
  restoreMedia,
  downloadMedia,
  deleteMedia,
} from '../../../utils/mediaApi';
import MediaAltTextModal from './MediaAltTextModal';
import MediaCropModal from './MediaCropModal';

const formatBytes = (n) => {
  const v = Number(n) || 0;
  if (v < 1024) return `${v} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  return `${(v / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return '—';
  }
};

/**
 * Botble-style Media Gallery modal.
 * Files: Cloudinary · Catalog: MongoDB via /api/media
 */
export default function MediaGalleryModal({ open, onClose, onInsert, multi = false }) {
  const [folderId, setFolderId] = useState(null);
  const [crumbs, setCrumbs] = useState([{ id: null, name: 'All media' }]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('name_asc');
  const [view, setView] = useState('grid');
  const [scope, setScope] = useState('all'); // all | trash | recent | favorites
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [sidebarActionsOpen, setSidebarActionsOpen] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [error, setError] = useState('');
  const [editName, setEditName] = useState('');
  const [altDraft, setAltDraft] = useState('');
  const [altOpen, setAltOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await ensureMediaFolders().catch(() => {});
      const params = {
        q: q || undefined,
        sort: scope === 'recent' ? 'newest' : sort,
      };
      if (scope === 'all') {
        params.folderId = folderId || undefined;
      } else if (scope === 'trash') {
        params.trash = '1';
      } else if (scope === 'favorites') {
        params.favorites = '1';
      } else if (scope === 'recent') {
        params.recent = '1';
      }
      if (typeFilter === 'image') params.type = 'image';
      if (typeFilter === 'video') params.type = 'video';
      if (typeFilter === 'folder') params.type = 'folder';

      const data = await listMedia(params);
      const nextItems = Array.isArray(data?.items) ? data.items : [];
      setItems(nextItems);
      setSelected((prev) => {
        if (!prev) return null;
        const id = String(prev.id || prev._id);
        const fresh = nextItems.find((i) => String(i.id || i._id) === id);
        return fresh || null;
      });
    } catch (err) {
      setError(err?.parsedMessage || err?.message || 'Failed to load media');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [folderId, q, sort, scope, typeFilter]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (selected) {
      setEditName(selected.name || '');
      setAltDraft(selected.alt || '');
    } else {
      setEditName('');
      setAltDraft('');
    }
  }, [selected]);

  useEffect(() => {
    if (!open) {
      setActionsOpen(false);
      setSidebarActionsOpen(false);
      setScopeMenuOpen(false);
      setAltOpen(false);
      setCropOpen(false);
      return undefined;
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (altOpen) setAltOpen(false);
      else if (cropOpen) setCropOpen(false);
      else onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, altOpen, cropOpen, onClose]);

  const folders = useMemo(() => items.filter((i) => i.type === 'folder'), [items]);
  const files = useMemo(() => items.filter((i) => i.type === 'file'), [items]);
  const hasSelection = Boolean(selected && selected.type === 'file');

  const openFolder = (folder) => {
    setScope('all');
    setFolderId(folder.id || folder._id);
    setCrumbs((c) => [...c, { id: folder.id || folder._id, name: folder.name }]);
    setSelected(null);
    setSelectedIds([]);
  };

  const goCrumb = (idx) => {
    const next = crumbs.slice(0, idx + 1);
    setCrumbs(next);
    setFolderId(next[next.length - 1]?.id || null);
    setSelected(null);
    setScope('all');
  };

  const changeScope = (next) => {
    setScope(next);
    setScopeMenuOpen(false);
    setSelected(null);
    setSelectedIds([]);
    if (next !== 'all') {
      setCrumbs([{ id: null, name: next === 'favorites' ? 'Favorites' : next === 'trash' ? 'Trash' : next === 'recent' ? 'Recent' : 'All media' }]);
      setFolderId(null);
    } else {
      setCrumbs([{ id: null, name: 'All media' }]);
    }
  };

  const selectItem = (item, e) => {
    if (item.type === 'folder') {
      if (e?.detail === 2) openFolder(item);
      return;
    }
    setSelected(item);
    setActionsOpen(false);
    setSidebarActionsOpen(false);
    if (multi) {
      setSelectedIds((ids) => {
        const id = item.id || item._id;
        return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      });
    } else {
      setSelectedIds([item.id || item._id]);
    }
  };

  const handleUpload = async (e) => {
    const filesList = e.target.files;
    if (!filesList?.length) return;
    try {
      setLoading(true);
      await uploadMediaFiles(filesList, scope === 'all' ? folderId : null);
      await load();
    } catch (err) {
      setError(err?.message || 'Upload failed');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleNewFolder = async () => {
    const name = window.prompt('Folder name');
    if (!name) return;
    try {
      await createMediaFolder(name, folderId);
      await load();
    } catch (err) {
      setError(err?.message || 'Could not create folder');
    }
  };

  const runAction = async (action) => {
    if (!selected || selected.type !== 'file') return;
    const id = selected.id || selected._id;
    setActionsOpen(false);
    setSidebarActionsOpen(false);
    try {
      if (action === 'preview') {
        window.open(selected.url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (action === 'crop') {
        setCropOpen(true);
        return;
      }
      if (action === 'rename') {
        const name = window.prompt('New name', selected.name);
        if (!name) return;
        const updated = await renameMedia(id, name);
        setSelected(updated);
        await load();
        return;
      }
      if (action === 'copy') {
        await copyMedia(id);
        await load();
        return;
      }
      if (action === 'alt') {
        setAltOpen(true);
        return;
      }
      if (action === 'copyLink' || action === 'copyIndirect') {
        await navigator.clipboard.writeText(selected.url || '');
        return;
      }
      if (action === 'share') {
        if (navigator.share) {
          await navigator.share({ title: selected.name, url: selected.url });
        } else {
          await navigator.clipboard.writeText(selected.url || '');
        }
        return;
      }
      if (action === 'favorite') {
        const updated = await toggleMediaFavorite(id, !selected.isFavorite);
        if (updated?.id || updated?._id) {
          setSelected(updated);
          setSelectedIds([String(updated.id || updated._id)]);
        } else {
          setSelected((prev) =>
            prev ? { ...prev, isFavorite: !prev.isFavorite } : prev
          );
        }
        await load();
        return;
      }
      if (action === 'download') {
        const data = await downloadMedia(id);
        const a = document.createElement('a');
        a.href = data.url;
        a.download = data.name || selected.name;
        a.target = '_blank';
        a.rel = 'noreferrer';
        a.click();
        return;
      }
      if (action === 'trash') {
        if (scope === 'trash') {
          if (!window.confirm('Permanently delete?')) return;
          await deleteMedia(id);
        } else {
          if (!window.confirm('Move to trash?')) return;
          await trashMedia(id);
        }
        setSelected(null);
        setSelectedIds([]);
        await load();
        return;
      }
      if (action === 'restore') {
        await restoreMedia(id);
        setSelected(null);
        await load();
      }
    } catch (err) {
      setError(err?.message || 'Action failed');
    }
  };

  const saveNameFromSidebar = async () => {
    if (!selected || !editName.trim() || editName.trim() === selected.name) return;
    try {
      const updated = await renameMedia(selected.id || selected._id, editName.trim());
      if (updated) setSelected(updated);
      await load();
    } catch (err) {
      setError(err?.message || 'Rename failed');
    }
  };

  const saveAltInline = async () => {
    if (!selected) return;
    if ((selected.alt || '') === altDraft) return;
    try {
      const updated = await updateMediaAlt(selected.id || selected._id, altDraft);
      if (updated) {
        setSelected(updated);
        setAltDraft(updated.alt || altDraft);
      }
      await load();
    } catch (err) {
      setError(err?.message || 'Could not save alt text');
    }
  };

  const saveSidebarFields = async () => {
    if (!selected) return;
    try {
      setError('');
      let updated = selected;
      const id = selected.id || selected._id;
      if (editName.trim() && editName.trim() !== selected.name) {
        updated = await renameMedia(id, editName.trim());
      }
      if ((updated?.alt || selected.alt || '') !== altDraft) {
        updated = await updateMediaAlt(id, altDraft);
      }
      if (updated) {
        setSelected(updated);
        setEditName(updated.name || editName);
        setAltDraft(updated.alt || altDraft);
      }
      await load();
    } catch (err) {
      setError(err?.message || 'Could not save changes');
    }
  };

  const copyFullUrl = async () => {
    if (!selected?.url) return;
    try {
      await navigator.clipboard.writeText(selected.url);
    } catch {
      setError('Could not copy URL');
    }
  };

  const handleAltSave = async (alt) => {
    if (!selected) return;
    const updated = await updateMediaAlt(selected.id || selected._id, alt);
    setSelected(updated);
    setAltDraft(alt);
    await load();
  };

  const handleCropSave = async (blob) => {
    if (!selected) return;
    const file = new File([blob], `${selected.name || 'cropped'}.webp`, { type: 'image/webp' });
    const updated = await replaceMediaFile(selected.id || selected._id, file);
    setSelected(updated);
    await load();
  };

  const handleInsert = () => {
    if (!selected?.url) return;
    onInsert?.(selected);
    onClose?.();
  };

  if (!open) return null;

  const actions = [
    { id: 'preview', label: 'Preview', icon: FiEye },
    { id: 'crop', label: 'Crop', icon: FiCrop },
    { id: 'rename', label: 'Rename', icon: FiEdit2 },
    { id: 'copy', label: 'Make a copy', icon: FiCopy },
    { id: 'alt', label: 'ALT text', icon: FiEdit2 },
    { id: 'copyLink', label: 'Copy link', icon: FiLink },
    { id: 'copyIndirect', label: 'Copy indirect link', icon: FiLink },
    { id: 'share', label: 'Share', icon: FiShare2 },
    {
      id: 'favorite',
      label: selected?.isFavorite ? 'Remove from favorite' : 'Add to favorite',
      icon: FiStar,
    },
    { id: 'download', label: 'Download', icon: FiDownload },
    ...(scope === 'trash'
      ? [
          { id: 'restore', label: 'Restore', icon: FiRefreshCw },
          { id: 'trash', label: 'Delete permanently', icon: FiTrash2 },
        ]
      : [{ id: 'trash', label: 'Move to trash', icon: FiTrash2 }]),
  ];

  const scopeLabel =
    scope === 'favorites' ? 'Favorites' : scope === 'trash' ? 'Trash' : scope === 'recent' ? 'Recent' : 'All media';

  const emptyMessage =
    scope === 'favorites'
      ? {
          icon: FiStar,
          title: 'You have not added anything to your favorites yet',
          sub: 'Add files to favorites to easily find them later.',
        }
      : scope === 'trash'
        ? { icon: FiTrash2, title: 'Trash is empty', sub: 'Deleted media will appear here.' }
        : scope === 'recent'
          ? { icon: FiImage, title: 'No recent uploads', sub: 'Files uploaded in the last 7 days show here.' }
          : { icon: FiImage, title: 'No media in this folder', sub: 'Upload to get started.' };

  const ActionsMenu = ({ open: menuOpen, align = 'right' }) =>
    menuOpen ? (
      <div
        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1 z-30 w-52 bg-white border border-slate-200 rounded-md shadow-lg py-1 max-h-72 overflow-y-auto`}
      >
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => runAction(a.id)}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <a.icon size={13} /> {a.label}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !altOpen && !cropOpen) onClose?.();
      }}
      role="presentation"
    >
      <div
        className="bg-white w-full max-w-6xl h-[min(90vh,820px)] rounded-md shadow-xl flex flex-col overflow-hidden border border-slate-200"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Media gallery"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-800">Media gallery</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800">
            <FiX size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-slate-100">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-sm hover:bg-slate-800"
          >
            <FiUpload size={13} /> Upload
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf" className="hidden" onChange={handleUpload} />
          <button
            type="button"
            onClick={handleNewFolder}
            disabled={scope !== 'all'}
            className="p-1.5 border border-slate-200 rounded-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            title="Create folder"
          >
            <FiFolderPlus size={15} />
          </button>
          <button type="button" onClick={load} className="p-1.5 border border-slate-200 rounded-sm text-slate-600 hover:bg-slate-50" title="Refresh">
            <FiRefreshCw size={15} />
          </button>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-sm py-1.5 px-2 bg-white text-slate-600"
          >
            <option value="all">Everything</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="folder">Folders</option>
          </select>

          <div className="relative">
            <button
              type="button"
              onClick={() => setScopeMenuOpen((v) => !v)}
              className="text-xs border border-slate-200 rounded-sm py-1.5 px-2 bg-white text-slate-600 inline-flex items-center gap-1"
            >
              <FiEye size={12} /> {scopeLabel} <FiChevronDown size={12} />
            </button>
            {scopeMenuOpen ? (
              <div className="absolute left-0 top-full mt-1 z-30 w-40 bg-white border border-slate-200 rounded-md shadow-lg py-1">
                {[
                  { id: 'all', label: 'All media' },
                  { id: 'trash', label: 'Trash' },
                  { id: 'recent', label: 'Recent' },
                  { id: 'favorites', label: 'Favorites' },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => changeScope(o.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${
                      scope === o.id ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-700'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="ml-auto relative">
            <FiSearch className="absolute left-2 top-2 text-slate-400" size={13} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Search in current folder"
              className="text-xs border border-slate-200 rounded-sm pl-7 pr-2 py-1.5 w-48 sm:w-56"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-600">
            {crumbs.map((c, i) => (
              <button key={`${c.id}-${i}`} type="button" onClick={() => goCrumb(i)} className="hover:text-blue-600 font-medium">
                {i > 0 ? ' / ' : ''}
                {c.name}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5 relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-slate-200 rounded-sm py-1 px-2 bg-white"
            >
              <option value="name_asc">A-Z Sort</option>
              <option value="name_desc">Z-A Sort</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <div className="relative">
              <button
                type="button"
                disabled={!hasSelection}
                onClick={() => {
                  setSidebarActionsOpen(false);
                  setActionsOpen((v) => !v);
                }}
                className="border border-slate-200 rounded-sm py-1 px-2 bg-white disabled:opacity-40 inline-flex items-center gap-1"
              >
                Actions <FiChevronDown size={12} />
              </button>
              <ActionsMenu open={actionsOpen} />
            </div>
            <button type="button" onClick={() => setView('list')} className={`p-1.5 rounded-sm ${view === 'list' ? 'bg-slate-200' : 'hover:bg-slate-100'}`} title="List">
              <FiList size={14} />
            </button>
            <button type="button" onClick={() => setView('grid')} className={`p-1.5 rounded-sm ${view === 'grid' ? 'bg-slate-200' : 'hover:bg-slate-100'}`} title="Grid">
              <FiGrid size={14} />
            </button>
            <button type="button" onClick={() => setSidebar((s) => !s)} className="p-1.5 hover:bg-slate-100 rounded-sm text-slate-500" title="Toggle details">
              <FiColumns size={14} />
            </button>
          </div>
        </div>

        {error ? <div className="px-4 py-1.5 text-xs text-red-600 bg-red-50 border-b border-red-100">{error}</div> : null}

        <div className="flex-1 flex min-h-0">
          {scope === 'favorites' ? (
            <div className="w-40 shrink-0 border-r border-slate-200 p-3 bg-white">
              <button
                type="button"
                className="w-full flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1.5 rounded-sm"
              >
                <FiStar size={13} /> Favorites
              </button>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-xs text-slate-500 py-10 text-center">Loading…</div>
            ) : !folders.length && !files.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <emptyMessage.icon size={56} className="text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">{emptyMessage.title}</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">{emptyMessage.sub}</p>
              </div>
            ) : (
              <div className={view === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3' : 'space-y-1'}>
                {folders.map((f) => (
                  <button
                    key={f.id || f._id}
                    type="button"
                    onDoubleClick={() => openFolder(f)}
                    onClick={(e) => selectItem(f, e)}
                    className="flex flex-col items-center gap-1 p-2 rounded-md border border-transparent hover:border-slate-200 hover:bg-slate-50"
                  >
                    <FiFolder size={40} className="text-slate-400" />
                    <span className="text-[11px] text-slate-700 truncate w-full text-center">{f.name}</span>
                  </button>
                ))}
                {files.map((f) => {
                  const id = f.id || f._id;
                  const isSel = selectedIds.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={(e) => selectItem(f, e)}
                      className={`relative flex flex-col items-center gap-1 p-1.5 rounded-md border ${
                        isSel ? 'border-blue-500 ring-1 ring-blue-500' : 'border-transparent hover:border-slate-200'
                      }`}
                    >
                      {isSel ? (
                        <span className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <FiCheck size={11} />
                        </span>
                      ) : null}
                      {f.isFavorite ? (
                        <span className="absolute top-1 left-1 z-10 text-amber-400">
                          <FiStar size={12} fill="currentColor" />
                        </span>
                      ) : null}
                      <div className="w-full aspect-square bg-slate-100 rounded-sm overflow-hidden flex items-center justify-center">
                        {f.mimeType?.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(f.name) ? (
                          <img src={f.url} alt={f.alt || f.name} className="w-full h-full object-cover" />
                        ) : (
                          <FiImage className="text-slate-300" size={28} />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-600 truncate w-full text-center">{f.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {sidebar ? (
            <div className="w-60 shrink-0 border-l border-slate-200 p-3 flex flex-col bg-slate-50/60 overflow-y-auto">
              {hasSelection ? (
                <>
                  <div className="relative mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActionsOpen(false);
                        setSidebarActionsOpen((v) => !v);
                      }}
                      className="w-full border border-slate-300 rounded-sm py-1.5 px-2 bg-white text-xs font-medium text-slate-700 inline-flex items-center justify-between hover:bg-slate-50"
                    >
                      Actions <FiChevronDown size={12} />
                    </button>
                    <ActionsMenu open={sidebarActionsOpen} align="left" />
                  </div>

                  <div className="aspect-square bg-white border border-slate-200 rounded-md overflow-hidden mb-3 flex items-center justify-center">
                    <img src={selected.url} alt={selected.alt || ''} className="max-w-full max-h-full object-contain" />
                  </div>

                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={saveNameFromSidebar}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveNameFromSidebar();
                      }
                    }}
                    className="w-full text-xs border border-slate-200 rounded-sm px-2 py-1.5 mb-2 bg-white"
                  />

                  <p className="text-[10px] text-slate-500 mb-2">
                    Modified at
                    <br />
                    <span className="text-slate-700">{formatDate(selected.updatedAt)}</span>
                  </p>

                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Alt text</label>
                    <button
                      type="button"
                      onClick={() => setAltOpen(true)}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <textarea
                    value={altDraft}
                    onChange={(e) => setAltDraft(e.target.value)}
                    onBlur={saveAltInline}
                    rows={3}
                    placeholder="Describe this image"
                    className="w-full text-xs border border-slate-200 rounded-sm px-2 py-1.5 mb-2 bg-white resize-none"
                  />

                  <div className="text-[10px] text-slate-500 space-y-1 mb-3">
                    <div className="flex justify-between gap-2">
                      <span>Width</span>
                      <span className="text-slate-700 font-medium">{selected.width || '—'} px</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Height</span>
                      <span className="text-slate-700 font-medium">{selected.height || '—'} px</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Size</span>
                      <span className="text-slate-700 font-medium">{formatBytes(selected.size)}</span>
                    </div>
                  </div>

                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full URL</label>
                  <div className="flex gap-1 mb-3">
                    <input
                      readOnly
                      value={selected.url || ''}
                      className="flex-1 min-w-0 text-[10px] border border-slate-200 rounded-sm px-2 py-1.5 bg-white text-slate-500 truncate"
                    />
                    <button
                      type="button"
                      onClick={copyFullUrl}
                      className="shrink-0 px-2 text-[10px] border border-slate-200 rounded-sm bg-white hover:bg-slate-50"
                      title="Copy URL"
                    >
                      Copy
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={saveSidebarFields}
                    className="w-full mb-2 border border-slate-300 bg-white text-slate-800 text-xs font-semibold py-1.5 rounded-sm hover:bg-slate-50"
                  >
                    Save changes
                  </button>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-300">
                  <FiImage size={48} />
                </div>
              )}
              <button
                type="button"
                disabled={!selected?.url}
                onClick={handleInsert}
                className="mt-auto w-full bg-slate-900 text-white text-xs font-semibold py-2 rounded-sm disabled:opacity-40 hover:bg-slate-800"
              >
                Insert
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <MediaAltTextModal
        open={altOpen}
        initialAlt={selected?.alt || ''}
        onClose={() => setAltOpen(false)}
        onSave={handleAltSave}
      />

      <MediaCropModal
        open={cropOpen}
        imageUrl={selected?.url}
        onClose={() => setCropOpen(false)}
        onCrop={handleCropSave}
      />
    </div>
  );
}
