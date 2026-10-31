import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
    to={`/blog/${blog.slug || blog._id || blog.id}`}
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

// Real, admin-approved customer testimonials only (Admin → Testimonials) —
// never sample reviews. With source "blogs" the strip shows blog posts and is
// headed as a blog strip, not as customer reviews.
const toReviewCard = (t) => ({
  id: t._id,
  name: t.name,
  rating: Math.max(1, Math.min(5, Math.round(Number(t.rating) || 5))),
  comment: t.content,
  location: t.role || 'Customer',
  productImage: t.image || '',
});

const Testimonials = () => {
  const cfg = useHomeSections().sections.testimonials;
  const wantsBlogs = cfg.source !== 'reviews';
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const limit = cfg.limit || 8;
    const req = wantsBlogs
      ? api.get('/blogs', { params: { limit } }).then((res) => res.data?.data?.blogs || [])
      : api.get('/testimonials').then((res) => (res.data?.data?.testimonials || []).slice(0, limit).map(toReviewCard));
    req.then((rows) => !cancelled && setItems(rows)).catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [wantsBlogs, cfg.limit]);

  // The marquee needs a second copy to loop seamlessly; it is hidden from
  // screen readers and search engines' accessibility tree so content isn't repeated.
  const loop = useMemo(() => items.map((item, i) => ({ item, i, copy: false })).concat(items.map((item, i) => ({ item, i, copy: true }))), [items]);
  const heading = wantsBlogs && /patron|review|testimonial|customer/i.test(cfg.title || '') ? 'From the Jaipurio Journal' : cfg.title;

  if (!cfg.enabled || !items.length) return null;

  return (
    <section className="w-full bg-white py-6 border-t border-[#E8E2D9] overflow-hidden">
      <div className="site-container">
        <SectionHeading title={heading} />
      </div>

      <div className="testimonial-track site-container">
        <div className="testimonial-marquee">
          {loop.map(({ item, i, copy }) => (
            <div key={`${item._id || item.id || i}-${copy ? 'b' : 'a'}`} aria-hidden={copy || undefined} className="contents">
              {wantsBlogs ? <BlogCard blog={item} /> : <ReviewCard rev={item} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
