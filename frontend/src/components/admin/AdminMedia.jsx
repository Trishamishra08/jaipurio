import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, Trash2, Star, Edit2, Folder as FolderIcon, FolderPlus, X, RefreshCw, Info,
  Filter, Eye, Search, ChevronDown, Grid as GridIcon, List as ListIcon, PanelRightClose,
  PanelRightOpen, Image as ImageIcon, Video as VideoIcon, FileText, Globe, Clock, RotateCcw,
} from 'lucide-react';
import AdminPageHeader from './AdminPageHeader';
import {
  listMedia,
  uploadMediaFiles,
  toggleMediaFavorite,
  trashMedia,
  restoreMedia,
  deleteMedia,
  renameMedia,
  createMediaFolder,
  updateMediaMetadata,
  reoptimizeMedia,
  getBrowserLocation,
} from '../../utils/mediaApi';

const formatBytes = (n) => {
  if (!n) return '0 KB';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'Everything', icon: Filter },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: VideoIcon },
  { value: 'document', label: 'Document', icon: FileText },
];

const VIEW_OPTIONS = [
  { value: 'all', label: 'All media', icon: Globe },
  { value: 'trash', label: 'Trash', icon: Trash2 },
  { value: 'recent', label: 'Recent', icon: Clock },
  { value: 'favorites', label: 'Favorites', icon: Star },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const Dropdown = ({ label, icon: Icon, options, value, onChange, dark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition ${
          dark ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
        }`}
      >
        {Icon && <Icon size={13} />}
        <span>{label} ({current.label})</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-40 min-w-[180px] bg-white border border-slate-200 rounded-md shadow-lg py-1">
          {options.map((opt) => {
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 text-left px-3 py-2 text-xs hover:bg-slate-50 ${opt.value === value ? 'text-blue-600 font-semibold' : 'text-slate-700'}`}
              >
                {OptIcon && <OptIcon size={13} />}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MetadataPanel = ({ item, onClose, onSaved }) => {
  const [alt, setAlt] = useState(item.alt || '');
  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [copyright, setCopyright] = useState(item.copyright || '');
  const [keywords, setKeywords] = useState((item.keywords || []).join(', '));
  const [latitude, setLatitude] = useState(item.location?.latitude ?? '');
  const [longitude, setLongitude] = useState(item.location?.longitude ?? '');
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');

  const savingsPct = item.originalSize && item.size && item.originalSize > item.size
    ? Math.round(((item.originalSize - item.size) / item.originalSize) * 100)
    : 0;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const saved = await updateMediaMetadata(item.id, {
        alt, title, description, copyright, keywords, latitude, longitude,
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save metadata.');
    } finally {
      setSaving(false);
    }
  };

  const handleReoptimize = async () => {
    setOptimizing(true);
    setError('');
    try {
      const saved = await reoptimizeMedia(item.id);
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Re-optimization failed.');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-white shadow-xl p-5 overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 truncate">{item.name}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <img src={item.url} alt={item.alt || item.name} className="w-full h-40 object-contain bg-slate-50 rounded-md border border-slate-200" />

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Info size={13} /> Optimization
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Original size</span>
            <span>{formatBytes(item.originalSize) || '—'}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Optimized size</span>
            <span>{formatBytes(item.size)}</span>
          </div>
          {savingsPct > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Savings</span>
              <span>{savingsPct}% smaller</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleReoptimize}
            disabled={optimizing}
            className="mt-1 w-full flex items-center justify-center gap-1.5 border border-slate-300 rounded-md py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-white disabled:opacity-60"
          >
            <RefreshCw size={12} className={optimizing ? 'animate-spin' : ''} />
            {optimizing ? 'Re-optimizing…' : 'Re-optimize this image'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Alt text</label>
          <input value={alt} onChange={(e) => setAlt(e.target.value)} className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500 resize-y" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Keywords <span className="text-slate-400 font-normal">(comma separated)</span></label>
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="pottery, handmade, jaipur" className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Copyright</label>
          <input value={copyright} onChange={(e) => setCopyright(e.target.value)} placeholder="© Jaipurio" className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">Location</label>
            {item.locationSource && item.locationSource !== 'none' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {{ exif: 'From photo GPS', device: 'From your device', ip: 'From IP address (approx.)', manual: 'Entered manually' }[item.locationSource]}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude — 26.9124" className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
            <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude — 75.7873" className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          Filled automatically from the photo's own GPS data when present, otherwise from your device's current
          location at upload time — always editable here.
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition"
        >
          {saving ? 'Saving…' : 'Save metadata'}
        </button>
      </div>
    </div>
  );
};

const RightPanel = ({ item, onClose, onEdit }) => (
  <div className="w-72 shrink-0 border-l border-slate-200 bg-white p-4 flex flex-col">
    {item ? (
      <>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
        {item.type === 'file' ? (
          <img src={item.url} alt={item.alt || item.name} className="w-full h-40 object-contain bg-slate-50 rounded-md border border-slate-200 mb-3" />
        ) : (
          <div className="w-full h-40 flex items-center justify-center bg-slate-50 rounded-md border border-slate-200 mb-3">
            <FolderIcon size={40} className="text-amber-500" />
          </div>
        )}
        {item.type === 'file' && (
          <div className="text-[11px] text-slate-500 space-y-1 mb-3">
            <div className="flex justify-between"><span>Size</span><span>{formatBytes(item.size)}</span></div>
            {item.width && item.height && (
              <div className="flex justify-between"><span>Dimensions</span><span>{item.width}×{item.height}</span></div>
            )}
            {item.location?.latitude != null && (
              <div className="flex justify-between"><span>Lat / Lng</span><span>{item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}</span></div>
            )}
          </div>
        )}
        {item.type === 'file' && (
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md py-2 text-xs font-semibold"
          >
            <Edit2 size={13} /> Edit details
          </button>
        )}
      </>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-300">
        <ImageIcon size={48} />
        <p className="text-xs text-slate-400 text-center">Select a file to preview it here</p>
      </div>
    )}
  </div>
);

const AdminMedia = () => {
  const [items, setItems] = useState([]);
  const [folderId, setFolderId] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);

  const [filterType, setFilterType] = useState('all');
  const [view, setView] = useState('all');
  const [sort, setSort] = useState('name_asc');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const load = useCallback(async (folder) => {
    setLoading(true);
    setError('');
    try {
      const params = { sort };
      if (filterType !== 'all') params.type = filterType;
      if (search.trim()) params.q = search.trim();
      if (view === 'trash') params.trash = 1;
      else if (view === 'favorites') params.favorites = 1;
      else if (view === 'recent') params.recent = 1;
      else params.folderId = folder || undefined;

      const data = await listMedia(params);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load media.');
    } finally {
      setLoading(false);
    }
  }, [filterType, view, sort, search]);

  useEffect(() => {
    load(folderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, filterType, view, sort, search]);

  const openFolder = (item) => {
    if (view !== 'all') return;
    setFolderStack((prev) => [...prev, { id: folderId, name: item.name }]);
    setFolderId(item.id);
  };

  const goBack = () => {
    const prev = [...folderStack];
    const last = prev.pop();
    setFolderStack(prev);
    setFolderId(last?.id || null);
  };

  const onUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      const coords = await getBrowserLocation();
      await uploadMediaFiles(files, folderId, coords);
      await load(folderId);
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleNewFolder = async () => {
    const name = window.prompt('Folder name');
    if (!name) return;
    try {
      await createMediaFolder(name, folderId);
      await load(folderId);
    } catch (err) {
      setError(err.message || 'Failed to create folder.');
    }
  };

  const handleFavorite = async (item) => {
    try {
      await toggleMediaFavorite(item.id, !item.isFavorite);
      await load(folderId);
    } catch (err) {
      setError(err.message || 'Failed to update favorite.');
    }
  };

  const handleRename = async (item) => {
    const next = window.prompt('Rename', item.name);
    if (!next || next === item.name) return;
    try {
      await renameMedia(item.id, next);
      await load(folderId);
    } catch (err) {
      setError(err.message || 'Rename failed.');
    }
  };

  const handleTrash = async (item) => {
    if (!window.confirm(`Move "${item.name}" to trash?`)) return;
    try {
      await trashMedia(item.id);
      await load(folderId);
    } catch (err) {
      setError(err.message || 'Delete failed.');
    }
  };

  const handleRestore = async (item) => {
    try {
      await restoreMedia(item.id);
      await load(folderId);
    } catch (err) {
      setError(err.message || 'Restore failed.');
    }
  };

  const handleDestroy = async (item) => {
    if (!window.confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await deleteMedia(item.id);
      await load(folderId);
    } catch (err) {
      setError(err.message || 'Delete failed.');
    }
  };

  const emptyMessage = useMemo(() => {
    if (view === 'favorites') return { title: 'You have not added anything to your favorites yet', sub: 'Add files to favorites to easily find them later' };
    if (view === 'trash') return { title: 'Trash is empty', sub: 'Files you delete will show up here before being permanently removed' };
    if (view === 'recent') return { title: 'No recent uploads', sub: 'Files uploaded in the last 7 days will show up here' };
    return { title: 'No media yet', sub: 'Upload something to get started' };
  }, [view]);

  return (
    <div>
      <AdminPageHeader title="Media" hideAction />

      <input id="admin-media-upload" type="file" accept="image/*,video/*" multiple className="hidden" onChange={onUpload} />

      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

      <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => document.getElementById('admin-media-upload')?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-md text-xs font-semibold"
            >
              <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button type="button" onClick={handleNewFolder} title="New folder" className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50">
              <FolderPlus size={15} />
            </button>
            <button type="button" onClick={() => load(folderId)} title="Reload" className="p-2 bg-slate-900 hover:bg-slate-800 rounded-md text-white">
              <RefreshCw size={15} />
            </button>
            <Dropdown label="Filter" icon={Filter} options={FILTER_OPTIONS} value={filterType} onChange={setFilterType} />
            <Dropdown label="View" icon={Eye} options={VIEW_OPTIONS} value={view} onChange={(v) => { setView(v); setFolderStack([]); setFolderId(null); }} dark />
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in current folder"
              className="w-64 border border-slate-300 rounded-md text-xs py-2 pl-8 pr-3 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        <div className="px-3 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => { setView('favorites'); setFolderStack([]); setFolderId(null); }}
            className={`flex items-center gap-1.5 text-xs font-semibold ${view === 'favorites' ? 'text-amber-500' : 'text-slate-500 hover:text-amber-500'}`}
          >
            <Star size={14} className={view === 'favorites' ? 'fill-amber-400' : ''} /> Favorites
          </button>
          <div className="flex items-center gap-2">
            <Dropdown label="Sort" options={SORT_OPTIONS} value={sort} onChange={setSort} />
            <button type="button" onClick={() => setViewMode('grid')} className={`p-2 rounded-md border ${viewMode === 'grid' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-600'}`}>
              <GridIcon size={14} />
            </button>
            <button type="button" onClick={() => setViewMode('list')} className={`p-2 rounded-md border ${viewMode === 'list' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-600'}`}>
              <ListIcon size={14} />
            </button>
            <button type="button" onClick={() => setPanelOpen((v) => !v)} title="Toggle details panel" className="p-2 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50">
              {panelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            </button>
          </div>
        </div>

        <div className="flex">
          <div className="flex-1 min-w-0 p-4">
            {folderStack.length > 0 && view === 'all' && (
              <button type="button" onClick={goBack} className="mb-3 flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800">
                <X size={13} /> Back
              </button>
            )}

            {loading ? (
              <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Star size={40} className="text-slate-200" />
                <p className="text-sm font-semibold text-slate-500">{emptyMessage.title}</p>
                <p className="text-xs text-slate-400">{emptyMessage.sub}</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {items.map((item) => (
                  <figure key={item.id} className={`admin-media-tile relative group ${selectedItem?.id === item.id ? 'ring-2 ring-blue-500' : ''}`}>
                    {item.type === 'folder' ? (
                      <button type="button" onClick={() => openFolder(item)} className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <FolderIcon size={32} className="text-amber-500" />
                        <span className="text-xs font-medium truncate w-full text-center">{item.name}</span>
                      </button>
                    ) : (
                      <>
                        <button type="button" onClick={() => setSelectedItem(item)} className="block w-full h-full">
                          <img src={item.url} alt={item.alt || item.name} />
                          <figcaption>
                            <strong className="truncate block">{item.name}</strong>
                          </figcaption>
                        </button>
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {view === 'trash' ? (
                            <>
                              <button type="button" onClick={() => handleRestore(item)} className="p-1 bg-white/90 rounded-full shadow" title="Restore">
                                <RotateCcw size={12} className="text-emerald-600" />
                              </button>
                              <button type="button" onClick={() => handleDestroy(item)} className="p-1 bg-white/90 rounded-full shadow" title="Delete permanently">
                                <Trash2 size={12} className="text-rose-500" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button type="button" onClick={() => handleFavorite(item)} className="p-1 bg-white/90 rounded-full shadow" title="Favorite">
                                <Star size={12} className={item.isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-500'} />
                              </button>
                              <button type="button" onClick={() => handleRename(item)} className="p-1 bg-white/90 rounded-full shadow" title="Rename">
                                <Edit2 size={12} className="text-slate-500" />
                              </button>
                              <button type="button" onClick={() => handleTrash(item)} className="p-1 bg-white/90 rounded-full shadow" title="Move to trash">
                                <Trash2 size={12} className="text-rose-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </figure>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => (item.type === 'folder' ? openFolder(item) : setSelectedItem(item))}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 ${selectedItem?.id === item.id ? 'bg-blue-50/50' : ''}`}
                  >
                    {item.type === 'folder' ? (
                      <FolderIcon size={18} className="text-amber-500 shrink-0" />
                    ) : (
                      <img src={item.url} alt="" className="h-8 w-8 object-cover rounded-sm border border-slate-200 shrink-0" />
                    )}
                    <span className="text-xs text-slate-700 truncate flex-1">{item.name}</span>
                    {item.type === 'file' && <span className="text-[11px] text-slate-400">{formatBytes(item.size)}</span>}
                    {item.type === 'file' && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {view === 'trash' ? (
                          <>
                            <button type="button" onClick={() => handleRestore(item)} title="Restore"><RotateCcw size={13} className="text-emerald-600" /></button>
                            <button type="button" onClick={() => handleDestroy(item)} title="Delete permanently"><Trash2 size={13} className="text-rose-500" /></button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => handleFavorite(item)} title="Favorite"><Star size={13} className={item.isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'} /></button>
                            <button type="button" onClick={() => handleRename(item)} title="Rename"><Edit2 size={13} className="text-slate-400" /></button>
                            <button type="button" onClick={() => handleTrash(item)} title="Move to trash"><Trash2 size={13} className="text-rose-500" /></button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {panelOpen && (
            <RightPanel item={selectedItem} onClose={() => setSelectedItem(null)} onEdit={setDetailsItem} />
          )}
        </div>
      </div>

      {detailsItem && (
        <MetadataPanel
          item={detailsItem}
          onClose={() => setDetailsItem(null)}
          onSaved={(saved) => { load(folderId); setSelectedItem(saved); }}
        />
      )}
    </div>
  );
};

export default AdminMedia;
