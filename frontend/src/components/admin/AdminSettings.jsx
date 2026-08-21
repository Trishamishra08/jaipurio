import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiShield, FiLock, FiBell, FiChevronRight, FiEdit3, FiSettings, FiX, FiCheck, FiSave, FiImage, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AdminSettings = () => {
  const { user, setUser, setIsAuthenticated } = useShop();
  const navigate = useNavigate();

  const [adminInfo, setAdminInfo] = useState({
    name: user?.name || '',
    role: user?.role || 'Admin',
    email: user?.email || '',
    phone: user?.phone || '',
    joined: user?.joined || 'Jan 2024'
  });

  // Sync state if user context updates
  useEffect(() => {
    if (user) {
      setAdminInfo(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        role: user.role || prev.role,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...adminInfo });
  const [activeSecurityView, setActiveSecurityView] = useState(null); // 'password', 'notifications', 'presets', 'archive'
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailDispatch: false,
    smsGateway: true,
    soundAlerts: true,
    currency: 'INR (₹)',
    taxComputation: 'Automatic (GST)',
    maintenanceMode: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.data?.settings) {
          const s = res.data.data.settings;
          setSettings(prev => ({ ...prev, ...s }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdateSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      await api.put('/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Settings updated successfully.');
      setActiveSecurityView(null);
    } catch (err) {
      alert('Failed to update settings: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    setPasswordForm(prev => ({ ...prev, current: '' }));
    setProfileForm({ ...adminInfo });
  }, [adminInfo]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone
      });
      setUser(res.data.data.user);
      setAdminInfo(prev => ({ ...prev, ...profileForm }));
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile: ' + (err.response?.data?.message || err.message));
    }
  };

  const { logout } = useShop();

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('New passwords do not match!');
      return;
    }

    try {
      await api.patch('/users/update-password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new
      });
      setActiveSecurityView(null);
      setPasswordForm({ current: '', new: '', confirm: '' });
      alert('Password changed successfully!');
    } catch (err) {
      alert('Failed to change password: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to end your authority session?')) {
      logout();
      navigate('/login');
    }
  };

  const renderSecurityView = () => {
    switch (activeSecurityView) {
      case 'password':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-[#2D1B19] rounded-none border border-white/10 shadow-2xl p-6 text-white"
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h3 className="text-sm font-['Cormorant',_serif] font-bold uppercase tracking-widest text-[#E8B4B8] flex items-center gap-2">
                <FiLock /> Change Master Password
              </h3>
              <button onClick={() => setActiveSecurityView(null)} className="text-white/40 hover:text-white transition-colors"><FiX size={18} /></button>
            </div>
            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-widest pl-1">Current Password</label>
                <input
                  type="password"
                  className="w-full bg-white/5 border border-white/10 p-3 text-sm outline-none focus:border-[#E8B4B8] transition-all"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-widest pl-1">New Password</label>
                  <input type="password" className="w-full bg-white/5 border border-white/10 p-3 text-sm outline-none focus:border-[#E8B4B8] transition-all" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-widest pl-1">Confirm New</label>
                  <input type="password" className="w-full bg-white/5 border border-white/10 p-3 text-sm outline-none focus:border-[#E8B4B8] transition-all" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} required />
                </div>
              </div>
              <div className="flex items-center justify-end gap-5 pt-4">
                <button type="button" onClick={() => setActiveSecurityView(null)} className="text-[9px] font-bold uppercase text-white/40 hover:text-white tracking-widest">Discard</button>
                <button type="submit" className="bg-[#E8B4B8] text-admin-dark px-10 py-3 text-[9px] font-bold uppercase tracking-widest shadow-2xl shadow-[#E8B4B8]/10 hover:bg-white transition-all">Save Changes</button>
              </div>
            </form>
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-none border border-admin-accent/20 shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6 border-b border-admin-accent/5 pb-4">
              <h3 className="text-sm font-['Cormorant',_serif] font-bold uppercase tracking-widest text-admin-accent flex items-center gap-2">
                <FiBell /> Notification Prep
              </h3>
              <button onClick={() => setActiveSecurityView(null)} className="text-gray-300 hover:text-admin-dark transition-colors"><FiX size={18} /></button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Alert browser/mobile on new orders' },
                { key: 'emailDispatch', label: 'Email Dispatch', desc: 'Send summary reports to master email' },
                { key: 'smsGateway', label: 'SMS Gateway', desc: 'High priority customer messages' },
                { key: 'soundAlerts', label: 'Sound Alerts', desc: 'Play chime on inventory updates' },
              ].map((notif, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-admin-light/20 border border-admin-accent/5 group hover:border-admin-accent/30 transition-all">
                  <div>
                    <p className="text-sm font-semibold text-admin-dark">{notif.label}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{notif.desc}</p>
                  </div>
                  <div onClick={() => setSettings({ ...settings, [notif.key]: !settings[notif.key] })} className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${settings[notif.key] ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings[notif.key] ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              ))}
              <button onClick={handleUpdateSettings} className="w-full bg-admin-dark text-white py-3 text-[9px] font-bold uppercase tracking-widest mt-4">Sync Configs</button>
            </div>
          </motion.div>
        );
      case 'presets':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-none border border-admin-gold/20 shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6 border-b border-admin-accent/5 pb-4">
              <h3 className="text-sm font-['Cormorant',_serif] font-bold uppercase tracking-widest text-admin-gold flex items-center gap-2">
                <FiSettings /> System Presets
              </h3>
              <button onClick={() => setActiveSecurityView(null)} className="text-gray-300 hover:text-admin-dark transition-colors"><FiX size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Store Currency</label>
                <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full bg-admin-light/10 border border-admin-accent/10 p-2 text-sm font-medium outline-none">
                  <option value="INR (₹)">INR (₹)</option>
                  <option value="USD ($)">USD ($)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Tax Computation</label>
                <select value={settings.taxComputation} onChange={(e) => setSettings({ ...settings, taxComputation: e.target.value })} className="w-full bg-admin-light/10 border border-admin-accent/10 p-2 text-sm font-medium outline-none">
                  <option value="Automatic (GST)">Automatic (GST)</option>
                  <option value="Manual Override">Manual Override</option>
                </select>
              </div>
              <div className="col-span-2 p-3 bg-admin-accent/5 border border-dashed border-admin-accent/30 flex justify-between items-center">
                <span className="text-sm font-semibold text-admin-accent">Portal Maintenance Mode</span>
                <div onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })} className={`w-8 h-4 bg-gray-200 rounded-full p-0.5 cursor-pointer transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}><div className={`w-3 h-3 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'translate-x-4' : 'translate-x-0'}`} /></div>
              </div>
            </div>
            <button onClick={handleUpdateSettings} className="w-full bg-admin-dark text-white py-3 text-[9px] font-bold uppercase tracking-widest mt-6">Apply Presets</button>
          </motion.div>
        );
      case 'archive':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-admin-light/50 rounded-none border border-admin-accent/10 shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6 border-b border-admin-accent/5 pb-4">
              <h3 className="text-sm font-['Cormorant',_serif] font-bold uppercase tracking-widest text-admin-dark flex items-center gap-2">
                <FiUser /> Session Archive
              </h3>
              <button onClick={() => setActiveSecurityView(null)} className="text-gray-300 hover:text-admin-dark transition-colors"><FiX size={18} /></button>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {[
                { time: '21 Mar 2026, 01:06 PM', ip: '192.168.1.1', device: 'Windows / Chrome', status: 'Success' },
                { time: '20 Mar 2026, 11:45 AM', ip: '192.168.1.1', device: 'Windows / Chrome', status: 'Success' },
                { time: '19 Mar 2026, 09:12 PM', ip: '45.12.33.2', device: 'iPhone / Safari', status: 'Blocked' },
                { time: '19 Mar 2026, 08:30 PM', ip: '192.168.1.1', device: 'Windows / Chrome', status: 'Success' },
              ].map((session, i) => (
                <div key={i} className="bg-white p-3 border border-admin-accent/5 flex justify-between items-center group hover:border-admin-accent/20 transition-all">
                  <div>
                    <p className="text-sm font-semibold text-admin-dark">{session.time}</p>
                    <p className="text-xs text-gray-500 mt-1">{session.device} • {session.ip}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${session.status === 'Success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{session.status}</span>
                </div>
              ))}
            </div>
            <p className="text-[7px] text-center text-gray-400 mt-4 uppercase tracking-widest">Only displaying activity from last 30 days</p>
          </motion.div>
        );
      default:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-none border border-admin-accent/10 shadow-md p-5">
            <h3 className="text-xl font-['Cormorant',_serif] font-bold text-admin-dark mb-6 leading-none flex items-center gap-2">
              <FiShield className="text-admin-gold" size={18} /> Security Controls
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: <FiLock />, label: 'Update Password', desc: 'Secure master access', view: 'password', glow: 'bg-admin-gold/10 text-admin-gold' },
                { icon: <FiBell />, label: 'Notification Prep', desc: 'Alert configurations', view: 'notifications', glow: 'bg-admin-accent/10 text-admin-accent' },
                { icon: <FiSettings />, label: 'System Presets', desc: 'Store operational opts', view: 'presets', glow: 'bg-indigo-50 text-indigo-500' },
                { icon: <FiUser />, label: 'Session Archive', desc: 'Recent entry logs', view: 'archive', glow: 'bg-admin-light/50 text-admin-dark' },
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={() => setActiveSecurityView(item.view)}
                  className="flex items-center justify-between p-4 rounded-none hover:bg-admin-light/20 border border-admin-accent/5 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${item.glow} rounded-none group-hover:scale-110 transition-transform shrink-0 shadow-inner`}>
                      {React.cloneElement(item.icon, { size: 16 })}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-admin-dark">{item.label}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">{item.desc}</p>
                    </div>
                  </div>
                  <FiChevronRight size={14} className="text-gray-200 group-hover:text-admin-accent group-hover:translate-x-1 transition-all" />
                </div>
              ))}

              <div
                onClick={handleLogout}
                className="col-span-1 md:col-span-2 mt-4 flex items-center justify-center p-4 rounded-none bg-red-50 hover:bg-red-600 border border-red-100 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <FiLogOut size={16} className="text-red-500 group-hover:text-white transition-colors" />
                  <p className="text-sm font-bold text-red-600 group-hover:text-white transition-colors">
                    Logout Authority Session
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3 pb-6 font-['Cormorant',_serif]">
      <div className="mb-0.5">
        <h1 className="text-3xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-2">
          Portal Settings
        </h1>
        <p className="text-gray-500 text-[13px] font-poppins">
          Identity & security
        </p>
      </div>
      <AnimatePresence mode="wait">
        {renderSecurityView()}
      </AnimatePresence>
    </div>
  );
};

export default AdminSettings;
