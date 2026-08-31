import React, { useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { Star } from 'lucide-react';
import SectionHeading from './SectionHeading';

const ReviewCard = ({ rev }) => (
  <article className="shrink-0 w-[248px] sm:w-[280px] bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-4 flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-1 mb-2">
        {[...Array(rev.rating)].map((_, i) => (
          <Star key={i} size={13} className="fill-[#C69A45] text-[#C69A45]" />
        ))}
      </div>
      <p className="font-body text-[11px] sm:text-xs text-[#2B1E1A] italic leading-relaxed">
        "{rev.comment}"
      </p>
    </div>

    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E8D4B5]/60">
      <div className="min-w-0 pr-2">
        <h4 className="font-body text-xs font-semibold text-[#6F241D] truncate">{rev.name}</h4>
        <span className="font-body text-[10px] text-gray-500">
          {rev.location} • Verified Buyer
        </span>
      </div>
      {rev.productImage && (
        <img
          src={rev.productImage}
          alt={rev.productName || ''}
          className="w-11 h-11 rounded-lg object-cover border border-[#E8D4B5] shrink-0"
        />
      )}
    </div>
  </article>
);

const Testimonials = () => {
  const { reviews } = useShop();
  const loop = useMemo(() => [...reviews, ...reviews], [reviews]);

  if (!reviews.length) return null;

  return (
    <section className="w-full bg-white py-6 border-t border-[#E8E2D9] overflow-hidden">
      <div className="site-container">
        <SectionHeading title="Words from our Patrons" />
      </div>

      <div className="testimonial-track site-container">
        <div className="testimonial-marquee">
          {loop.map((rev, i) => (
            <ReviewCard key={`${rev.id}-${i}`} rev={rev} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
