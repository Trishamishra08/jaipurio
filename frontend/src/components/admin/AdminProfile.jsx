import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiImage, FiLock, FiSettings, FiUploadCloud, FiX } from 'react-icons/fi';
import api from '../../utils/api';
import { uploadMediaFiles } from '../../utils/mediaApi';
import { getAdminUser, setAdminUser } from '../../utils/adminAuth';

const TABS = [
  { id: 'profile', label: 'User profile', icon: FiUser },
  { id: 'avatar', label: 'Avatar', icon: FiImage },
  { id: 'password', label: 'Change password', icon: FiLock },
  { id: 'preferences', label: 'Preferences', icon: FiSettings },
];

const splitName = (name = '') => {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
};

const AdminProfile = () => {
  const [user, setUser] = useState(getAdminUser() || {});
  const [tab, setTab] = useState('profile');
  const [loadingUser, setLoadingUser] = useState(true);

  // User profile tab
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Avatar tab
  const [avatar, setAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');

  // Password tab
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  // Preferences tab
  const [prefs, setPrefs] = useState({ pushNotifications: true, emailDispatch: false, smsGateway: true, soundAlerts: true });
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingUser(true);
    api.get('/users/profile')
      .then((res) => {
        if (cancelled) return;
        const u = res.data?.data?.user;
        if (!u) return;
        setUser(u);
        const parts = splitName(u.name || '');
        setFirstName(parts.firstName);
        setLastName(parts.lastName);
        setUsername(u.username || '');
        setEmail(u.email || '');
        setAvatar(u.profile || '');
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingUser(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (tab !== 'preferences') return;
    setPrefsLoading(true);
    api.get('/settings')
      .then((res) => {
        const s = res.data?.data?.settings || {};
        setPrefs((prev) => ({ ...prev, ...s }));
      })
      .catch(() => {})
      .finally(() => setPrefsLoading(false));
  }, [tab]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileErr('');
    setProfileMsg('');
    try {
      const res = await api.put('/users/profile', {
        name: `${firstName} ${lastName}`.trim(),
        username,
        email,
      });
      setUser(res.data.data.user);
      setAdminUser({ ...user, name: res.data.data.user.name, email: res.data.data.user.email, role: res.data.data.user.role });
      setProfileMsg('Profile updated successfully.');
      window.setTimeout(() => setProfileMsg(''), 2000);
    } catch (err) {
      setProfileErr(err.parsedMessage || err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const uploaded = await uploadMediaFiles([file]);
      const url = uploaded?.[0]?.url;
      if (url) setAvatar(url);
    } catch (err) {
      window.alert(err.parsedMessage || err.message || 'Upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveAvatar = async () => {
    setSavingAvatar(true);
    setAvatarMsg('');
    try {
      const res = await api.put('/users/profile', { profile: avatar });
      setUser(res.data.data.user);
      setAdminUser({ ...user, profile: res.data.data.user.profile });
      setAvatarMsg('Avatar updated successfully.');
      window.setTimeout(() => setAvatarMsg(''), 2000);
    } catch (err) {
      setAvatarMsg(err.parsedMessage || err.message || 'Failed to update avatar.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordErr('');
    setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordErr('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch('/users/update-password', { currentPassword, newPassword });
      setPasswordMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      window.setTimeout(() => setPasswordMsg(''), 2000);
    } catch (err) {
      setPasswordErr(err.parsedMessage || err.response?.data?.message || err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    setPrefsMsg('');
    try {
      await api.put('/settings', prefs);
      setPrefsMsg('Preferences saved.');
      window.setTimeout(() => setPrefsMsg(''), 2000);
    } catch (err) {
      setPrefsMsg(err.parsedMessage || err.message || 'Failed to save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div>
      <nav className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
        <Link to="/admin" className="hover:underline">DASHBOARD</Link>
        <span className="text-slate-300">/</span>
        <span>{user?.name?.toUpperCase() || 'PROFILE'}</span>
      </nav>

      <div className="bg-white rounded-md border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1 border-b border-slate-200 px-2 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                  active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {loadingUser && <p className="text-xs text-slate-400 mb-3">Loading…</p>}
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="max-w-2xl">
              {profileErr && <p className="mb-3 text-xs text-rose-600 font-medium">{profileErr}</p>}
              {profileMsg && <p className="mb-3 text-xs text-emerald-600 font-medium">{profileMsg}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
                </div>
              </div>
              <button type="submit" disabled={savingProfile} className="mt-5 px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md text-xs font-bold">
                {savingProfile ? 'Updating…' : 'Update'}
              </button>
            </form>
          )}

          {tab === 'avatar' && (
            <div className="max-w-sm">
              {avatarMsg && <p className="mb-3 text-xs text-emerald-600 font-medium">{avatarMsg}</p>}
              {avatar ? (
                <div className="relative inline-block mb-3">
                  <img src={avatar} alt="Avatar" className="h-28 w-28 object-cover rounded-full border border-slate-200" />
                  <button type="button" onClick={() => setAvatar('')} className="absolute -top-1.5 -right-1.5 bg-white border border-slate-300 rounded-full p-1 text-slate-500 hover:text-rose-600 shadow-sm">
                    <FiX size={12} />
                  </button>
                </div>
              ) : (
                <div className="h-28 w-28 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-300 mb-3">
                  <FiUser size={36} />
                </div>
              )}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline cursor-pointer w-fit">
                  <FiUploadCloud size={13} /> {uploadingAvatar ? 'Uploading…' : 'Choose image'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
                </label>
              </div>
              <button type="button" onClick={handleSaveAvatar} disabled={savingAvatar} className="mt-5 px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md text-xs font-bold">
                {savingAvatar ? 'Saving…' : 'Save avatar'}
              </button>
            </div>
          )}

          {tab === 'password' && (
            <form onSubmit={handleSavePassword} className="max-w-md">
              {passwordErr && <p className="mb-3 text-xs text-rose-600 font-medium">{passwordErr}</p>}
              {passwordMsg && <p className="mb-3 text-xs text-emerald-600 font-medium">{passwordMsg}</p>}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500" />
                </div>
              </div>
              <button type="submit" disabled={savingPassword} className="mt-5 px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md text-xs font-bold">
                {savingPassword ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}

          {tab === 'preferences' && (
            <div className="max-w-md">
              {prefsLoading ? (
                <p className="text-xs text-slate-400">Loading…</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {[
                      { key: 'pushNotifications', label: 'Push notifications', desc: 'Alert on new orders and activity' },
                      { key: 'emailDispatch', label: 'Email dispatch', desc: 'Send summary reports to your email' },
                      { key: 'smsGateway', label: 'SMS gateway', desc: 'High priority customer messages' },
                      { key: 'soundAlerts', label: 'Sound alerts', desc: 'Play a chime on inventory updates' },
                    ].map((p) => (
                      <label key={p.key} className="flex items-center justify-between p-3 border border-slate-200 rounded-md cursor-pointer">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{p.label}</p>
                          <p className="text-[11px] text-slate-400">{p.desc}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={Boolean(prefs[p.key])}
                          onClick={() => setPrefs((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${prefs[p.key] ? 'bg-blue-600' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${prefs[p.key] ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        </button>
                      </label>
                    ))}
                  </div>
                  {prefsMsg && <p className="mt-3 text-xs text-emerald-600 font-medium">{prefsMsg}</p>}
                  <button type="button" onClick={handleSavePrefs} disabled={savingPrefs} className="mt-5 px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md text-xs font-bold">
                    {savingPrefs ? 'Saving…' : 'Save preferences'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
