import React, { useState, useEffect } from 'react';
import { FiInstagram } from 'react-icons/fi';
import { motion } from 'framer-motion';

import api from '../../utils/api';


const instagramUrl = "https://www.instagram.com/sadabharatpvtltd/";

const InstagramGallery = () => {
  const [dynamicInsta, setDynamicInsta] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsta = async () => {
      try {
        const res = await api.get('/instagram');
        setDynamicInsta(res.data.data.posts);
      } catch (err) {
        console.error('Instagram fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsta();
  }, []);

  if (loading && dynamicInsta.length === 0) return null;

  return (
    <section className="py-6 border-t border-gray-100 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-4 group"
        >
          <FiInstagram size={24} className="mx-auto mb-1 text-brand-gold transition-transform group-hover:scale-110" />
          <h2 className="text-sm md:text-base font-serif font-black text-brand-dark uppercase tracking-widest group-hover:text-brand-gold transition-colors">Follow Our Journey</h2>
          <div className="w-10 h-0.5 bg-brand-gold mx-auto"></div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {dynamicInsta.map((item, index) => (
            <motion.a
              key={item._id}
              href={item.link || instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 0.98 }}
              className="relative aspect-square overflow-hidden group cursor-pointer block border border-gray-50"
            >
              <img
                src={item.image}
                alt="Instagram Post"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-brand-gold/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <FiInstagram className="text-white text-3xl" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramGallery;
