import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiImage, FiLogOut, FiPlus, FiSave, FiX } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import { customerInitials, getCustomerById } from '../../../data/customers';

const emptyCustomer = {
  id: 'new',
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  status: 'Activated',
  isVendor: false,
  privateNotes: '',
  avatar: '',
  addresses: [],
  wishlist: [],
  payments: [],
  reviews: [],
};

const EmptyTable = ({ cols, message = 'No data to display' }) => (
  <div className="overflow-x-auto border border-slate-200 rounded-md">
    <table className="w-full text-xs">
      <thead className="bg-slate-50 text-slate-600">
        <tr>
          {cols.map((col) => (
            <th key={col} className="text-left font-semibold px-3 py-2 border-b border-slate-200">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={cols.length} className="px-3 py-8 text-center text-slate-400">
            {message}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export const AdminEcommerceCustomerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'create';
  const existing = useMemo(() => (isCreate ? null : getCustomerById(id)), [id, isCreate]);
  const seed = existing || emptyCustomer;

  const [name, setName] = useState(seed.name);
  const [email, setEmail] = useState(seed.email);
  const [phone, setPhone] = useState(seed.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(seed.dateOfBirth || '');
  const [isVendor, setIsVendor] = useState(Boolean(seed.isVendor));
  const [status, setStatus] = useState(seed.status || 'Activated');
  const [privateNotes, setPrivateNotes] = useState(seed.privateNotes || '');
  const [avatar, setAvatar] = useState(seed.avatar || '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const next = isCreate ? emptyCustomer : getCustomerById(id) || emptyCustomer;
    setName(next.name);
    setEmail(next.email);
    setPhone(next.phone || '');
    setDateOfBirth(next.dateOfBirth || '');
    setIsVendor(Boolean(next.isVendor));
    setStatus(next.status || 'Activated');
    setPrivateNotes(next.privateNotes || '');
    setAvatar(next.avatar || '');
    setPassword('');
    setPasswordConfirm('');
    setChangePassword(false);
    setShowUrlInput(false);
    setAvatarUrl('');
  }, [id, isCreate]);

  const addresses = existing?.addresses || [];
  const wishlist = existing?.wishlist || [];
  const payments = existing?.payments || [];
  const reviews = existing?.reviews || [];

  const pageTitle = isCreate
    ? 'Create a customer'
    : `Edit customer "${name || existing?.name || 'Customer'}"`;

  const handleSave = (exit = false) => {
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 1800);
    if (exit) navigate('/admin/customers');
  };

  const applyAvatarUrl = () => {
    if (avatarUrl.trim()) {
      setAvatar(avatarUrl.trim());
      setShowUrlInput(false);
    }
  };

  return (
    <EcommerceLayout breadcrumb={['CUSTOMERS', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Customer saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
            <div className="border-b border-slate-200 px-4">
              <button
                type="button"
                className="relative py-2.5 text-xs font-semibold text-blue-600 border-b-2 border-blue-600"
              >
                Detail
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVendor}
                  onChange={(e) => setIsVendor(e.target.checked)}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span>Is vendor?</span>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                  className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full max-w-xs border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {isCreate ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Password confirmation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={changePassword}
                      onChange={(e) => setChangePassword(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Change password?</span>
                  </label>
                  {changePassword && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Password confirmation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Private notes</label>
                <textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  rows={3}
                  placeholder="Private notes"
                  className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Private notes are only visible to admins.
                </p>
              </div>
            </div>
          </div>

          {!isCreate && (
            <>
              <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Addresses
                  </h4>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <FiPlus size={12} />
                    New address
                  </button>
                </div>
                <div className="p-4">
                  {addresses.length === 0 ? (
                    <EmptyTable
                      cols={['#', 'Address', 'Zip code', 'Country', 'State', 'City', 'Action']}
                    />
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            {['#', 'Address', 'Zip code', 'Country', 'State', 'City', 'Action'].map(
                              (col) => (
                                <th
                                  key={col}
                                  className="text-left font-semibold px-3 py-2 border-b border-slate-200"
                                >
                                  {col}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {addresses.map((row, idx) => (
                            <tr key={row.id} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                              <td className="px-3 py-2">{row.address}</td>
                              <td className="px-3 py-2">{row.zipCode}</td>
                              <td className="px-3 py-2">{row.country}</td>
                              <td className="px-3 py-2">{row.state}</td>
                              <td className="px-3 py-2">{row.city}</td>
                              <td className="px-3 py-2">
                                <button type="button" className="text-red-500 hover:underline">
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Wishlist
                  </h4>
                </div>
                <div className="p-4">
                  {wishlist.length === 0 ? (
                    <EmptyTable cols={['#', 'Product', 'Created At']} />
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            {['#', 'Product', 'Created At'].map((col) => (
                              <th
                                key={col}
                                className="text-left font-semibold px-3 py-2 border-b border-slate-200"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {wishlist.map((row, idx) => (
                            <tr key={row.id} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                              <td className="px-3 py-2 text-blue-600">{row.product}</td>
                              <td className="px-3 py-2">{row.createdAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Payments
                  </h4>
                </div>
                <div className="p-4">
                  {payments.length === 0 ? (
                    <EmptyTable
                      cols={[
                        '#',
                        'Order',
                        'Charge ID',
                        'Amount',
                        'Payment methods',
                        'Status',
                        'Action',
                      ]}
                    />
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            {[
                              '#',
                              'Order',
                              'Charge ID',
                              'Amount',
                              'Payment methods',
                              'Status',
                              'Action',
                            ].map((col) => (
                              <th
                                key={col}
                                className="text-left font-semibold px-3 py-2 border-b border-slate-200"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((row, idx) => (
                            <tr key={row.id} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                              <td className="px-3 py-2 text-blue-600">{row.order}</td>
                              <td className="px-3 py-2 font-mono text-[11px]">{row.chargeId}</td>
                              <td className="px-3 py-2 font-semibold">{row.amount}</td>
                              <td className="px-3 py-2">{row.method}</td>
                              <td className="px-3 py-2">{row.status}</td>
                              <td className="px-3 py-2 text-slate-400">—</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Reviews
                  </h4>
                </div>
                <div className="p-4">
                  {reviews.length === 0 ? (
                    <EmptyTable
                      cols={[
                        'ID',
                        'Product',
                        'User',
                        'Star',
                        'Comment',
                        'Images',
                        'Status',
                        'Created At',
                      ]}
                    />
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            {[
                              'ID',
                              'Product',
                              'User',
                              'Star',
                              'Comment',
                              'Images',
                              'Status',
                              'Created At',
                            ].map((col) => (
                              <th
                                key={col}
                                className="text-left font-semibold px-3 py-2 border-b border-slate-200"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reviews.map((row) => (
                            <tr key={row.id} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2 text-slate-500">{row.id}</td>
                              <td className="px-3 py-2 text-blue-600">{row.product}</td>
                              <td className="px-3 py-2">{row.user}</td>
                              <td className="px-3 py-2">{row.star}</td>
                              <td className="px-3 py-2">{row.comment}</td>
                              <td className="px-3 py-2 text-slate-400">—</td>
                              <td className="px-3 py-2">{row.status}</td>
                              <td className="px-3 py-2">{row.createdAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
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

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Status<span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="Activated">Activated</option>
              <option value="Locked">Locked</option>
            </select>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Avatar
            </h4>
            <div className="relative w-full aspect-square max-w-[180px] rounded-md border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
              {avatar ? (
                <>
                  <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="absolute top-2 right-2 bg-white/90 text-slate-600 hover:text-red-600 rounded-full p-1 shadow-sm"
                    title="Remove image"
                  >
                    <FiX size={14} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center text-lg font-bold">
                    {customerInitials(name || 'C')}
                  </div>
                  <FiImage size={20} />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="text-blue-600 hover:underline font-medium cursor-pointer">
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setAvatar(String(reader.result || ''));
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <span className="text-slate-400">or</span>
              <button
                type="button"
                onClick={() => setShowUrlInput((v) => !v)}
                className="text-blue-600 hover:underline font-medium"
              >
                Add from URL
              </button>
            </div>
            {showUrlInput && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://"
                  className="flex-1 border border-slate-300 rounded-md py-1.5 px-2 text-xs focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={applyAvatarUrl}
                  className="px-2 py-1.5 rounded-md bg-slate-800 text-white text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceCustomerEdit;
