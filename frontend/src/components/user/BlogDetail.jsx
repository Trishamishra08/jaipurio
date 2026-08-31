import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { useShop } from '../../context/ShopContext';
import { journalPosts } from '../../data/journalPosts';
import { getWhatsAppHref } from '../../utils/whatsapp';
import JharokhaBand from './JharokhaBand';

const GUIDE = journalPosts[0];

const BlogDetail = () => {
  const { id } = useParams();
  const { products } = useShop();
  const seed = journalPosts.find((p) => p._id === id) || GUIDE;
  const [blog, setBlog] = useState(seed);
  const [openFaq, setOpenFaq] = useState(0);
  const [readPct, setReadPct] = useState(0);
  const related = products.slice(0, 4);
  const morePosts = journalPosts.filter((p) => p._id !== seed._id).slice(0, 3);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fallback = journalPosts.find((p) => p._id === id) || GUIDE;
    setBlog(fallback);
    api.get(`/blogs/${id}`)
      .then((res) => {
        const row = res.data?.data?.blog;
        if (row) setBlog({ ...fallback, ...row });
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setReadPct(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const title = blog?.title || GUIDE.title;
  const excerpt = blog?.excerpt || GUIDE.excerpt;
  const image = blog?.image || GUIDE.image;
  const category = blog?.category || GUIDE.category;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent(`${title} ${shareUrl}`);
  const hasCmsBody = blog?.content && String(blog.content).length > 80;

  return (
    <div className="heritage-page pb-16">
      <JharokhaBand />
      <div className="blog-wrap">
        <div className="breadcrumb" style={{ padding: '16px 0 20px' }}>
          <Link to="/home">Home</Link><span>/</span>
          <Link to="/blog">Blog</Link><span>/</span>
          {title}
        </div>
        <div className="art-tags">
          <Link to="/shop" className="art-tag">{category}</Link>
          <Link to="/blog" className="art-tag">Buying Guide</Link>
          <Link to="/shop" className="art-tag">Jaipur crafts</Link>
          <Link to="/shop" className="art-tag">Home Decor</Link>
        </div>
        <h1 className="art-h1">{title}</h1>
        <p className="art-intro">{excerpt}</p>
        <div className="art-byline">
          <div className="art-author">
            <div className="art-avatar">JE</div>
            <div>
              <div className="art-author-name">{blog.author || GUIDE.author}</div>
              <div className="art-author-sub">{blog.date || GUIDE.date} · {blog.readTime || '8 min read'}</div>
            </div>
          </div>
          <div className="art-share">
            <span>Share:</span>
            <a href={`https://wa.me/?text=${shareText}`} aria-label="Share on WhatsApp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.5 8.5 0 01-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1121 11.5z" /></svg>
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} aria-label="Share on Facebook" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 8h3V4h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V9a1 1 0 011-1z" /></svg>
            </a>
            <button type="button" aria-label="Copy link" onClick={() => navigator.clipboard?.writeText(shareUrl)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" /></svg>
            </button>
          </div>
        </div>
        <div className="art-hero-img"><img src={image} alt={title} /></div>

        <div className="article-layout">
          <div>
            <div className="quick-answer">
              <span className="eyebrow">Quick Answer</span>
              <h2>What should you look for before you buy?</h2>
              <p>Choose a named artisan house, check weight and finish, and size the piece to the room — not only the budget.</p>
              <ul>
                <li>Named workshop is better than a generic “handmade” label</li>
                <li>Genuine marble or terracotta feels heavier than resin</li>
                <li>Natural variation is expected, not a defect</li>
                <li>Match size to the shelf or floor first</li>
              </ul>
            </div>
            <div className="takeaways">
              <h3>Key Takeaways</h3>
              <ul>
                <li>Ask for origin and artisan house</li>
                <li>Match size to the shelf or mandir</li>
                <li>Avoid acidic cleaners on stone</li>
                <li>Weight is a reliable genuineness check</li>
                <li>Natural veining variation is normal</li>
                <li>Keep a 7-day window for transit damage</li>
              </ul>
            </div>
            <div className="toc-box">
              <h3>In this guide</h3>
              <ol>
                <li><a href="#quality">Material quality</a></li>
                <li><a href="#size">Choosing size</a></li>
                <li><a href="#placement">Where to place it</a></li>
                <li><a href="#genuine">Handmade vs mass-produced</a></li>
                <li><a href="#care">Care</a></li>
              </ol>
            </div>
            <div className="art-body">
              {hasCmsBody ? (
                <div dangerouslySetInnerHTML={{ __html: String(blog.content).replace(/\n/g, '<br/>') }} />
              ) : (
                <>
                  <h2 id="quality">Material quality</h2>
                  <p>Not every piece sold as handmade is made the same way. Ask whether it is single-block stone, kiln-fired clay, or a composite. Weight, coolness to the touch, and irregular veining or brushwork are useful checks.</p>
                  <p>Genuine material develops a patina and holds its finish. Composite and resin tend to yellow, chip at the edges, and lose shine — especially with oil, ghee, or incense in daily use.</p>
                  <h2 id="size">Choosing the right size</h2>
                  <p>Measure the shelf or floor first, then pick the size. A common mistake is under-sizing a large room so even a well-made piece looks like an afterthought.</p>
                  <table>
                    <thead><tr><th>Setting</th><th>Typical size</th><th>Weight</th></tr></thead>
                    <tbody>
                      <tr><td>Home shelf / mandir</td><td>Small to 12 inch</td><td>~6.5 kg</td></tr>
                      <tr><td>Entry or living console</td><td>18 inch</td><td>~14 kg</td></tr>
                      <tr><td>Statement foyer</td><td>24 inch and above</td><td>~26 kg</td></tr>
                    </tbody>
                  </table>
                  <h2 id="placement">Where to place it</h2>
                  <p>Vastu tradition often recommends a Ganesha facing the main entrance, or the northeast of a room, facing inward rather than toward an exit. Treat this as a guideline and adapt it to the actual layout of the home.</p>
                  <h2 id="genuine">Handmade vs mass-produced</h2>
                  <ul>
                    <li><strong>Weight.</strong> Genuine stone or terracotta is heavier than resin of the same size.</li>
                    <li><strong>Veining / brushwork.</strong> Real material shows irregular detail. Perfectly uniform white with no variation is often composite.</li>
                    <li><strong>Touch.</strong> Marble stays cool; resin warms quickly.</li>
                    <li><strong>Named house.</strong> A seller who can name the workshop is a better sign than “handmade” alone.</li>
                  </ul>
                  <h2 id="care">Care</h2>
                  <p>Dust with a soft cloth. Keep acids away from marble. Terracotta cooking ware should be seasoned as the artisan recommends.</p>
                </>
              )}
            </div>
            <div className="mid-cta">
              <div>
                <span className="eyebrow" style={{ color: '#D8B978' }}>Apply this next</span>
                <h3>Shop pieces from this guide</h3>
                <p>Handmade Jaipur crafts with the same checks described above.</p>
              </div>
              <Link to="/shop" className="btn-mid">Shop the bazaar</Link>
            </div>
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 18 }}>Frequently asked questions</h2>
              {[
                ['How do I know it is handmade?', 'Ask for the workshop name, look at weight and irregular detail, and avoid perfectly identical “stone” that feels light.'],
                ['Do you ship outside Jaipur?', 'Yes. Dispatch is typically 3–5 days; delivery depends on destination.'],
                ['What if it arrives damaged?', 'Use the 7-day window for manufacturing or transit issues and share photos with support.'],
                ['Can I get a custom size?', 'Message us on WhatsApp with your space and we will suggest a commission or a stock size that fits.'],
              ].map(([q, a], i) => (
                <div key={q} className={`art-faq-item ${openFaq === i ? 'open' : ''}`}>
                  <button type="button" className="art-faq-head" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    {q} <span>+</span>
                  </button>
                  <div className="art-faq-panel"><div className="art-faq-panel-inner">{a}</div></div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 36 }}>
              <h3 style={{ fontSize: 13, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brass)', marginBottom: 12 }}>Related keywords</h3>
              <div className="kw-cloud">
                {['jaipur crafts', 'makrana marble', 'terracotta matka', 'vastu placement', 'handmade vs resin'].map((kw) => (
                  <span key={kw} className="kw-chip">{kw}</span>
                ))}
              </div>
            </div>
          </div>
          <aside className="art-sidebar">
            <div className="sb-card">
              <h4>Reading Progress</h4>
              <div className="sb-progress"><div className="sb-progress-fill" style={{ width: `${readPct}%` }} /></div>
              <div className="sb-note">{readPct}% read</div>
            </div>
            <div className="sb-card">
              <h4>Shop this guide</h4>
              {related.slice(0, 2).map((p) => (
                <Link key={p._id} to={`/product/${p._id}`} className="sb-product">
                  <img src={p.image} alt="" />
                  <div>
                    <div className="sb-product-name">{p.name}</div>
                    <div className="sb-product-price">₹{Number(p.price).toLocaleString('en-IN')}</div>
                  </div>
                </Link>
              ))}
              <Link to="/shop" className="sb-cta-btn">View products</Link>
            </div>
            <div className="sb-card">
              <h4>Need help choosing?</h4>
              <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 12 }}>Message us with your space and budget.</p>
              <a href={getWhatsAppHref(`Hi, I need help choosing after reading: ${title}`)} className="sb-cta-btn" style={{ background: '#25D366' }}>Chat on WhatsApp</a>
            </div>
          </aside>
        </div>
      </div>

      <section className="blog-section" style={{ background: 'var(--marble-deep)' }}>
        <div className="blog-wrap">
          <div className="blog-section-head"><span className="eyebrow">Keep exploring</span><h2>Browse related categories</h2></div>
          <div className="cat-suggest-grid">
            {[['Marble & idols', '/shop'], ['Home & living', '/shop'], ['Jewellery', '/shop'], ['Terracotta', '/shop']].map(([label, to]) => (
              <Link key={label} to={to} className="cat-suggest-card"><strong>{label}</strong><span>Shop the collection</span></Link>
            ))}
          </div>
        </div>
      </section>

      <section className="blog-section">
        <div className="blog-wrap">
          <div className="blog-section-head"><span className="eyebrow">From this guide</span><h2 style={{ fontSize: 22 }}>Products mentioned</h2></div>
          <div className="rel-prod-grid">
            {related.map((p) => (
              <Link key={p._id} to={`/product/${p._id}`} className="rel-prod-card">
                <div className="rel-prod-media"><img src={p.image} alt={p.name} /></div>
                <div className="rel-prod-body"><h5>{p.name}</h5><span className="price">₹{Number(p.price).toLocaleString('en-IN')}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="blog-section" style={{ background: 'var(--marble-deep)' }}>
        <div className="blog-wrap">
          <div className="blog-newsletter">
            <h3>More guides like this, monthly</h3>
            <p>Buying guides and artisan stories — straight to your inbox.</p>
            <form className="bn-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="you@email.com" />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      <section className="blog-section">
        <div className="blog-wrap">
          <div className="blog-section-head"><span className="eyebrow">Recommended reads</span><h2>More from the journal</h2></div>
          <div className="rel-art-grid">
            {morePosts.map((post) => (
              <Link key={post._id} to={`/blog/${post._id}`} className="article-card">
                <div className="article-media"><img src={post.image} alt="" /></div>
                <div className="article-body">
                  <div className="article-meta">{post.category}</div>
                  <h4>{post.title}</h4>
                  <p>{post.excerpt}</p>
                  <span className="article-read">Read more →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogDetail;
