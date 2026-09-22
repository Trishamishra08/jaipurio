import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiInfo, FiLogOut, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import {
  ecommerceCreate,
  ecommerceGet,
  ecommerceList,
  ecommerceUpdate,
} from '../../../utils/ecommerceApi';

const LIST_PATH = '/admin/ecommerce/specification-tables';
const RESOURCE = 'specification-tables';
const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));

export const AdminEcommerceSpecificationTableEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';

  const [mongoId, setMongoId] = useState(isMongoId(id) ? id : null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Published');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    ecommerceList('specification-groups')
      .then((list) => setAvailableGroups(Array.isArray(list) ? list : []))
      .catch(() => setAvailableGroups([]));
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
        setDescription(row.description || '');
        setStatus(row.status || 'Published');
        setSelectedGroups(
          Array.isArray(row.groups)
            ? row.groups.map((g, idx) => ({
                groupId: String(g.group?._id || g.group || g.groupId || ''),
                order: g.order ?? idx,
              }))
            : []
        );
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

  const addGroup = () => {
    const first = availableGroups[0];
    if (!first) return;
    setSelectedGroups((prev) => [
      ...prev,
      { groupId: String(first._id || first.id), order: prev.length },
    ]);
  };

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
      groups: selectedGroups
        .filter((g) => g.groupId)
        .map((g, idx) => ({
          group: g.groupId,
          order: Number(g.order) || idx,
          groupName:
            availableGroups.find((ag) => String(ag._id || ag.id) === String(g.groupId))?.name ||
            '',
        })),
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

  const pageTitle = isCreate ? 'Create' : `Edit "${name || 'Table'}"`;

  return (
    <EcommerceLayout breadcrumb={['SPECIFICATION TABLES', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Specification table saved successfully!</span>
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
                    placeholder="e.g. Pottery default / Smartphone Specifications"
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs resize-y"
                  />
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Groups
                  </h4>
                  <button
                    type="button"
                    onClick={addGroup}
                    disabled={!availableGroups.length}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-40"
                  >
                    <FiPlus size={13} />
                    Add group
                  </button>
                </div>
                {!availableGroups.length ? (
                  <p className="text-[11px] text-amber-600">Create specification groups first.</p>
                ) : null}
                {selectedGroups.length === 0 ? (
                  <p className="text-xs text-slate-400">No groups added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedGroups.map((row, idx) => (
                      <div
                        key={`${row.groupId}-${idx}`}
                        className="flex flex-wrap items-center gap-2 border border-slate-200 rounded-md p-2"
                      >
                        <select
                          value={row.groupId}
                          onChange={(e) => {
                            const next = [...selectedGroups];
                            next[idx] = { ...next[idx], groupId: e.target.value };
                            setSelectedGroups(next);
                          }}
                          className="flex-1 min-w-[180px] border border-slate-300 rounded-md py-1.5 px-2 text-xs"
                        >
                          {availableGroups.map((g) => (
                            <option key={g._id || g.id} value={g._id || g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={row.order}
                          onChange={(e) => {
                            const next = [...selectedGroups];
                            next[idx] = { ...next[idx], order: Number(e.target.value) || 0 };
                            setSelectedGroups(next);
                          }}
                          className="w-20 border border-slate-300 rounded-md py-1.5 px-2 text-xs"
                          title="Order"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedGroups((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

export default AdminEcommerceSpecificationTableEdit;
