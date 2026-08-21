import React from 'react';
import { Link } from 'react-router-dom';
import { rajasthanRegions } from '../../data/products';
import { MapPin } from 'lucide-react';

const RajasthanRegions = () => {
  return (
    <section className="w-full bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#A94E2C]">🏰</span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#A94E2C]">Heritage Heritage Map</span>
            <span className="text-[#A94E2C]">🏰</span>
          </div>
          <h2 
            className="text-2xl sm:text-3xl font-black text-[#6F241D] mt-1"
          >
            Crafted Across Rajasthan
          </h2>
          <p className="text-xs sm:text-sm text-[#70452F] mt-1">
            Every corner of Rajasthan breathes a unique craft tradition. Explore mitti and terracotta specialties by region.
          </p>
        </div>

        {/* Regions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {rajasthanRegions.map((region) => (
            <Link
              key={region.id}
              to={`/shop?region=${encodeURIComponent(region.city)}`}
              className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-4 flex flex-col justify-between hover:border-[#A94E2C] hover:shadow-md transition-all duration-300 group text-center"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-[#FAF4EA] border border-[#A94E2C]/30 flex items-center justify-center mx-auto mb-2 text-xl group-hover:scale-110 transition-transform">
                  📍
                </div>
                <h3 
                  className="font-bold text-sm sm:text-base text-[#6F241D] group-hover:text-[#A94E2C]"
                >
                  {region.city}
                </h3>
                <p className="text-[11px] font-semibold text-[#A94E2C] mt-0.5 leading-tight">
                  {region.tagline}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#E8D4B5]/50">
                <span className="text-[10px] text-[#70452F] font-medium block">
                  {region.art}
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default RajasthanRegions;
