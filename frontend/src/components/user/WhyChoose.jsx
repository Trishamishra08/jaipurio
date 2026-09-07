import React from 'react';
import { FiCheckCircle, FiShield, FiHeart, FiBox } from 'react-icons/fi';
import { RiLeafLine } from 'react-icons/ri';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <RiLeafLine className="text-3xl text-brand-gold" />,
    title: '100% Pure Mitti',
    description: 'Natural terracotta from Rajasthan kilns.'
  },
  {
    icon: <FiShield className="text-3xl text-brand-gold" />,
    title: 'Fragile-Care Shipping',
    description: 'Safe packaging for clay crafts across India.'
  },
  {
    icon: <FiHeart className="text-3xl text-brand-gold" />,
    title: 'Artisan Made',
    description: 'Handcrafted by Jaipur pottery families.'
  },
  {
    icon: <FiCheckCircle className="text-3xl text-brand-gold" />,
    title: 'Heritage Designs',
    description: 'Traditional mandana motifs & folk forms.'
  },
  {
    icon: <FiBox className="text-3xl text-brand-gold" />,
    title: 'Eco Friendly Craft',
    description: 'Biodegradable clay — no plastic pots.'
  },
];

const WhyChoose = () => {
  return (
    <section className="py-10 md:py-16 bg-white border-y border-gray-100 italic">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl md:text-2xl font-serif font-bold mb-1 text-brand-dark uppercase tracking-wide">Why Choose Jaipurio?</h2>
          <div className="w-16 h-1 bg-brand-gold mx-auto"></div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-4 rounded-xl hover:bg-brand-pink/10 transition-colors duration-300"
            >
              <div className="mb-3 flex justify-center scale-90">{feature.icon}</div>
              <h3 className="font-bold text-brand-dark text-xs sm:text-sm mb-1">{feature.title}</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
