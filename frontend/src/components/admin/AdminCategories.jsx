import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMoreVertical, FiX, FiImage, FiArrowLeft, FiGrid, FiSmile, FiUploadCloud } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../../context/ShopContext';

import { categoryService } from '../../services/categoryService';


import iconHairCare from '../../assets/images/icons/icon_hair_care_1779911677580.png';
import iconSkinCare from '../../assets/images/icons/icon_skin_care_1779911695841.png';
import iconHealthCare from '../../assets/images/icons/icon_health_care_1779911711916.png';
import iconHerbalTea from '../../assets/images/icons/icon_herbal_tea_1779911729080.png';
import iconSupplements from '../../assets/images/icons/icon_supplements_1779911746926.png';
import iconBodyCare from '../../assets/images/icons/icon_body_care_1779911767707.png';
import iconAromatherapy from '../../assets/images/icons/icon_aromatherapy_1779911786264.png';
import iconBabyCare from '../../assets/images/icons/icon_baby_care_1779911800390.png';

const AdminCategories = () => {
  const { categories, products, fetchData } = useShop();
  const [isAdding, setIsAdding] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({ name: '', image: '' });

  const getCategoryIconSrc = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('hair')) return iconHairCare;
    if (n.includes('skin')) return iconSkinCare;
    if (n.includes('health') || n.includes('well') || n.includes('immun')) return iconHealthCare;
    if (n.includes('tea') || n.includes('herbal')) return iconHerbalTea;
    if (n.includes('supplement') || n.includes('digest')) return iconSupplements;
    if (n.includes('body')) return iconBodyCare;
    if (n.includes('aroma')) return iconAromatherapy;
    if (n.includes('baby')) return iconBabyCare;
    return iconHairCare;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('Upload failed: ' + err.message);
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Securely remove this category from the store hierarchy?')) {
      try {
        await categoryService.deleteCategory(id);
        fetchData();
      } catch (err) {
        alert('Failed to delete category');
      }
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (form.name && form.image) {
      setIsSubmitting(true);
      try {
        const payload = { title: form.name, url: form.image };
        if (editingCat) {
          await categoryService.updateCategory(editingCat._id, payload);
        } else {
          await categoryService.createCategory(payload);
        }
        fetchData();
        setIsAdding(false);
        setForm({ name: '', image: '' });
        setEditingCat(null);
      } catch (err) {
        console.error('Failed to save category', err);
        alert('Failed to save category');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert('Please provide a name and an image.');
    }
  };

  const startEdit = (cat) => {
    setEditingCat(cat);
    setForm({ name: cat.title || cat.name, image: cat.url || cat.image || '' });
    setIsAdding(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 min-h-screen">
      <AnimatePresence mode="wait">
        {!isAdding ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-2">
                  Store Categories
                </h1>
                <p className="text-gray-500 text-[13px] font-poppins">
                  Manage your product hierarchy
                </p>
              </div>
              <button
                onClick={() => { setEditingCat(null); setForm({ name: '', image: '' }); setIsAdding(true); }}
                className="bg-admin-dark text-white px-5 py-2 rounded-none text-[9px] font-bold uppercase tracking-widest shadow-xl shadow-admin-dark/20 flex items-center gap-2 hover:bg-black transition-all"
              >
                <FiPlus /> Add New Category
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {categories.map((cat, i) => {
                const displayName = cat.title || cat.name;
                const displayImage = cat.url || cat.image;
                const productCount = products.filter(p => p.category === displayName || p.category?._id === cat._id).length;
                return (
                  <motion.div
                    key={cat._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 flex flex-col items-center gap-3 text-center"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden shadow-sm group-hover:shadow-md transition-shadow shrink-0">
                      <img
                        src={displayImage || getCategoryIconSrc(displayName)}
                        alt={displayName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="w-full">
                      <h3 className="text-sm font-sans font-bold text-admin-dark capitalize tracking-wide mb-2 group-hover:text-admin-accent transition-colors truncate">{displayName}</h3>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-[11px] font-sans font-medium text-gray-500">{productCount} Items</span>
                        <div className="flex items-center gap-0.5">
                          <button onClick={(e) => { e.stopPropagation(); startEdit(cat); }} className="p-1.5 text-admin-dark hover:bg-admin-accent/10 transition-all rounded-md"><FiEdit2 size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(cat._id); }} className="p-1.5 text-red-500 hover:bg-red-50 transition-all rounded-md"><FiTrash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              <button
                onClick={() => { setEditingCat(null); setForm({ name: '', image: '' }); setIsAdding(true); }}
                className="h-full min-h-[140px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-admin-accent/40 hover:text-admin-accent hover:bg-admin-accent/[0.02] transition-all group bg-white p-4"
              >
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-admin-accent/10 transition-colors">
                  <FiPlus size={20} className="group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-sm font-sans font-bold capitalize tracking-wide">Add New</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="add"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-md mx-auto bg-white rounded-2xl border border-admin-accent/10 shadow-2xl p-5 relative overflow-hidden font-sans"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-admin-dark" />
            <button
              onClick={() => setIsAdding(false)}
              className="absolute top-4 right-4 p-1.5 bg-gray-50 text-admin-dark rounded-lg hover:bg-admin-accent/10 transition-all font-bold"
            >
              <FiX size={12} />
            </button>

            <div className="mb-5 text-center pt-1 font-['Cormorant',_serif]">
              <div className="w-10 h-10 bg-admin-light rounded-xl flex items-center justify-center text-admin-dark mx-auto mb-2 border border-admin-accent/5 shadow-inner">
                <FiGrid size={18} />
              </div>
              <h2 className="text-3xl font-['Cormorant',_serif] font-bold text-admin-dark leading-none mb-2">
                {editingCat ? 'Edit Category' : 'New Category'}
              </h2>
              <p className="text-gray-500 text-[13px] font-poppins">
                Store hierarchy hub
              </p>
            </div>

            <form onSubmit={handleAdd} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-admin-dark/40 uppercase tracking-widest ml-1">Title</label>
                <div className="relative">
                  <FiEdit2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
                  <input
                    type="text"
                    placeholder="e.g. Organic Soaps"
                    className="w-full bg-gray-50 border border-gray-100 p-2.5 pl-10 rounded-lg text-[10px] font-black uppercase tracking-wider outline-none focus:border-admin-accent/30 focus:bg-white transition-all shadow-inner"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-admin-dark/40 uppercase tracking-widest ml-1">Category Visual</label>
                <div
                  onClick={() => document.getElementById('category-upload').click()}
                  className="relative h-24 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-admin-accent/[0.02] hover:border-admin-accent/30 transition-all overflow-hidden"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-1 animate-pulse">
                      <FiUploadCloud className="text-admin-accent animate-bounce" size={20} />
                      <span className="text-[11px] font-medium text-admin-accent uppercase">Uploading...</span>
                    </div>
                  ) : form.image ? (
                    <div className="w-full h-full p-2">
                      <img src={form.image} alt="Preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <FiUploadCloud className="text-white" size={20} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <FiImage className="text-gray-300" size={20} />
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Select Visual Asset</span>
                    </>
                  )}
                  <input
                    id="category-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="w-full bg-admin-dark text-white py-3 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-dark/20 flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] group disabled:opacity-50 font-['Cormorant',_serif]"
                >
                  {isSubmitting ? 'Syncing...' : (isUploading ? 'Waiting for Upload...' : (editingCat ? 'Save Hierarchy' : 'Create Category'))}
                  <FiX size={10} className="rotate-45 group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategories;
