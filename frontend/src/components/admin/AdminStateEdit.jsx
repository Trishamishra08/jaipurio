import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiImage, FiLogOut, FiSave, FiX } from 'react-icons/fi';
import { fetchAdminState, createAdminState, updateAdminState } from '../../utils/statesApi';
import { fetchAdminCountries } from '../../utils/countriesApi';
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
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const AdminStateEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState([]);
  const [sortOrder, setSortOrder] = useState(0);
  const [isDefault, setIsDefault] = useState(false);
  const [status, setStatus] = useState('Published');
  const [image, setImage] = useState('');
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(!isCreate);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    fetchAdminCountries().then(setCountries).catch(() => {});
  }, []);

  useEffect(() => {
    if (isCreate) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAdminState(id)
      .then((s) => {
        setName(s.name || '');
        setSlug(s.slug || '');
        setAbbreviation(s.abbreviation || '');
        setCountry(s.country || '');
        setSortOrder(s.sortOrder ?? 0);
        setIsDefault(Boolean(s.isDefault));
        setStatus(s.status || 'Published');
        setImage(s.image || '');
      })
      .catch((err) => setLoadError(err.parsedMessage || err.message || 'Failed to load state.'))
      .finally(() => setLoading(false));
  }, [id, isCreate]);

  const handleSave = async (exit = false) => {
    if (!name.trim()) {
      setSaveError('Name is required.');
      return;
    }
    if (!country) {
      setSaveError('Country is required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        abbreviation: abbreviation.trim(),
        country,
        sortOrder: Number(sortOrder) || 0,
        isDefault,
        status,
        image,
      };
      if (isCreate) {
        const created = await createAdminState(payload);
        setSavedToast(true);
        window.setTimeout(() => setSavedToast(false), 1800);
        if (exit) {
          navigate('/admin/locations/states');
        } else if (created?._id || created?.id) {
          navigate(`/admin/locations/states/edit/${created._id || created.id}`, { replace: true });
        }
      } else {
        await updateAdminState(id, payload);
        setSavedToast(true);
        window.setTimeout(() => setSavedToast(false), 1800);
        if (exit) navigate('/admin/locations/states');
      }
    } catch (err) {
      setSaveError(err.parsedMessage || err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMediaFiles([file]);
      const url = uploaded?.[0]?.url;
      if (url) setImage(url);
    } catch (err) {
      window.alert(err.parsedMessage || err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const applyUrl = () => {
    if (urlDraft.trim()) setImage(urlDraft.trim());
    setUrlDraft('');
    setUrlInputOpen(false);
  };

  if (loading) {
    return (
      <div>
        <Breadcrumb items={['LOCATIONS', 'STATES', isCreate ? 'NEW STATE' : 'EDIT']} />
        <div className="text-center text-xs text-slate-400 py-10">Loading…</div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          <Link key="1" to="/admin/locations/states" className="hover:underline">LOCATIONS</Link>,
          <Link key="2" to="/admin/locations/states" className="hover:underline">STATES</Link>,
          isCreate ? 'NEW STATE' : `EDIT "${name}"`,
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Slug"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Abbreviation</label>
              <input
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
                placeholder="E.g: CA"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white focus:outline-hidden focus:border-blue-500"
              >
                <option value="">Select a country...</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Sort order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
                className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={isDefault}
                onClick={() => setIsDefault((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isDefault ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isDefault ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </button>
              Is default?
            </label>
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

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">Image</label>
            {image ? (
              <div className="relative inline-block">
                <img src={image} alt="" className="h-28 w-28 object-cover rounded-md border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="absolute -top-2 -right-2 bg-white border border-slate-300 rounded-full p-1 text-slate-500 hover:text-rose-600 shadow-sm"
                >
                  <FiX size={12} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-slate-300 rounded-md py-6 text-slate-300">
                <FiImage size={28} />
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-blue-600 hover:underline cursor-pointer">
                {uploading ? 'Uploading…' : 'Choose image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                />
              </label>
              <span className="text-slate-300">or</span>
              <button type="button" onClick={() => setUrlInputOpen((v) => !v)} className="text-blue-600 hover:underline">
                Add from URL
              </button>
            </div>
            {urlInputOpen && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
                />
                <button type="button" onClick={applyUrl} className="px-2.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold">
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStateEdit;
