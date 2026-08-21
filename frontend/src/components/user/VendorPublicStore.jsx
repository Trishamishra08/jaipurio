import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import ProductCard from './ProductCard';
import { MapPin, Star, Award, Heart, Check, Store } from 'lucide-react';

const VendorPublicStore = () => {
  const { id } = useParams();
  const { vendors, products } = useShop();
  const [isFollowing, setIsFollowing] = useState(false);

  const vendor = vendors.find(v => v._id === id) || vendors[0];
  const vendorProducts = products.filter(p => p.vendorId === vendor._id || p.vendor.includes(vendor.name));

  return (
    <div className="min-h-screen bg-[#F8F1E3] pb-12">
      
      {/* Artisan Store Cover Banner */}
      <div className="relative w-full h-48 sm:h-64 bg-[#3D1E16] overflow-hidden">
        <img 
          src={vendor.coverImage} 
          alt={vendor.name} 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2B1E1A] via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        
        {/* Profile Card Header */}
        <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <img 
              src={vendor.avatar} 
              alt={vendor.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-lg -mt-12 sm:-mt-16 bg-[#FAF4EA]"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#A94E2C]/15 text-[#A94E2C] px-3 py-0.5 rounded-full text-xs font-bold mb-1">
                <Award size={12} />
                <span>{vendor.badge}</span>
              </div>
              <h1 
                className="text-2xl sm:text-3xl font-black text-[#6F241D]"
              >
                {vendor.name}
              </h1>
              <p className="text-xs sm:text-sm text-[#70452F] flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                <MapPin size={14} className="text-[#A94E2C]" />
                <span>{vendor.location}</span>
                <span>•</span>
                <span>Experience: {vendor.experience}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center bg-[#FAF4EA] border border-[#E8D4B5] px-4 py-2 rounded-2xl">
              <div className="flex items-center justify-center gap-1 text-sm font-bold text-[#6F241D]">
                <Star size={14} className="fill-[#C69A45] text-[#C69A45]" />
                <span>{vendor.rating}</span>
              </div>
              <span className="text-[10px] text-gray-500">{vendor.reviewsCount} Reviews</span>
            </div>

            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                isFollowing 
                  ? 'bg-[#354B35] text-white' 
                  : 'bg-[#6F241D] hover:bg-[#873A24] text-white'
              }`}
            >
              {isFollowing ? <Check size={14} /> : <Heart size={14} />}
              <span>{isFollowing ? 'Following Artisan' : 'Follow Store'}</span>
            </button>
          </div>

        </div>

        {/* About Artisan Story */}
        <div className="mt-8 bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-6 sm:p-8">
          <h2 className="text-lg font-bold font-serif text-[#6F241D] mb-2">Artisan's Heritage & Craft Specialty</h2>
          <p className="text-xs sm:text-sm text-[#70452F] leading-relaxed mb-4">
            {vendor.about}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-[#FAF4EA] border border-[#E8D4B5] px-3 py-1 rounded-full text-[#6F241D] font-medium">
              🌿 Natural Clay
            </span>
            <span className="bg-[#FAF4EA] border border-[#E8D4B5] px-3 py-1 rounded-full text-[#6F241D] font-medium">
              🏺 Manual Wheel Thrown
            </span>
            <span className="bg-[#FAF4EA] border border-[#E8D4B5] px-3 py-1 rounded-full text-[#6F241D] font-medium">
              🔥 Wood Kiln Baked
            </span>
          </div>
        </div>

        {/* Artisan's Products Grid */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="text-xl sm:text-2xl font-black text-[#6F241D]"
            >
              Artisan's Creations ({vendorProducts.length || products.length})
            </h2>
            <span className="text-xs text-[#70452F]">100% Genuine Handcrafted Pieces</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(vendorProducts.length > 0 ? vendorProducts : products).map(prod => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorPublicStore;
