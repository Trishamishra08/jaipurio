import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiImage, FiLogOut, FiSave, FiX } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import { fetchEcommerceCustomer, saveEcommerceCustomer } from '../../../utils/ecommerceApi';

const customerInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'C';

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

  const [loading, setLoading] = useState(!isCreate);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [privateNotes, setPrivateNotes] = useState('');
  const [avatar, setAvatar] = useState('');
  const [password, setPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (isCreate) {
      setName('');
      setEmail('');
      setPhone('');
      setDateOfBirth('');
      setIsBlocked(false);
      setPrivateNotes('');
      setAvatar('');
      setAddresses([]);
      setPayments([]);
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    fetchEcommerceCustomer(id)
      .then((c) => {
        setName(c.name || '');
        setEmail(c.email || '');
        setPhone(c.mobile || '');
        setDateOfBirth(c.dateOfBirth ? String(c.dateOfBirth).slice(0, 10) : '');
        setIsBlocked(Boolean(c.isBlocked));
        setPrivateNotes(c.privateNotes || '');
        setAvatar(c.profile || '');
        setAddresses(Array.isArray(c.addresses) ? c.addresses : []);
        setPayments(Array.isArray(c.payments) ? c.payments : []);
        setReviews(Array.isArray(c.reviews) ? c.reviews : []);
      })
      .catch((err) => setLoadError(err.parsedMessage || err.message || 'Failed to load customer.'))
      .finally(() => setLoading(false));
  }, [id, isCreate]);

  const pageTitle = isCreate ? 'Create a customer' : `Edit customer "${name || 'Customer'}"`;

  const handleSave = async (exit = false) => {
    if (!name.trim() || !email.trim()) {
      setSaveError('Name and email are required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        id: isCreate ? undefined : id,
        name,
        email,
        mobile: phone,
        dateOfBirth: dateOfBirth || undefined,
        isBlocked,
        privateNotes,
        profile: avatar,
      };
      if (isCreate || changePassword) {
        if (password) payload.password = password;
      }
      const saved = await saveEcommerceCustomer(payload);
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 1800);
      if (exit) {
        navigate('/admin/customers');
      } else if (isCreate && (saved?._id || saved?.id)) {
        navigate(`/admin/customers/edit/${saved._id || saved.id}`, { replace: true });
      }
    } catch (err) {
      setSaveError(err.parsedMessage || err.message || 'Failed to save customer.');
    } finally {
      setSaving(false);
    }
  };

  const applyAvatarUrl = () => {
    if (avatarUrl.trim()) {
      setAvatar(avatarUrl.trim());
      setShowUrlInput(false);
    }
  };

  if (loading) {
    return (
      <EcommerceLayout breadcrumb={['CUSTOMERS', pageTitle.toUpperCase()]}>
        <div className="text-center text-xs text-slate-400 py-10">Loading customer…</div>
      </EcommerceLayout>
    );
  }

  return (
    <EcommerceLayout breadcrumb={['CUSTOMERS', pageTitle.toUpperCase()]}>
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Customer saved successfully!</span>
        </div>
      )}
      {(loadError || saveError) && (
        <div className="mb-4 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError || saveError}
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to auto-generate"
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
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
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">New password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
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
                <div className="px-4 py-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Addresses</h4>
                </div>
                <div className="p-4">
                  {addresses.length === 0 ? (
                    <EmptyTable cols={['#', 'Title', 'Address', 'Phone', 'Default']} />
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            {['#', 'Title', 'Address', 'Phone', 'Default'].map((col) => (
                              <th key={col} className="text-left font-semibold px-3 py-2 border-b border-slate-200">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {addresses.map((row, idx) => (
                            <tr key={row._id || idx} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                              <td className="px-3 py-2">{row.title}</td>
                              <td className="px-3 py-2">{row.addressLine}</td>
                              <td className="px-3 py-2">{row.mobile}</td>
                              <td className="px-3 py-2">{row.isDefault ? 'Yes' : 'No'}</td>
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
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Payments</h4>
                </div>
                <div className="p-4">
                  {payments.length === 0 ? (
                    <EmptyTable cols={['#', 'Order', 'Charge ID', 'Amount', 'Method', 'Status']} />
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            {['#', 'Order', 'Charge ID', 'Amount', 'Method', 'Status'].map((col) => (
                              <th key={col} className="text-left font-semibold px-3 py-2 border-b border-slate-200">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((row, idx) => (
                            <tr key={row.id || idx} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                              <td className="px-3 py-2 text-blue-600">{row.order}</td>
                              <td className="px-3 py-2 font-mono text-[11px]">{row.chargeId}</td>
                              <td className="px-3 py-2 font-semibold">{row.amount}</td>
                              <td className="px-3 py-2">{row.method}</td>
                              <td className="px-3 py-2">{row.status}</td>
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
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Reviews</h4>
                </div>
                <div className="p-4">
                  {reviews.length === 0 ? (
                    <EmptyTable cols={['ID', 'Product', 'Star', 'Comment', 'Status', 'Created At']} />
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            {['ID', 'Product', 'Star', 'Comment', 'Status', 'Created At'].map((col) => (
                              <th key={col} className="text-left font-semibold px-3 py-2 border-b border-slate-200">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reviews.map((row) => (
                            <tr key={row.id} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2 text-slate-500">{row.id}</td>
                              <td className="px-3 py-2 text-blue-600">{row.product}</td>
                              <td className="px-3 py-2">{row.star}</td>
                              <td className="px-3 py-2">{row.comment}</td>
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
              Status<span className="text-red-500">*</span>
            </label>
            <select
              value={isBlocked ? 'Locked' : 'Activated'}
              onChange={(e) => setIsBlocked(e.target.value === 'Locked')}
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
