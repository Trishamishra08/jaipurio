import React from 'react';
import { useShop } from '../../context/ShopContext';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const { reviews } = useShop();

  return (
    <section className="w-full bg-white py-6 border-t border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#A94E2C]">🌿</span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#A94E2C]">Customer Love</span>
            <span className="text-[#A94E2C]">🌿</span>
          </div>
          <h2 
            className="text-2xl sm:text-3xl font-black text-[#6F241D] mt-1"
          >
            Words from our Patrons
          </h2>
        </div>

        {/* Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} size={14} className="fill-[#C69A45] text-[#C69A45]" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-[#2B1E1A] italic mb-4 leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              {/* Customer Info & Product Thumbnail */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E8D4B5]/60">
                <div>
                  <h4 className="text-xs font-bold text-[#6F241D]">{rev.name}</h4>
                  <span className="text-[10px] text-gray-500">{rev.location} • Verified Buyer</span>
                </div>

                {rev.productImage && (
                  <img
                    src={rev.productImage}
                    alt={rev.productName}
                    className="w-10 h-10 rounded-lg object-cover border border-[#E8D4B5]"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
