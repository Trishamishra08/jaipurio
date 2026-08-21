import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

import blogFloating1 from '../../assets/images/cat_wellness.png';
import blogFloating2 from '../../assets/images/cat_skincare.png';
import blogFloating3 from '../../assets/images/cat_haircare.png';
import blogFloating4 from '../../assets/images/cat_essentialoils_new.png';

const floatingImages = [
  { src: blogFloating1, size: 'w-16 h-20 md:w-24 md:h-32', top: '10%', left: '15%', delay: 0 },
  { src: blogFloating2, size: 'w-14 h-18 md:w-20 md:h-28', top: '25%', left: '30%', delay: 1 },
  { src: blogFloating3, size: 'w-18 h-24 md:w-28 md:h-36', top: '10%', left: '65%', delay: 0.5 },
  { src: blogFloating4, size: 'w-16 h-20 md:w-24 md:h-32', top: '22%', left: '80%', delay: 1.5 },
];

const BlogSection = () => {
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get('category');

  const navigate = useNavigate();
  const [dynamicBlogs, setDynamicBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await api.get('/blogs');
        if (res.data?.data?.blogs?.length > 0) {
          setDynamicBlogs(res.data.data.blogs);
        } else {
          setDynamicBlogs([]);
        }
      } catch (err) {
        console.error('Failed to fetch blogs:', err);
        setDynamicBlogs([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const filteredBlogs = catParam
    ? dynamicBlogs.filter(b => b.category.toLowerCase() === catParam.toLowerCase())
    : dynamicBlogs;

  const displayedBlogs = showAll ? filteredBlogs : filteredBlogs.slice(0, 3);
  const isTipsPage = catParam?.toLowerCase() === 'tips';
  const floatingSizeClasses = "w-16 md:w-36 h-16 md:h-36 overflow-hidden bg-white p-1 md:p-2 shadow-xl border border-gray-100 flex items-center justify-center";

  return (
    <section className="pb-8 md:pb-16 bg-[#FEFAF6] overflow-hidden">
      {/* COMPACT JOURNAL HERO - EXACT TYPOGRAPHY MATCH */}
      <div className="relative w-full h-[250px] md:h-[350px] bg-brand-pink/20 overflow-hidden flex flex-col items-center justify-center mb-10 md:mb-16">
        <div className="absolute inset-0 bg-brand-pink/10 pointer-events-none"></div>
        
        <div className="absolute inset-0 z-10">
          {floatingImages.map((img, index) => (
            <motion.div
              key={index}
              className={`absolute ${img.size} rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border-4 border-white/30`}
              style={{ top: img.top, left: img.left }}
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 2, 0, -2, 0]
              }}
              transition={{ 
                duration: 6 + index % 2, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: img.delay 
              }}
            >
              <img src={img.src} alt="Journal" className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>

        <div className="relative z-20 text-center px-4 mt-8">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-dark uppercase tracking-[0.6em] text-[8px] md:text-[11px] block mb-2 md:mb-4"
          >
            SADA BHARAT AYURVEDIC
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-decorative font-black text-brand-dark drop-shadow-lg tracking-tighter italic mb-4"
            style={{ textShadow: '2px 2px 4px rgba(255, 255, 255, 0.5)' }}
          >
            {isTipsPage ? 'BEAUTY TIPS' : 'JOURNAL'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-brand-dark font-['Poppins'] tracking-[0.2em] text-[9px] md:text-[10px] uppercase font-semibold mt-4 md:mt-6"
          >
            Stories of natural wellness, Ayurvedic beauty, and holistic health.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8">

        <div className="text-center mt-8 md:mt-12 mb-12 md:mb-16">
          {!showAll && (
            <motion.button
              onClick={() => setShowAll(true)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="bg-brand-dark text-white hover:bg-[#054425] px-12 py-4 rounded-none text-[10px] md:text-[11px]  tracking-[0.5em] transition-all duration-300 shadow-xl border border-brand-dark hover:border-[#054425] uppercase"
            >
              VIEW ALL STORIES
            </motion.button>
          )}
          {showAll && (
            <motion.button
              onClick={() => setShowAll(false)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="bg-transparent text-brand-dark hover:text-[#054425] px-12 py-4 rounded-none text-[10px] md:text-[11px]  tracking-[0.5em] transition-all duration-300 "
            >
              SHOW LESS
            </motion.button>
          )}
        </div>

        {/* COMPACT BLOG CARDS GRID */}
        {showAll && (
          loading ? (
            <div className="py-20 text-center animate-pulse">
              <div className="w-10 h-10 border-4 border-brand-pink border-t-brand-gold rounded-full mx-auto mb-4 animate-spin"></div>
              <p className="text-[10px]  text-gray-400 uppercase tracking-widest tracking-[0.4em]">Retrieving Journal...</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              {filteredBlogs.map((blog, index) => (
                <motion.div
                  key={blog._id || blog.id}
                  onClick={() => navigate(`/blog/${blog._id || blog.id}`)}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col group cursor-pointer max-w-[240px] md:max-w-[260px] mx-auto w-full"
                >
                  <div className="relative overflow-hidden mb-3 aspect-[4/3] bg-gray-50 shadow-md border border-brand-pink/5">
                    <span className="absolute top-3 left-3 z-10 bg-brand-pink/90 text-brand-dark px-3 py-1 text-[7px] md:text-[8px]  tracking-widest uppercase shadow-sm">
                      {blog.category}
                    </span>
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                <div className="space-y-1.5 px-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 text-[8px] md:text-[9px]  tracking-widest uppercase">
                      <span>{new Date(blog.createdAt || Date.now()).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                      <span className="w-1 h-1 bg-brand-gold/20 rounded-full"></span>
                      <span>{blog.readTime || '5 min'}</span>
                    </div>

                    <h3 className="text-sm md:text-[15px] font-['Poppins']  text-[#5C2E3E] leading-snug group-hover:text-brand-gold transition-colors duration-300 uppercase tracking-tight">
                      {blog.title}
                    </h3>

                    <p className="text-gray-500 text-[10px] md:text-xs leading-relaxed font-['Poppins'] opacity-70 line-clamp-2 px-2 md:px-0">
                      {blog.excerpt}
                    </p>

                    <div className="pt-1.5">
                      <button className="inline-flex items-center gap-1.5 text-[8px] md:text-[9px]  tracking-[0.2em] uppercase text-brand-dark group-hover:text-brand-gold transition-all duration-300 border-b border-brand-gold/10 group-hover:border-brand-gold pb-1">
                        READ STORY
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
};

export default BlogSection;
