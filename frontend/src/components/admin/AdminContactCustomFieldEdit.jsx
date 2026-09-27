import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiLogOut, FiSave } from 'react-icons/fi';
import { fetchCustomField, saveCustomField } from '../../utils/contactsApi';

const TYPES = ['Text', 'Textarea', 'Email', 'Phone', 'Select', 'Checkbox'];

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
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const AdminContactCustomFieldEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const [type, setType] = useState('Text');
  const [name, setName] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [sortOrder, setSortOrder] = useState(999);
  const [status, setStatus] = useState('Published');

  const [loading, setLoading] = useState(!isCreate);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (isCreate) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCustomField(id)
      .then((f) => {
        setType(f.type || 'Text');
        setName(f.name || '');
        setPlaceholder(f.placeholder || '');
        setIsRequired(Boolean(f.isRequired));
        setSortOrder(f.sortOrder ?? 999);
        setStatus(f.status || 'Published');
      })
      .catch((err) => setLoadError(err.parsedMessage || err.message || 'Failed to load field.'))
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
      const saved = await saveCustomField(isCreate ? null : id, {
        type,
        name: name.trim(),
        slug: slugify(name),
        placeholder,
        isRequired,
        sortOrder: Number(sortOrder) || 0,
        status,
      });
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 1800);
      if (exit) {
        navigate('/admin/contacts/custom-fields');
      } else if (isCreate && (saved?._id || saved?.id)) {
        navigate(`/admin/contacts/custom-fields/edit/${saved._id || saved.id}`, { replace: true });
      }
    } catch (err) {
      setSaveError(err.parsedMessage || err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Breadcrumb items={['CONTACT', 'CUSTOM FIELDS']} />
        <div className="text-center text-xs text-slate-400 py-10">Loading…</div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={['CONTACT', 'CUSTOM FIELDS', isCreate ? 'CREATE CUSTOM FIELD' : 'EDIT CUSTOM FIELD']} />
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
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white focus:outline-hidden focus:border-blue-500"
              >
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Placeholder</label>
              <input
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Placeholder"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={isRequired}
                onClick={() => setIsRequired((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isRequired ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isRequired ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </button>
              Required
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Order <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>
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
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">Status</label>
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
    </div>
  );
};

export default AdminContactCustomFieldEdit;
