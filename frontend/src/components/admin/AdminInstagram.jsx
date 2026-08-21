import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiEdit2, FiTrash2, FiTrendingUp, FiInstagram, FiEye, FiEyeOff, FiUpload } from 'react-icons/fi';
import api from '../../utils/api';

const AdminInstagram = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const initialFormState = {
        caption: '',
        image: '',
        link: 'https://instagram.com/sadabharatpvtltd/',
        status: 'Show'
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const formDataUpload = new FormData();
            formDataUpload.append('documents', file);
            
            const uploadRes = await api.post('/upload', formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (uploadRes.data.success) {
                const url = uploadRes.data.data[0];
                setFormData(prev => ({ ...prev, image: url }));
            }
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Digital asset transmission failed.');
        } finally {
            setUploading(false);
        }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/instagram');
            setPosts(res.data.data.posts);
        } catch (err) {
            console.error('Failed to fetch instagram posts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosts(); }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.patch(`/instagram/${editingId}`, formData);
            } else {
                await api.post('/instagram', formData);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData(initialFormState);
            fetchPosts();
        } catch (err) {
            alert('Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Erase this post?')) return;
        try {
            await api.delete(`/instagram/${id}`);
            fetchPosts();
        } catch (err) {
            alert('Delete failed');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-2">
                        <FiInstagram className="inline text-admin-accent mr-2" /> Visual Network
                    </h1>
                    <p className="text-gray-500 text-[13px] font-poppins">
                        Community aesthetic synchronizer
                    </p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }}
                    className="bg-admin-dark text-white px-10 py-4 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-2xl"
                >
                    <FiPlus /> Integrate New Moment
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse opacity-50">
                    <div className="w-12 h-12 bg-gray-100 mx-auto mb-4 animate-bounce"></div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Network Buffering...</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4 lg:gap-6">
                    {posts.map(post => (
                        <div key={post._id} className="bg-white group relative aspect-square overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-700">
                            <img src={post.image} alt={post.caption} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-125 group-hover:rotate-2" />
                            <div className="absolute inset-0 bg-admin-dark/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-4 text-center">
                                <p className="text-[9px] text-white font-bold uppercase tracking-tight mb-4 line-clamp-3">"{post.caption}"</p>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => { setEditingId(post._id); setFormData(post); setIsModalOpen(true); }} className="p-3 bg-white/10 hover:bg-admin-accent text-white transition-all shadow-inner"><FiEdit2 size={16} /></button>
                                    <button onClick={() => handleDelete(post._id)} className="p-3 bg-white/10 hover:bg-red-500 text-white transition-all shadow-inner"><FiTrash2 size={16} /></button>
                                </div>
                                <div className="absolute bottom-4 left-0 w-full flex justify-center">
                                    <span className={`text-[7px] font-black uppercase tracking-widest py-1 px-3 ${post.status === 'Show' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'} flex items-center gap-2 border border-white/5`}>
                                        {post.status === 'Show' ? <FiEye /> : <FiEyeOff />} {post.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && createPortal(
                <div data-lenis-prevent className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-none shadow-2xl relative">
                        <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-white z-10">
                            <h2 className="text-lg font-black text-admin-dark uppercase tracking-widest leading-none">Moment Synchronizer</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-admin-dark transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar italic-placeholder">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] pl-1">Aesthetic Narrative (Caption)</label>
                                    <input name="caption" value={formData.caption || ''} onChange={handleChange} required className="w-full bg-gray-50 border border-transparent p-4 text-[11px] font-bold outline-none focus:bg-white focus:border-admin-accent-lite transition-all shadow-inner" placeholder="The glow that never fades..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] pl-1">Visual Asset</label>
                                    <div className="flex gap-2">
                                        <input
                                            name="image"
                                            value={formData.image || ''}
                                            onChange={handleChange}
                                            required
                                            className="flex-1 bg-gray-50 border border-transparent p-4 text-[11px] font-bold outline-none focus:bg-white focus:border-admin-accent-lite transition-all shadow-inner"
                                            placeholder="Upload or link image..."
                                        />
                                        <label className="bg-admin-dark text-white px-5 py-4 cursor-pointer hover:bg-black transition-colors flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest">
                                            {uploading ? <div className="animate-spin w-3 h-3 border-2 border-white/20 border-t-white rounded-full"></div> : <FiUpload size={14} />}
                                            <span>Upload</span>
                                            <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] pl-1">Redirect Network Path (Insta Link)</label>
                                    <input name="link" value={formData.link || ''} onChange={handleChange} required className="w-full bg-gray-50 border border-transparent p-4 text-[11px] font-bold outline-none focus:bg-white focus:border-admin-accent-lite transition-all shadow-inner" placeholder="https://instagram.com/p/..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] pl-1">Network Visibility Status</label>
                                    <select name="status" value={formData.status || 'Show'} onChange={handleChange} className="w-full bg-gray-50 border border-transparent p-4 text-[11px] font-bold outline-none focus:bg-white focus:border-admin-accent-lite transition-all shadow-inner">
                                        <option value="Show">Public Synchronize</option>
                                        <option value="Hide">Private Archive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-5 items-center">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[9px] font-black uppercase text-gray-300 hover:text-admin-dark tracking-widest transition-colors leading-none">Discard</button>
                                <button type="submit" disabled={uploading} className={`bg-admin-dark text-white px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center gap-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {uploading ? 'Processing...' : <><FiTrendingUp /> Commit To Feed</>}
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

export default AdminInstagram;
