import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { Star } from 'lucide-react';
import api from '../../utils/api';
import { useHomeSections } from '../../utils/useHomeSections';
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
          loading="lazy"
          decoding="async"
          className="w-11 h-11 rounded-lg object-cover border border-[#E8D4B5] shrink-0"
        />
      )}
    </div>
  </article>
);

// Live journal post — cover image, category, title and excerpt come from the blog API.
const BlogCard = ({ blog }) => (
  <Link
    to={`/blog/${blog._id || blog.id}`}
    className="shrink-0 w-[248px] sm:w-[280px] bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl overflow-hidden flex flex-col"
  >
    <div className="h-28 sm:h-32 bg-[#F7EFE0]">
      {blog.image && (
        <img src={blog.image} alt={blog.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
      )}
    </div>
    <div className="p-4 flex flex-col flex-1">
      <span className="font-body text-[10px] uppercase tracking-wide text-[#C69A45] mb-1">
        {blog.category || 'Journal'} • {blog.readTime || '5 min'}
      </span>
      <h4 className="font-body text-xs sm:text-[13px] font-semibold text-[#6F241D] leading-snug line-clamp-2">{blog.title}</h4>
      <p className="font-body text-[11px] text-[#2B1E1A] leading-relaxed mt-1 line-clamp-3">{blog.excerpt}</p>
    </div>
  </Link>
);

const Testimonials = () => {
  const { reviews } = useShop();
  const cfg = useHomeSections().sections.testimonials;
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    if (cfg.source === 'reviews') return undefined;
    let cancelled = false;
    api
      .get('/blogs', { params: { limit: cfg.limit || 8 } })
      .then((res) => {
        if (!cancelled) setBlogs(res.data?.data?.blogs || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Blogs when there are any published; the static reviews are the fallback.
  const items = cfg.source !== 'reviews' && blogs.length ? blogs : reviews;
  const loop = useMemo(() => [...items, ...items], [items]);

  if (!cfg.enabled || !items.length) return null;

  return (
    <section className="w-full bg-white py-6 border-t border-[#E8E2D9] overflow-hidden">
      <div className="site-container">
        <SectionHeading title={cfg.title} />
      </div>

      <div className="testimonial-track site-container">
        <div className="testimonial-marquee">
          {loop.map((item, i) =>
            items === blogs ? (
              <BlogCard key={`${item._id || item.id}-${i}`} blog={item} />
            ) : (
              <ReviewCard key={`${item.id}-${i}`} rev={item} />
            )
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
