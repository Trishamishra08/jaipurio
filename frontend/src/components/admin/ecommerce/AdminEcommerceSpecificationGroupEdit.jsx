import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiInfo, FiLogOut, FiSave } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import {
  ecommerceCreate,
  ecommerceGet,
  ecommerceUpdate,
} from '../../../utils/ecommerceApi';

const LIST_PATH = '/admin/ecommerce/specification-groups';
const RESOURCE = 'specification-groups';
const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));

export const AdminEcommerceSpecificationGroupEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const [mongoId, setMongoId] = useState(isMongoId(id) ? id : null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Published');
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isCreate) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const row = await ecommerceGet(RESOURCE, id);
        if (cancelled || !row) return;
        setMongoId(row._id || row.id);
        setName(row.name || '');
        setDescription(row.description || '');
        setStatus(row.status || 'Published');
        setOrder(row.order ?? 0);
      } catch (err) {
        if (!cancelled) setSaveError(err?.parsedMessage || err?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const handleSave = async (exit = false) => {
    if (!name.trim()) {
      setSaveError('Name is required');
      return;
    }
    setSaving(true);
    setSaveError('');
    const payload = {
      name: name.trim(),
      description,
      status,
      order: Number(order) || 0,
    };
    try {
      if (mongoId) {
        await ecommerceUpdate(RESOURCE, mongoId, payload);
      } else {
        const created = await ecommerceCreate(RESOURCE, payload);
        if (created?._id) setMongoId(created._id);
        if (exit) {
          navigate(LIST_PATH);
          return;
        }
        if (created?._id) navigate(`${LIST_PATH}/edit/${created._id}`);
      }
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 1800);
      if (exit) navigate(LIST_PATH);
    } catch (err) {
      setSaveError(err?.parsedMessage || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = isCreate ? 'Create' : `Edit "${name || 'Group'}"`;

  return (
    <EcommerceLayout breadcrumb={['SPECIFICATION GROUPS', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Specification group saved successfully!</span>
        </div>
      )}
      {saveError ? <div className="mb-3 text-xs text-rose-600 font-medium">{saveError}</div> : null}

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading…</div>
      ) : (
        <>
          <div className="bg-[#EBF5FB] border border-[#D4E6F1] text-[#2471A3] rounded-md p-3 mb-5 flex items-center gap-2.5 text-xs">
            <FiInfo size={16} className="text-[#2980B9] shrink-0" />
            <span>
              You are editing <strong className="font-bold">&quot;English&quot;</strong> version
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Group title (e.g. Display Specifications)"
                    maxLength={120}
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    maxLength={400}
                    placeholder="Optional group description"
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-40 border border-slate-300 rounded-md py-2 px-3 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Publish
                </h4>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(false)}
                  className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition disabled:opacity-60"
                >
                  <FiSave size={14} />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(true)}
                  className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs transition disabled:opacity-60"
                >
                  <FiLogOut size={14} />
                  Save &amp; Exit
                </button>
              </div>
              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Status</h4>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs"
                >
                  <option>Published</option>
                  <option>Draft</option>
                  <option>Pending</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}
    </EcommerceLayout>
  );
};

export default AdminEcommerceSpecificationGroupEdit;
