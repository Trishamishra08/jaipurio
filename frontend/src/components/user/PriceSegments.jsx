import React from 'react';
import { useShop } from '../../context/ShopContext';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const PriceSegments = () => {
    const { products, loading } = useShop();

    if (loading) return null;

    const segments = [
        {
            title: "Affordable & Budget",
            subtitle: "Everyday essentials (₹100 – ₹500)",
            filter: (p) => p.price <= 500,
            bgColor: "bg-brand-pink/5"
        },
        {
            title: "Mid-Range & Daily",
            subtitle: "Quality trusted brands (₹501 – ₹1000)",
            filter: (p) => p.price >= 501 && p.price < 1500,
            bgColor: "bg-white"
        },
        {
            title: "Premium & Luxury",
            subtitle: "Professional & High-end curation (₹1001+)",
            filter: (p) => p.price >= 1001,
            bgColor: "bg-[#5C2E3E]/5"
        }
    ];

    return (
        <section className="py-16 md:py-24 overflow-hidden">
            <div className="container mx-auto px-4 md:px-8">

                <div className="text-center mb-16">
                    <span className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[8px] md:text-[10px] mb-3 block">Curated tiers</span>
                    <h2 className="text-3xl md:text-5xl font-serif font-black text-[#5C2E3E] leading-tight mb-4">
                        Shop by <span className="text-brand-pink italic">Segment</span>
                    </h2>
                    <div className="w-16 h-1 bg-brand-pink/20 mx-auto rounded-full"></div>
                </div>

                <div className="space-y-12">
                    {segments.map((segment, idx) => {
                        const segmentProducts = products.filter(segment.filter).slice(0, 5);
                        if (segmentProducts.length === 0) return null;

                        return (
                            <div key={idx} className={`p-8 md:p-12 rounded-[2.5rem] ${segment.bgColor} border border-gray-50`}>
                                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#5C2E3E] mb-2">{segment.title}</h3>
                                        <p className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                            {segment.subtitle}
                                        </p>
                                    </div>
                                    <Link
                                        to="/shop"
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-pink hover:text-[#5C2E3E] transition-colors group"
                                    >
                                        Explore All <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                                    {segmentProducts.map(product => (
                                        <motion.div
                                            key={product._id}
                                            whileHover={{ y: -5 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <ProductCard product={product} />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default PriceSegments;
