import React from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { MapPin, Star, Award, Store } from 'lucide-react';

const FeaturedArtisans = () => {
  const { vendors } = useShop();

  return (
    <section className="w-full bg-[#FAF4EA] py-8 border-y border-[#E8D4B5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#A94E2C]">🏺</span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#A94E2C]">Direct From Workshops</span>
            </div>
            <h2 
              className="font-heading text-2xl sm:text-3xl font-bold text-[#6F241D] mt-1"
            >
              Meet the Makers
            </h2>
            <p className="text-xs sm:text-sm text-[#70452F] mt-0.5">
              Connecting you directly with master potters and handicraft families of Rajasthan.
            </p>
          </div>

          <Link
            to="/vendors"
            className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#A94E2C] hover:text-[#6F241D] transition-colors"
          >
            <span>Explore All Artisans</span>
            <span>→</span>
          </Link>
        </div>

        {/* Vendor Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor._id}
              className="bg-[#FCF8F2] rounded-2xl border border-[#E8D4B5] p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div>
                {/* Header with Avatar & Badge */}
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={vendor.avatar}
                    alt={vendor.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#A94E2C] shadow-xs"
                  />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A94E2C] bg-[#A94E2C]/10 px-2 py-0.5 rounded-full inline-block mb-1">
                      {vendor.badge}
                    </span>
                    <h3 
                      className="text-base font-bold text-[#2B1E1A] group-hover:text-[#A94E2C] transition-colors"
                    >
                      {vendor.name}
                    </h3>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-[#70452F] mb-2 font-medium">
                  <MapPin size={13} className="text-[#A94E2C]" />
                  <span>{vendor.location}</span>
                </div>

                {/* Specialty */}
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                  <strong className="text-[#6F241D]">Specialty:</strong> {vendor.specialty}
                </p>
              </div>

              {/* Stats & Action */}
              <div className="pt-3 border-t border-[#E8D4B5]/60 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-bold text-[#6F241D]">
                  <Star size={13} className="fill-[#C69A45] text-[#C69A45]" />
                  <span>{vendor.rating}</span>
                  <span className="text-gray-400 font-normal">({vendor.reviewsCount})</span>
                </div>

                <Link
                  to={`/store/${vendor._id}`}
                  className="text-xs font-bold bg-[#6F241D] hover:bg-[#873A24] text-white px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-1"
                >
                  <Store size={12} />
                  <span>Visit Store</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturedArtisans;
