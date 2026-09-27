import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiEdit2, FiLogOut, FiPlus, FiSave, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi';
import { fetchSlider, createSlider, updateSlider } from '../../utils/simpleSlidersApi';
import { uploadMediaFiles } from '../../utils/mediaApi';

const Breadcrumb = ({ items }) => (
  <nav className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="text-slate-300">/</span>}
        {item}
      </React.Fragment>
    ))}
  </nav>
);

const slugify = (value = '') =>
  value.trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const emptyItem = () => ({ title: '', link: '', description: '', sortOrder: 0, image: '' });

const AdminSimpleSliderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Published');
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(!isCreate);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  const [itemModal, setItemModal] = useState(null); // { index: number|null, draft }
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isCreate) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSlider(id)
      .then((s) => {
        setName(s.name || '');
        setKey(s.key || '');
        setDescription(s.description || '');
        setStatus(s.status || 'Published');
        setItems(Array.isArray(s.items) ? s.items : []);
      })
      .catch((err) => setLoadError(err.parsedMessage || err.message || 'Failed to load slider.'))
      .finally(() => setLoading(false));
  }, [id, isCreate]);

  const handleSave = async (exit = false) => {
    if (!name.trim()) {
      setSaveError('Name is required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const payload = { name: name.trim(), key: key.trim() || slugify(name), description, status, items };
      if (isCreate) {
        const created = await createSlider(payload);
        setSavedToast(true);
        window.setTimeout(() => setSavedToast(false), 1800);
        if (exit) {
          navigate('/admin/simple-sliders');
        } else if (created?._id || created?.id) {
          navigate(`/admin/simple-sliders/edit/${created._id || created.id}`, { replace: true });
        }
      } else {
        const updated = await updateSlider(id, payload);
        setKey(updated?.key || key);
        setSavedToast(true);
        window.setTimeout(() => setSavedToast(false), 1800);
        if (exit) navigate('/admin/simple-sliders');
      }
    } catch (err) {
      setSaveError(err.parsedMessage || err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const openAddItem = () => setItemModal({ index: null, draft: emptyItem() });
  const openEditItem = (index) => setItemModal({ index, draft: { ...items[index] } });

  const saveItem = () => {
    if (itemModal.index === null) {
      setItems((prev) => [...prev, itemModal.draft]);
    } else {
      setItems((prev) => prev.map((it, i) => (i === itemModal.index ? itemModal.draft : it)));
    }
    setItemModal(null);
  };

  const removeItem = (index) => {
    if (!window.confirm('Remove this slide?')) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMediaFiles([file]);
      const url = uploaded?.[0]?.url;
      if (url) setItemModal((m) => ({ ...m, draft: { ...m.draft, image: url } }));
    } catch (err) {
      window.alert(err.parsedMessage || err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Breadcrumb items={['SIMPLE SLIDERS', isCreate ? 'CREATE' : 'EDIT']} />
        <div className="text-center text-xs text-slate-400 py-10">Loading…</div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          <Link key="1" to="/admin/simple-sliders" className="hover:underline">SIMPLE SLIDERS</Link>,
          isCreate ? 'CREATE' : `EDIT "${name}"`,
        ]}
      />
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Saved successfully!</span>
        </div>
      )}
      {(loadError || saveError) && (
        <div className="mb-4 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError || saveError}
        </div>
      )}

      <div className="bg-sky-50 border border-sky-200 text-sky-800 rounded-md p-3 mb-5 text-xs">
        You are editing <strong>"English"</strong> version
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Key <span className="text-red-500">*</span>
              </label>
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={slugify(name) || 'slider-key'}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Shortcode: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{`[simple-slider alias="${key || slugify(name) || '...'}"][/simple-slider]`}</code>
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Description"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500 resize-y"
              />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800">Slide Items</h4>
              <button
                type="button"
                onClick={openAddItem}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold"
              >
                <FiPlus size={14} /> Add new
              </button>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No slide items yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="w-10 px-3 py-2">#</th>
                      <th className="px-3 py-2">Image</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2 w-24">Sort order</th>
                      <th className="px-3 py-2 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2">
                          {it.image ? (
                            <img src={it.image} alt={it.title || 'Slide'} className="h-12 w-20 object-cover rounded-md border border-slate-200" />
                          ) : (
                            <div className="h-12 w-20 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-[10px]">No image</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{it.title || '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{it.sortOrder ?? 0}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2.5">
                            <button type="button" onClick={() => openEditItem(i)} title="Edit" className="text-slate-500 hover:text-blue-600">
                              <FiEdit2 size={14} />
                            </button>
                            <button type="button" onClick={() => removeItem(i)} title="Delete" className="text-slate-500 hover:text-rose-600">
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Publish</h4>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 disabled:opacity-60 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition"
            >
              <FiSave size={14} />
              Save
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs transition"
            >
              <FiLogOut size={14} />
              Save & Exit
            </button>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {itemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setItemModal(null)}>
          <div className="bg-white rounded-md shadow-xl w-full max-w-lg border border-slate-200 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {itemModal.index === null ? 'Add slide' : `Edit slide #${itemModal.index + 1}`}
              </h3>
              <button type="button" onClick={() => setItemModal(null)} className="text-slate-400 hover:text-slate-700">
                <FiX size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Title</label>
                <input
                  value={itemModal.draft.title}
                  onChange={(e) => setItemModal((m) => ({ ...m, draft: { ...m.draft, title: e.target.value } }))}
                  placeholder="Title"
                  className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Link</label>
                <input
                  value={itemModal.draft.link}
                  onChange={(e) => setItemModal((m) => ({ ...m, draft: { ...m.draft, link: e.target.value } }))}
                  placeholder="https://"
                  className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={itemModal.draft.description}
                  onChange={(e) => setItemModal((m) => ({ ...m, draft: { ...m.draft, description: e.target.value } }))}
                  rows={3}
                  placeholder="Description"
                  className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500 resize-y"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Sort order</label>
                <input
                  type="number"
                  value={itemModal.draft.sortOrder}
                  onChange={(e) => setItemModal((m) => ({ ...m, draft: { ...m.draft, sortOrder: Number(e.target.value) || 0 } }))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Image <span className="text-red-500">*</span>
                </label>
                {itemModal.draft.image ? (
                  <div className="relative inline-block">
                    <img src={itemModal.draft.image} alt="" className="h-24 rounded-md border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setItemModal((m) => ({ ...m, draft: { ...m.draft, image: '' } }))}
                      className="absolute -top-2 -right-2 bg-white border border-slate-300 rounded-full p-1 text-slate-500 hover:text-rose-600 shadow-sm"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 justify-center border border-dashed border-slate-300 rounded-md py-4 cursor-pointer text-slate-400 hover:border-blue-400 hover:text-blue-500 text-xs">
                    <FiUploadCloud size={16} />
                    {uploading ? 'Uploading…' : 'Click to upload'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => handleItemImageUpload(e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => setItemModal(null)} className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-md hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveItem}
                disabled={!itemModal.draft.image}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSimpleSliderEdit;
