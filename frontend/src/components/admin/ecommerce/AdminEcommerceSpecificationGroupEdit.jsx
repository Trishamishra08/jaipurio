import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiLogOut, FiSave } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import { getSpecificationGroupById } from '../../../data/specificationGroups';

const LIST_PATH = '/admin/product-specification/groups';

const emptyGroup = {
  id: 'new',
  name: '',
  description: '',
  createdAt: new Date().toISOString().slice(0, 10),
};

export const AdminEcommerceSpecificationGroupEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';
  const existing = useMemo(
    () => (isCreate ? null : getSpecificationGroupById(id)),
    [id, isCreate]
  );
  const seed = existing || emptyGroup;

  const [name, setName] = useState(seed.name);
  const [description, setDescription] = useState(seed.description || '');
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const next = isCreate ? emptyGroup : getSpecificationGroupById(id) || emptyGroup;
    setName(next.name);
    setDescription(next.description || '');
  }, [id, isCreate]);

  const pageTitle = isCreate
    ? 'Create'
    : `Edit "${name || existing?.name || 'Group'}"`;

  const handleSave = (exit = false) => {
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 1800);
    if (exit) navigate(LIST_PATH);
  };

  return (
    <EcommerceLayout breadcrumb={['PRODUCT SPECIFICATION', 'SPECIFICATION GROUPS', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Specification group saved successfully!</span>
        </div>
      )}

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
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Publish
            </h4>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition"
            >
              <FiSave size={14} />
              Save
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs transition"
            >
              <FiLogOut size={14} />
              Save & Exit
            </button>
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceSpecificationGroupEdit;
