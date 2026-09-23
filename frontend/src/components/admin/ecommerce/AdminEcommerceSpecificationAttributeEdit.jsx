import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiInfo, FiLogOut, FiSave } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import {
  ecommerceCreate,
  ecommerceGet,
  ecommerceList,
  ecommerceUpdate,
} from '../../../utils/ecommerceApi';

const LIST_PATH = '/admin/ecommerce/specification-attributes';
const RESOURCE = 'specification-attributes';
const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));
const TYPES = ['Text', 'Textarea', 'Select', 'Checkbox', 'Radio'];

export const AdminEcommerceSpecificationAttributeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const [mongoId, setMongoId] = useState(isMongoId(id) ? id : null);
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [type, setType] = useState('Text');
  const [defaultValue, setDefaultValue] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [unit, setUnit] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isFilterable, setIsFilterable] = useState(false);
  const [isSearchable, setIsSearchable] = useState(false);
  const [isVariantAttribute, setIsVariantAttribute] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [order, setOrder] = useState(0);
  const [status, setStatus] = useState('Published');
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    ecommerceList('specification-groups')
      .then((list) => setGroups(Array.isArray(list) ? list : []))
      .catch(() => setGroups([]));
  }, []);

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
        setGroupId(String(row.group?._id || row.group || ''));
        setType(row.type || 'Text');
        setDefaultValue(row.defaultValue || '');
        setOptionsText(Array.isArray(row.options) ? row.options.join(', ') : '');
        setUnit(row.unit || '');
        setIsRequired(Boolean(row.isRequired));
        setIsFilterable(Boolean(row.isFilterable));
        setIsSearchable(Boolean(row.isSearchable));
        setIsVariantAttribute(Boolean(row.isVariantAttribute));
        setIsVisible(row.isVisible !== false);
        setOrder(row.order ?? 0);
        setStatus(row.status || 'Published');
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
    if (!groupId) {
      setSaveError('Group is required');
      return;
    }
    setSaving(true);
    setSaveError('');
    const group = groups.find((g) => String(g._id || g.id) === String(groupId));
    const payload = {
      name: name.trim(),
      group: groupId,
      groupName: group?.name || '',
      type,
      defaultValue,
      options: ['Select', 'Checkbox', 'Radio'].includes(type)
        ? optionsText
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      unit: unit.trim(),
      isRequired,
      isFilterable,
      isSearchable,
      isVariantAttribute,
      isVisible,
      order: Number(order) || 0,
      status,
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

  const pageTitle = isCreate ? 'Create' : `Edit "${name || 'Attribute'}"`;

  return (
    <EcommerceLayout breadcrumb={['SPECIFICATION ATTRIBUTES', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Specification attribute saved successfully!</span>
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
                    Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs"
                  >
                    <option value="">Select a group…</option>
                    {groups.map((g) => (
                      <option key={g._id || g.id} value={g._id || g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  {!groups.length ? (
                    <p className="text-[11px] text-amber-600 mt-1">
                      Create a specification group first.
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Material, Capacity, Weight"
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Default value
                  </label>
                  <input
                    type="text"
                    value={defaultValue}
                    onChange={(e) => setDefaultValue(e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs"
                  />
                </div>
                {['Select', 'Checkbox', 'Radio'].includes(type) ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Options (one per line or comma separated)
                    </label>
                    <textarea
                      value={optionsText}
                      onChange={(e) => setOptionsText(e.target.value)}
                      rows={4}
                      placeholder={'Option 1\nOption 2\nOption 3'}
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs resize-y"
                    />
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Unit (optional)</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g. inch, kg, cm"
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Order</label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(e.target.value)}
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-1">
                  Behavior
                </h4>
                {[
                  { key: 'isRequired', label: 'Required on products in assigned categories', value: isRequired, set: setIsRequired },
                  { key: 'isVariantAttribute', label: 'Variant attribute (used to generate product variants)', value: isVariantAttribute, set: setIsVariantAttribute },
                  { key: 'isFilterable', label: 'Filterable (shown as a storefront filter)', value: isFilterable, set: setIsFilterable },
                  { key: 'isSearchable', label: 'Searchable', value: isSearchable, set: setIsSearchable },
                  { key: 'isVisible', label: 'Visible on product page', value: isVisible, set: setIsVisible },
                ].map((flag) => (
                  <label key={flag.key} className="flex items-center gap-2 cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={flag.value}
                      onChange={(e) => flag.set(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span className="text-xs text-slate-700">{flag.label}</span>
                  </label>
                ))}
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
                  className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded-md text-xs disabled:opacity-60"
                >
                  <FiSave size={14} />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(true)}
                  className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs disabled:opacity-60"
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
                </select>
              </div>
            </div>
          </div>
        </>
      )}
    </EcommerceLayout>
  );
};

export default AdminEcommerceSpecificationAttributeEdit;
