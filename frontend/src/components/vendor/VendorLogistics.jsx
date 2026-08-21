import React, { useState, useEffect } from 'react';
import { FiTruck, FiMapPin, FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

// MOCK API for Frontend-Only mode
const api = {
  get: async () => ({ data: { data: { products: [], categories: [], banners: [], settings: {}, orders: [], users: [], stats: [], recentTransactions: [], dailyRevenue: [], vendors: [], blogs: [], returns: [], testimonials: [], reviews: [], replacements: [], supportTickets: [], locations: [], coupons: [], logs: [] }, status: 'success' } }),
  post: async () => ({ data: { data: { order: { orderId: 'MOCK-ORDER-123' } }, status: 'success' } }),
  patch: async () => ({ data: { status: 'success' } }),
  delete: async () => ({ data: { status: 'success' } })
};

const VendorLogistics = () => {
    const [settings, setSettings] = useState({
        pickupAddress: '123 Ayurvedic Market, Wellness Street, New Delhi, 110001',
        preferredPartner: 'Delhivery',
        processingDays: '1-2 Days',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });

    // Assuming we fetch vendor-specific settings here
    useEffect(() => {
        // Mock fetch
    }, []);

    const handleChange = (e) => setSettings({ ...settings, [e.target.name]: e.target.value });

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        // Simulate API call
        setTimeout(() => {
            setSaving(false);
            setMessage({ type: 'success', content: 'Logistics settings updated successfully.' });
            setTimeout(() => setMessage({ type: '', content: '' }), 3000);
        }, 800);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 p-4 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-2 flex items-center gap-2">
                        <FiTruck className="text-admin-accent" /> Logistics & Shipping
                    </h1>
                    <p className="text-gray-500 text-[13px] font-poppins">
                        Manage your store's pickup locations and delivery preferences.
                    </p>
                </div>
            </div>

            {message.content && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold shadow-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                    {message.type === 'error' ? <FiAlertCircle size={18} /> : <FiCheckCircle size={18} />}
                    {message.content}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* Pickup Details */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                            <FiMapPin size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-['Cormorant',_serif] font-bold text-admin-dark">Origin Location</h2>
                            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Default Pickup Address</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Complete Pickup Address</label>
                            <textarea
                                name="pickupAddress"
                                value={settings.pickupAddress}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-transparent focus:border-admin-accent-lite focus:bg-white rounded-xl p-4 text-sm font-medium outline-none transition-all h-24 resize-none"
                                placeholder="Enter your full warehouse or shop address..."
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Delivery Preferences */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                            <FiTruck size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-['Cormorant',_serif] font-bold text-admin-dark">Shipping Preferences</h2>
                            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Courier & Processing</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preferred Courier Partner</label>
                            <select
                                name="preferredPartner"
                                value={settings.preferredPartner}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-transparent focus:border-admin-accent-lite focus:bg-white rounded-xl p-3.5 text-sm font-medium outline-none transition-all"
                            >
                                <option value="Delhivery">Delhivery</option>
                                <option value="Bluedart">Bluedart</option>
                                <option value="Ecom Express">Ecom Express</option>
                                <option value="Shadowfax">Shadowfax</option>
                                <option value="Sada Bharat Fulfillment">Sada Bharat Fulfillment (Platform)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Order Processing Time</label>
                            <select
                                name="processingDays"
                                value={settings.processingDays}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-transparent focus:border-admin-accent-lite focus:bg-white rounded-xl p-3.5 text-sm font-medium outline-none transition-all"
                            >
                                <option value="Same Day">Same Day Dispatch</option>
                                <option value="1-2 Days">1-2 Business Days</option>
                                <option value="2-3 Days">2-3 Business Days</option>
                                <option value="3-5 Days">3-5 Business Days</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`bg-admin-dark text-white px-10 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-black transition-all ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FiSave size={16} />
                        )}
                        {saving ? 'Updating...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VendorLogistics;
