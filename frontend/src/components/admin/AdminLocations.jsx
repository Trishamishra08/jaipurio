import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiMapPin, FiX, FiCheck } from 'react-icons/fi';

import api from '../../utils/api';


const AdminLocations = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editLocation, setEditLocation] = useState(null);

    const [formData, setFormData] = useState({
        pincode: '',
        city: '',
        district: '',
        state: '',
        isActive: true
    });

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/locations');
            if (res.data?.data?.locations) {
                setLocations(res.data.data.locations);
            }
        } catch (error) {
            console.error('Failed to fetch locations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            if (editLocation) {
                await api.put(`/locations/${editLocation._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await api.post('/locations', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsModalOpen(false);
            setEditLocation(null);
            setFormData({ pincode: '', city: '', district: '', state: '', isActive: true });
            fetchLocations();
        } catch (error) {
            alert('Error saving location: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this operational location?')) {
            try {
                const token = localStorage.getItem('admin_token');
                await api.delete(`/locations/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchLocations();
            } catch (error) {
                alert('Failed to delete location');
            }
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('admin_token');
            await api.put(`/locations/${id}`, { isActive: !currentStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLocations(locations.map(loc => loc._id === id ? { ...loc, isActive: !currentStatus } : loc));
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    };

    const openEdit = (location) => {
        setEditLocation(location);
        setFormData({
            pincode: location.pincode,
            city: location.city,
            district: location.district,
            state: location.state,
            isActive: location.isActive
        });
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-12 text-center"><div className="animate-spin w-10 h-10 border-4 border-admin-dark mx-auto border-t-transparent rounded-full"></div></div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto space-y-6 pb-20"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-['Cormorant',_serif] font-black text-[#4A2C2C] tracking-tight">Service Locations</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1">Manage Deliverable Regions & Pincodes</p>
                </div>
                <button
                    onClick={() => {
                        setEditLocation(null);
                        setFormData({ pincode: '', city: '', district: '', state: '', isActive: true });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-[#4A2C2C] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-admin-accent transition-all shadow-xl active:scale-95"
                >
                    <FiPlus size={16} /> Add New Region
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-2xl shadow-admin-accent/5 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-admin-accent/[0.02] border-b border-gray-100">
                                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pincode</th>
                                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">City</th>
                                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">District & State</th>
                                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locations.map((loc) => (
                                <tr key={loc._id} className="border-b border-gray-50 hover:bg-admin-accent/[0.01] transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-admin-accent/10 flex items-center justify-center text-admin-accent">
                                                <FiMapPin size={14} />
                                            </div>
                                            <span className="font-black text-admin-dark text-base tracking-tight">{loc.pincode}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm font-bold text-gray-700 capitalize">{loc.city}</span>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-xs font-black text-admin-dark capitalize">{loc.district}</p>
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">{loc.state}</p>
                                    </td>
                                    <td className="p-6 text-center">
                                        <button
                                            onClick={() => toggleStatus(loc._id, loc.isActive)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-widest transition-all ${loc.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                        >
                                            {loc.isActive ? 'Serviceable' : 'Suspended'}
                                        </button>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(loc)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-admin-accent/10 hover:text-admin-accent transition-all">
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(loc._id)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {locations.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <FiMapPin size={40} className="text-gray-100" />
                                            <p className="text-gray-400 text-sm font-['Cormorant',_serif] italic">No operational regions defined yet...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-admin-dark/40 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
                        >
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div>
                                    <h3 className="text-2xl font-['Cormorant',_serif] font-black text-admin-dark uppercase tracking-tight">
                                        {editLocation ? 'Edit Territory' : 'Define Territory'}
                                    </h3>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Operational Logistics Configuration</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-admin-accent/10 rounded-full transition-colors">
                                    <FiX size={24} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5">Pincode</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.pincode}
                                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                                minLength={6}
                                                maxLength={6}
                                                pattern="[0-9]{6}"
                                                className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-admin-accent/20 focus:ring-4 focus:ring-admin-accent/5 transition-all outline-none"
                                                placeholder="e.g. 452011"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5">City</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-admin-accent/20 focus:ring-4 focus:ring-admin-accent/5 transition-all outline-none"
                                                placeholder="e.g. Fatehabad"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5">District</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.district}
                                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                                className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-admin-accent/20 focus:ring-4 focus:ring-admin-accent/5 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5">State</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.state}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-admin-accent/20 focus:ring-4 focus:ring-admin-accent/5 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-admin-accent/5 p-4 rounded-2xl border border-admin-accent/10">
                                        <input
                                            type="checkbox"
                                            id="active-status"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-5 h-5 accent-admin-accent cursor-pointer"
                                        />
                                        <label htmlFor="active-status" className="text-xs font-black uppercase tracking-widest text-[#5C2E3E] cursor-pointer">Currently Serve this Region</label>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            className="w-full bg-admin-dark hover:bg-admin-accent text-white py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            <FiCheck size={18} /> {editLocation ? 'Apply Updates' : 'Confirm Territory'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminLocations;
