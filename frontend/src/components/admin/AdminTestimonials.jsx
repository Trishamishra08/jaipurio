import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiStar, FiCheckCircle, FiUpload } from 'react-icons/fi';
import api from '../../utils/api';

const AdminTestimonials = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const initialFormState = {
        name: '',
        content: '',
        image: '',
        rating: 5,
        role: 'Verified Buyer',
        isApproved: true
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const url = URL.createObjectURL(file); // Note: replace with real upload if needed
            setFormData(prev => ({ ...prev, image: url }));
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Image upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admins/testimonials');
            setTestimonials(res.data.data.testimonials);
        } catch (err) {
            console.error('Failed to fetch testimonials:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTestimonials(); }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Handle parsing status to isApproved Boolean
            const payload = { ...formData, isApproved: formData.status === 'Approved' };
            if (editingId) {
                await api.patch(`/admins/testimonials/${editingId}`, payload);
            } else {
                await api.post('/admins/testimonials', payload);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData(initialFormState);
            fetchTestimonials();
        } catch (err) {
            alert('Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Archive this feedback?')) return;
        try {
            await api.delete(`/admins/testimonials/${id}`);
            fetchTestimonials();
        } catch (err) {
            alert('Delete failed');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto font-serif">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-2">
                        <FiUsers className="text-admin-accent" /> Social Proof Vault
                    </h1>
                    <p className="text-gray-500 text-[13px] font-poppins">
                        Human stories & customer credibility
                    </p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }}
                    className="bg-brand-dark text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl font-sans"
                >
                    <FiPlus /> New Feedback
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse">
                    <div className="w-10 h-10 border-4 border-brand-gold border-t-brand-pink rounded-full mx-auto mb-4 animate-spin"></div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">Loading Community Voices...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {testimonials.map(testi => (
                        <div key={testi._id} className="bg-white group relative p-4 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-700">
                            <div className="aspect-[3/4] overflow-hidden bg-gray-50 mb-4 grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000">
                                <img src={testi.image} alt={testi.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-brand-dark uppercase tracking-tighter">{testi.name}</h3>
                                    <div className="flex text-brand-gold gap-0.5"><FiStar size={10} fill="currentColor" /> <FiStar size={10} fill="currentColor" /> <FiStar size={10} fill="currentColor" /> <FiStar size={10} fill="currentColor" /> <FiStar size={10} fill="currentColor" /></div>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-4 italic">"{testi.content}"</p>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className={`text-[8px] font-black uppercase px-2 py-1 flex items-center gap-1 ${testi.isApproved ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                        <FiCheckCircle size={10} /> {testi.isApproved ? 'Approved' : 'Pending'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingId(testi._id); setFormData({...testi, status: testi.isApproved ? 'Approved' : 'Pending'}); setIsModalOpen(true); }} className="p-2 text-gray-300 hover:text-brand-pink transition-colors"><FiEdit2 size={12} /></button>
                                        <button onClick={() => handleDelete(testi._id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><FiTrash2 size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && createPortal(
                <div data-lenis-prevent className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-none shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h2 className="text-lg font-black text-brand-dark uppercase tracking-widest">Document Authority Evidence</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-brand-dark">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans max-h-[85vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Display Name</label>
                                    <input name="name" value={formData.name || ''} onChange={handleChange} required className="w-full bg-gray-50 border border-transparent p-3 text-[10px] font-bold outline-none focus:bg-white focus:border-brand-pink-lite transition-all" placeholder="Enter witness name..." />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Portrait Link or Upload</label>
                                    <div className="flex gap-2">
                                        <input
                                            name="image"
                                            value={formData.image || ''}
                                            onChange={handleChange}
                                            required
                                            className="flex-1 bg-gray-50 border border-transparent p-3 text-[10px] font-bold outline-none focus:bg-white focus:border-brand-pink-lite transition-all shadow-inner"
                                            placeholder="https://res.cloudinary.com/..."
                                        />
                                        <label className="bg-brand-dark text-white px-4 py-3 cursor-pointer hover:bg-black transition-colors flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                                            {uploading ? <div className="animate-spin w-3 h-3 border-2 border-white/20 border-t-white rounded-full"></div> : <FiUpload size={12} />}
                                            <span>Upload</span>
                                            <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Voice Narrative</label>
                                    <textarea name="content" value={formData.content || ''} onChange={handleChange} required className="w-full bg-gray-50 border border-transparent p-3 text-[10px] font-bold outline-none focus:bg-white focus:border-brand-pink-lite transition-all h-20 resize-none" placeholder="Enter customer success story..."></textarea>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Aesthetic Rotation</label>
                                    <select name="rotate" value={formData.rotate || 'rotate-2'} onChange={handleChange} className="w-full bg-gray-50 border border-transparent p-3 text-[10px] font-bold outline-none focus:bg-white focus:border-brand-pink-lite transition-all">
                                        <option value="rotate-1">1 Degree Left</option>
                                        <option value="rotate-2">2 Degree Left</option>
                                        <option value="rotate-3">3 Degree Left</option>
                                        <option value="-rotate-1">1 Degree Right</option>
                                        <option value="-rotate-2">2 Degree Right</option>
                                        <option value="-rotate-3">3 Degree Right</option>
                                        <option value="rotate-0">Geometric Center</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Verification Status</label>
                                    <select name="status" value={formData.status || 'Approved'} onChange={handleChange} className="w-full bg-gray-50 border border-transparent p-3 text-[10px] font-bold outline-none focus:bg-white focus:border-brand-pink-lite transition-all">
                                        <option value="Approved">Verified Authority</option>
                                        <option value="Pending">Queue Review</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[9px] font-bold uppercase text-gray-400 hover:text-brand-dark tracking-widest transition-colors">Discard</button>
                                <button type="submit" disabled={uploading} className={`bg-brand-dark text-white px-10 py-3 text-[9px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {uploading ? 'Processing...' : 'Save To Vault'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminTestimonials;
