import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { journalPosts } from '../../data/journalPosts';
import JharokhaBand from './JharokhaBand';

const BlogSection = () => {
  const [blogs, setBlogs] = useState(journalPosts);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get('/blogs')
      .then((res) => {
        const rows = res.data?.data?.blogs;
        if (rows?.length) setBlogs(rows);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="heritage-page pb-16">
      <JharokhaBand />
      <div className="blog-wrap">
        <div className="journal-hero">
          <span className="eyebrow">The Journal</span>
          <h1>Craft stories & buying guides</h1>
          <p>How Jaipur’s marble, terracotta, jewellery, and textiles are made — and how to choose a piece you’ll keep.</p>
        </div>
        <div className="blog-grid">
          {blogs.map((blog) => (
            <Link key={blog._id || blog.id} to={`/blog/${blog._id || blog.id}`} className="blog-card">
              <div className="blog-media"><img src={blog.image || journalPosts[0].image} alt={blog.title} /></div>
              <div className="blog-card-body">
                <div className="blog-meta">{blog.category || 'Journal'} · {blog.readTime || '5 min'}</div>
                <h4>{blog.title}</h4>
                <p>{blog.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogSection;
