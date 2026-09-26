import React, { useCallback, useEffect, useState } from 'react';
import { Upload, Trash2, Star, Edit2, Folder as FolderIcon, X, RefreshCw, Info } from 'lucide-react';
import AdminPageHeader from './AdminPageHeader';
import {
  listMedia,
  uploadMediaFiles,
  toggleMediaFavorite,
  trashMedia,
  renameMedia,
  updateMediaMetadata,
  reoptimizeMedia,
} from '../../utils/mediaApi';

const formatBytes = (n) => {
  if (!n) return '0 KB';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
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
        alt,
        title,
        description,
        copyright,
        keywords,
        latitude,
        longitude,
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Latitude</label>
            <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="26.9124" className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Longitude</label>
            <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="75.7873" className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
          </div>
        </div>
        <p className="text-[11px] text-slate-400">Latitude/longitude are auto-filled from the photo's GPS EXIF data on upload when available, and can be edited here.</p>

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

const AdminMedia = () => {
  const [items, setItems] = useState([]);
  const [folderId, setFolderId] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);

  const load = useCallback(async (folder) => {
    setLoading(true);
    setError('');
    try {
      const data = await listMedia({ folderId: folder || undefined });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load media.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(folderId);
  }, [folderId, load]);

  const openFolder = (item) => {
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
      await uploadMediaFiles(files, folderId);
      await load(folderId);
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
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

  const handleDelete = async (item) => {
    if (!window.confirm(`Move "${item.name}" to trash?`)) return;
    try {
      await trashMedia(item.id);
      await load(folderId);
    } catch (err) {
      setError(err.message || 'Delete failed.');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Media"
        actionLabel={uploading ? 'Uploading…' : 'Upload'}
        onAction={() => document.getElementById('admin-media-upload')?.click()}
      />
      <input id="admin-media-upload" type="file" accept="image/*,video/*" multiple className="hidden" onChange={onUpload} />

      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

      {folderStack.length > 0 && (
        <button type="button" onClick={goBack} className="admin-btn-light mb-3 flex items-center gap-1.5">
          <X size={14} /> Back
        </button>
      )}

      <div className="admin-card p-4">
        {loading ? (
          <p className="text-sm text-slate-400 py-6 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No media yet. Upload something to get started.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {items.map((item) => (
              <figure key={item.id} className="admin-media-tile relative group">
                {item.type === 'folder' ? (
                  <button type="button" onClick={() => openFolder(item)} className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <FolderIcon size={32} className="text-amber-500" />
                    <span className="text-xs font-medium truncate w-full text-center">{item.name}</span>
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => setDetailsItem(item)} className="block w-full h-full">
                      <img src={item.url} alt={item.alt || item.name} />
                      <figcaption>
                        <strong className="truncate block">{item.name}</strong>
                      </figcaption>
                    </button>
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => handleFavorite(item)} className="p-1 bg-white/90 rounded-full shadow" title="Favorite">
                        <Star size={12} className={item.isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-500'} />
                      </button>
                      <button type="button" onClick={() => handleRename(item)} className="p-1 bg-white/90 rounded-full shadow" title="Rename">
                        <Edit2 size={12} className="text-slate-500" />
                      </button>
                      <button type="button" onClick={() => handleDelete(item)} className="p-1 bg-white/90 rounded-full shadow" title="Delete">
                        <Trash2 size={12} className="text-rose-500" />
                      </button>
                    </div>
                  </>
                )}
              </figure>
            ))}
            <label htmlFor="admin-media-upload" className="admin-media-upload">
              <Upload size={22} />
              Upload
            </label>
          </div>
        )}
      </div>

      {detailsItem && (
        <MetadataPanel
          item={detailsItem}
          onClose={() => setDetailsItem(null)}
          onSaved={() => load(folderId)}
        />
      )}
    </div>
  );
};

export default AdminMedia;
