import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiSave, FiClock, FiFileText, FiRefreshCw } from 'react-icons/fi';
import api from '../../utils/api';

const policyKeys = [
  { id: 'privacy', name: 'Privacy Policy' },
  { id: 'return', name: 'Return Policy' },
  { id: 'terms', name: 'Terms & Conditions' },
  { id: 'cancellation', name: 'Cancellation Policy' },
  { id: 'shipping', name: 'Shipping Policy' }
];

const AdminPolicies = () => {
  const [activeTab, setActiveTab] = useState('privacy');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchPolicy = async (type) => {
    try {
      setLoading(true);
      setMessage('');
      const res = await api.get(`/policies/${type}`);
      if (res.data?.data) {
        setContent(res.data.data.content || '');
      }
    } catch (err) {
      console.error(err);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy(activeTab);
  }, [activeTab]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      setMessage('');
      const token = localStorage.getItem('admin_token');
      await api.put(`/policies/${activeTab}`, { content }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Policy synchronized successfully!');
    } catch (err) {
      alert('Failed to update policy: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-3xl font-['Cormorant',_serif] font-black text-admin-dark leading-none mb-2">
            <FiShield className="inline text-admin-accent mr-2" /> Legal & Policies
          </h1>
          <p className="text-gray-500 text-[13px] font-poppins">
            Synchronize customer agreements & legal terms in the database
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {policyKeys.map((policy) => (
            <button
              key={policy.id}
              onClick={() => setActiveTab(policy.id)}
              className={`w-full text-left px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-3 ${
                activeTab === policy.id
                  ? 'bg-admin-dark text-white border-admin-dark shadow-lg'
                  : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
              }`}
            >
              <FiFileText size={16} />
              {policy.name}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
              <div>
                <h2 className="text-lg font-serif font-black text-admin-dark uppercase tracking-wide">
                  Editing {policyKeys.find(p => p.id === activeTab)?.name}
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">HTML or Rich Text Format Supported</p>
              </div>
              <button 
                onClick={() => fetchPolicy(activeTab)} 
                className="p-2 text-gray-400 hover:text-admin-dark hover:bg-gray-50 rounded-full transition-all"
                title="Reload current version"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="py-24 text-center animate-pulse opacity-50 flex flex-col items-center justify-center gap-3">
                <FiClock size={32} className="animate-spin text-admin-accent" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Retrieving policy content...</p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 pl-1">Policy Content Markup</label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={16}
                    className="w-full bg-gray-50 border border-transparent rounded-2xl p-5 text-xs font-medium focus:bg-white focus:border-admin-accent/20 focus:ring-4 focus:ring-admin-accent/5 transition-all outline-none font-mono leading-relaxed resize-y"
                    placeholder="Enter policy terms here..."
                  />
                </div>

                {message && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-600 text-[10px] font-black uppercase tracking-widest pl-1"
                  >
                    {message}
                  </motion.p>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex items-center gap-2 bg-admin-dark text-white px-8 py-4 rounded-2rem text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
                  >
                    <FiSave size={16} />
                    {saveLoading ? 'Saving...' : 'Save & Publish'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPolicies;
