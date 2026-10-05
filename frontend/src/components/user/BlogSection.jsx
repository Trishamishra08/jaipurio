import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import JharokhaBand from './JharokhaBand';

const PAGE_SIZE = 12;

const BlogSection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);

  const [blogs, setBlogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    api
      .get('/blogs', { params: { page, limit: PAGE_SIZE } })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || {};
        setBlogs(data.blogs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch((err) => {
        if (cancelled) return;
        setBlogs([]);
        setLoadError(err?.parsedMessage || err?.message || 'Could not load the journal right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const goToPage = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next > 1) params.set('page', String(next));
    else params.delete('page');
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="heritage-page pb-16">
      <JharokhaBand />
      <div className="blog-wrap">
        <div className="journal-hero">
          <span className="eyebrow">The Journal</span>
          <h1>Craft stories & buying guides</h1>
          <p>How Jaipur’s marble, terracotta, jewellery, and textiles are made — and how to choose a piece you’ll keep.</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm text-[#70452F]">Loading the journal…</div>
        ) : loadError ? (
          <div className="text-center py-16 text-sm text-red-600">{loadError}</div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 text-sm text-[#70452F]">No journal posts published yet.</div>
        ) : (
          <>
            <div className="blog-grid">
              {blogs.map((blog) => (
                <Link key={blog._id || blog.id} to={`/blog/${blog._id || blog.id}`} className="blog-card">
                  <div className="blog-media"><img src={blog.image} alt={blog.title} loading="lazy" decoding="async" /></div>
                  <div className="blog-card-body">
                    <div className="blog-meta">{blog.category || 'Journal'} · {blog.readTime || '5 min'}</div>
                    <h4>{blog.title}</h4>
                    <p>{blog.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-1.5 mt-8">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 h-8 rounded-lg border border-[#E8E2D9] text-[#3F261B] text-[12px] font-semibold disabled:opacity-30"
                >
                  Prev
                </button>
                <span className="text-[12px] text-[#70452F] px-2">
                  Page {page} of {totalPages} · {total} posts
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 h-8 rounded-lg border border-[#E8E2D9] text-[#3F261B] text-[12px] font-semibold disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogSection;
