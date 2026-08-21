import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import {
    FiZap,
    FiSearch,
    FiCheckCircle,
    FiTarget,
    FiStar,
    FiImage,
    FiArrowRight,
    FiLoader,
    FiEdit2,
    FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../../context/ShopContext';

import { Link } from 'react-router-dom';
import api from '../../utils/api'; // Real API import for offers

const AdminOffers = () => {
    const { products, offers, fetchData } = useShop();
    const [searchQuery, setSearchQuery] = useState('');
    const [isUpdating, setIsUpdating] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState({ price: '', oldPrice: '' });
    
    // Dynamic Offers State
    const [newOffer, setNewOffer] = useState({ title: '', badge: 'DEAL', category: '', discountValue: '', image: '' });
    const [isAddingOffer, setIsAddingOffer] = useState(false);
    const [editingOfferId, setEditingOfferId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Base64 File Conversion
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleOfferImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const base64 = await fileToBase64(file);
            setNewOffer(prev => ({ ...prev, image: base64 }));
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveOffer = async () => {
        try {
            if (editingOfferId) {
                await api.put(`/offers/${editingOfferId}`, newOffer);
            } else {
                await api.post('/offers', newOffer);
            }
            setNewOffer({ title: '', badge: 'DEAL', category: '', discountValue: '', image: '' });
            setIsAddingOffer(false);
            setEditingOfferId(null);
            await fetchData();
        } catch (err) {
            alert('Failed to save offer: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEditOfferClick = (offer) => {
        setNewOffer({
            title: offer.title,
            badge: offer.badge || 'DEAL',
            category: offer.category,
            discountValue: offer.discountValue || '',
            image: offer.image || ''
        });
        setEditingOfferId(offer._id);
        setIsAddingOffer(true);
    };

    const handleDeleteOffer = async (id) => {
        if(window.confirm('Are you sure you want to delete this offer category?')) {
            try {
                await api.delete(`/offers/${id}`);
                await fetchData();
            } catch (err) {
                alert('Failed to delete offer: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const toggleOffer = async (product) => {
        setIsUpdating(product._id);
        try {
            await api.put(`/products/${product._id}`, {
                ...product,
                flashSale: !product.flashSale
            });
            await fetchData();
        } catch (err) {
            alert('Failed to update offer status: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsUpdating(null);
        }
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);
        setEditForm({
            price: product.price,
            oldPrice: product.oldPrice || ''
        });
    };

    const handleUpdateProduct = async () => {
        setIsUpdating(editingProduct._id);
        try {
            await api.put(`/products/${editingProduct._id}`, {
                ...editingProduct,
                price: Number(editForm.price),
                oldPrice: editForm.oldPrice ? Number(editForm.oldPrice) : null
            });
            setEditingProduct(null);
            await fetchData();
        } catch (err) {
            alert('Failed to update product: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsUpdating(null);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const offerProducts = products.filter(p => p.flashSale);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Dynamic Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-2">
                        Divine Offers Management
                    </h1>
                    <p className="text-sm font-sans font-medium text-gray-500 capitalize tracking-normal">
                        Manage your sales, daily deals, and promotional spotlights.
                    </p>
                </div>

                <Link to="/admin/banners" className="bg-brand-pink text-white px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-pink/20 hover:opacity-90 transition-all">
                    <FiImage size={16} /> Manage Offer Banners
                </Link>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-50 px-4 py-2.5 rounded-xl border border-orange-100 shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
                        <FiZap size={16} />
                    </div>
                    <div>
                        <p className="text-xs font-sans font-medium text-gray-500 capitalize leading-none mb-1">Active Offers</p>
                        <p className="text-lg font-bold text-gray-800 leading-none">{offerProducts.length}</p>
                    </div>
                </div>

                <div className="bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                        <FiTarget size={16} />
                    </div>
                    <div>
                        <p className="text-xs font-sans font-medium text-gray-500 capitalize leading-none mb-1">Target Reach</p>
                        <p className="text-lg font-bold text-gray-800 leading-none">High</p>
                    </div>
                </div>

                <div className="bg-purple-50 px-4 py-2.5 rounded-xl border border-purple-100 shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500">
                        <FiStar size={16} />
                    </div>
                    <div>
                        <p className="text-xs font-sans font-medium text-gray-500 capitalize leading-none mb-1">Current Strategy</p>
                        <p className="text-lg font-bold text-gray-800 leading-none italic">Divine Savings</p>
                    </div>
                </div>
            </div>

            {/* Dynamic Offers / Categories Management */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                    <div>
                        <h3 className="text-sm font-sans font-bold text-gray-800 capitalize tracking-normal">Dynamic Offer Categories</h3>
                        <p className="text-[10px] text-gray-500 mt-1">These show up in the top Navbar dropdown and the Offers sidebar.</p>
                    </div>
                    <button 
                        onClick={() => {
                            if (isAddingOffer) {
                                setIsAddingOffer(false);
                                setEditingOfferId(null);
                                setNewOffer({ title: '', category: '', discountValue: '' });
                            } else {
                                setIsAddingOffer(true);
                            }
                        }}
                        className="bg-brand-dark text-white px-4 py-2 rounded-lg text-xs font-bold transition-all hover:bg-black"
                    >
                        {isAddingOffer ? 'Cancel' : '+ Add Offer Category'}
                    </button>
                </div>
                
                <AnimatePresence>
                    {isAddingOffer && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-gray-100 bg-gray-50/30 overflow-hidden">
                            <div className="p-4 flex flex-col md:flex-row gap-4 items-end flex-wrap">
                                <div className="w-full md:w-32 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Badge</label>
                                    <input type="text" placeholder="e.g. DEAL" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-brand-pink" value={newOffer.badge} onChange={e => setNewOffer({...newOffer, badge: e.target.value})} />
                                </div>
                                <div className="flex-1 min-w-[200px] space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Display Title</label>
                                    <input type="text" placeholder="e.g. Up to 50% Off On Skincare" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-brand-pink" value={newOffer.title} onChange={e => setNewOffer({...newOffer, title: e.target.value})} />
                                </div>
                                <div className="flex-1 min-w-[200px] space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Search Keyword (Category)</label>
                                    <input type="text" placeholder="e.g. Skincare" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-brand-pink" value={newOffer.category} onChange={e => setNewOffer({...newOffer, category: e.target.value})} />
                                </div>
                                <div className="w-full md:w-32 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Discount %</label>
                                    <input type="number" placeholder="e.g. 50" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-brand-pink" value={newOffer.discountValue} onChange={e => setNewOffer({...newOffer, discountValue: e.target.value})} />
                                </div>
                                <div className="w-full md:w-64 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image</label>
                                    <div className="flex items-center gap-2">
                                        <input type="file" accept="image/*" id="offerImage" className="hidden" onChange={handleOfferImageUpload} />
                                        <label htmlFor="offerImage" className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 cursor-pointer text-center hover:bg-gray-50 truncate">
                                            {isUploading ? 'Uploading...' : (newOffer.image ? 'Image Selected' : 'Choose Image')}
                                        </label>
                                    </div>
                                </div>
                                <button onClick={handleSaveOffer} className="bg-brand-pink text-white px-6 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 w-full md:w-auto shrink-0 shadow-lg shadow-brand-pink/20">
                                    {editingOfferId ? 'Update Offer' : 'Save Offer'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="p-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white border-b border-gray-100">
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Badge</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Display Title</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Search Filter</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Discount</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {offers && offers.length > 0 ? offers.map(off => (
                                <tr key={off._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        {off.image ? <img src={off.image} alt="" className="w-10 h-10 object-cover rounded-md" /> : <div className="w-10 h-10 bg-gray-100 rounded-md" />}
                                    </td>
                                    <td className="px-4 py-3 text-xs font-black text-brand-pink">{off.badge}</td>
                                    <td className="px-4 py-3 text-sm font-sans font-medium text-gray-800">{off.title}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500 font-medium">{off.category}</td>
                                    <td className="px-4 py-3 text-xs font-black text-brand-pink">{off.discountValue ? `${off.discountValue}%` : '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button onClick={() => handleEditOfferClick(off)} className="p-1.5 text-blue-400 hover:text-blue-600 transition-colors bg-blue-50 hover:bg-blue-100 rounded">
                                                <FiEdit2 size={12} />
                                            </button>
                                            <button onClick={() => handleDeleteOffer(off._id)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 rounded">
                                                <FiX size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        No dynamic offers added yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Active Offers Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                            <h3 className="text-[11px] font-black text-brand-dark uppercase tracking-widest">Current Spotlights</h3>
                        </div>
                        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto custom-sidebar-scrollbar">
                            {offerProducts.length > 0 ? offerProducts.map(p => (
                                <div key={p._id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="w-10 h-10 bg-white rounded-lg p-1 overflow-hidden shrink-0">
                                        <img src={p.image} alt="" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-gray-800 truncate">{p.name}</p>
                                        <p className="text-[9px] font-black text-brand-pink">₹{p.price} <span className="text-gray-400 line-through ml-1">{p.oldPrice ? `₹${p.oldPrice}` : ''}</span></p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEditClick(p)} className="p-1.5 text-gray-400 hover:text-brand-dark"><FiEdit2 size={12} /></button>
                                        <button
                                            onClick={() => toggleOffer(p)}
                                            className="p-1.5 text-red-300 hover:text-red-500 transition-colors"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10">
                                    <FiZap className="mx-auto text-gray-200 mb-2" size={32} />
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                        No active offers detected. <br /> Spotlight some products below.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-brand-dark rounded-2xl p-6 text-white overflow-hidden relative">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-2 text-brand-gold italic">Pro Tip</h3>
                        <p className="text-[10px] font-medium text-white/70 leading-relaxed">
                            Products in this list will automatically be prioritized on the user's "Divine Savings" page. Ensure your titles are catchy!
                        </p>
                    </div>
                </div>

                {/* Product Selection List */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-[11px] font-black text-brand-dark uppercase tracking-widest">Select Products for Sale</h3>
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                                <input
                                    type="text"
                                    placeholder="Filter by name..."
                                    className="bg-gray-50 border border-transparent focus:border-gray-200 rounded-lg pl-9 pr-4 py-2 text-[11px] font-medium outline-none transition-all w-full md:w-64"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-xs font-sans font-bold uppercase tracking-widest text-gray-500">PRODUCT</th>
                                        <th className="px-4 py-3 text-xs font-sans font-bold uppercase tracking-widest text-gray-500">CATEGORY</th>
                                        <th className="px-4 py-3 text-xs font-sans font-bold uppercase tracking-widest text-gray-500">PRICE</th>
                                        <th className="px-4 py-3 text-xs font-sans font-bold uppercase tracking-widest text-gray-500 text-center">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredProducts.map(p => (
                                        <tr key={p._id} className={`hover:bg-gray-50/50 transition-colors ${p.flashSale ? 'bg-orange-50/10' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={p.image} className="w-10 h-10 rounded p-0.5 bg-gray-50 object-contain" alt="" />
                                                    <span className="text-sm font-medium text-gray-800 line-clamp-1">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-medium text-gray-500 capitalize">{p.category}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm text-admin-dark">₹{p.price}</span>
                                                    {p.oldPrice && <span className="text-xs text-gray-400 line-through">₹{p.oldPrice}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center items-center gap-3">
                                                    <button onClick={() => handleEditClick(p)} className="p-2 bg-gray-100 hover:bg-brand-dark hover:text-white rounded-lg transition-all"><FiEdit2 size={14} /></button>
                                                    <button
                                                        onClick={() => toggleOffer(p)}
                                                        disabled={isUpdating === p._id}
                                                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${p.flashSale
                                                            ? 'bg-orange-50 text-orange-600 shadow-sm'
                                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {isUpdating === p._id ? (
                                                            <FiLoader className="animate-spin" />
                                                        ) : (
                                                            p.flashSale ? <><FiCheckCircle /> Listed</> : 'Market as Offer'
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setEditingProduct(null)}
                            className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest">Adjust Offer Price</h3>
                                <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-brand-dark"><FiX size={20} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sale Price (Current)</label>
                                    <input
                                        type="number"
                                        value={editForm.price}
                                        onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-brand-pink transition-all"
                                        placeholder="Enter Sale Price"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Original Price (Strike-through)</label>
                                    <input
                                        type="number"
                                        value={editForm.oldPrice}
                                        onChange={e => setEditForm({ ...editForm, oldPrice: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-brand-pink transition-all"
                                        placeholder="Enter Original Price (optional)"
                                    />
                                </div>

                                <button
                                    onClick={handleUpdateProduct}
                                    disabled={isUpdating === editingProduct._id}
                                    className="w-full bg-brand-dark text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-brand-dark/20 disabled:opacity-50 mt-4"
                                >
                                    {isUpdating === editingProduct._id ? 'Updating Database...' : 'Commit Price Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Internal icon for specific removal
const FiTrash2 = ({ size }) => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size}>
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

export default AdminOffers;
