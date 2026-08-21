import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoArrowBack } from 'react-icons/io5';

import api from '../../utils/api';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await api.get(`/blogs/${id}`);
        if (res.data?.success && res.data?.data?.blog) {
          setBlog(res.data.data.blog);
        } else {
          navigate('/blog');
        }
      } catch (err) {
        console.error('Failed to fetch blog detail:', err);
        navigate('/blog');
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FEFAF6] py-32 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 border-4 border-brand-pink border-t-brand-gold rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest tracking-[0.4em]">Loading Story...</p>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="min-h-screen bg-[#FEFAF6] pt-6 pb-12">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-gray-500 hover:text-brand-gold transition-colors mb-4 font-['Poppins']"
        >
          <IoArrowBack size={16} /> Back to Journal
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white shadow-lg overflow-hidden rounded-2xl flex flex-col md:flex-row h-auto md:h-[70vh] max-h-[600px]"
        >
          <div className="w-full md:w-1/2 h-56 md:h-full overflow-hidden relative">
            <div className="absolute top-6 left-6 z-10 bg-brand-pink/90 text-brand-dark px-4 py-1.5 text-[10px] tracking-widest uppercase shadow-md rounded-full font-['Poppins'] font-medium">
              {blog.category}
            </div>
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center overflow-y-auto">
            <div className="flex items-center gap-3 text-brand-pink text-[9px] md:text-[11px] tracking-widest uppercase mb-4 font-['Poppins']">
              <span className="text-brand-dark font-medium">{blog.date}</span>
              <span className="w-1.5 h-1.5 bg-brand-gold/40 rounded-full"></span>
              <span className="text-gray-400">Reading Time: {blog.readTime}</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-decorative text-brand-dark leading-tight mb-4 tracking-tight">
              {blog.title}
            </h1>

            <div className="w-16 h-[2px] bg-brand-gold/30 mb-6"></div>

            <p className="text-gray-600 text-sm md:text-base leading-relaxed font-['Poppins'] mb-6 italic border-l-4 border-brand-pink/30 pl-5">
              "{blog.excerpt}"
            </p>

            <div className="text-gray-700 text-xs md:text-sm leading-loose font-['Poppins'] space-y-4">
              {blog.content}
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogDetail;
