import React, { useState, useEffect, useRef } from 'react';

/**
 * CircularTestimonialCarousel Component for React / Next.js
 * 
 * Props:
 * - data: Array of { id, author, comment, image }
 * - radius: number (default: 420)
 * - autoplay: boolean (default: true)
 * - autoplayInterval: number (default: 4500)
 */

export default function CircularTestimonial({
  data = [
    {
      id: 1,
      author: "1. Aisha Verma — Founder, LuxeAura",
      comment: "Talwart transformed our brand identity beyond expectations. Their attention to detail and creativity helped us stand out in a crowded market. Truly exceptional work.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: 2,
      author: "2. Rohan Mehta — CEO, Digitronix Solutions",
      comment: "The team delivered our website with stunning design and flawless functionality. The entire process felt smooth, collaborative, and incredibly professional.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: 3,
      author: "3. Sneha Kapoor — Marketing Head, Bloom & Co.",
      comment: "The digital strategy crafted by Talwart delivered real growth. Their campaigns improved our engagement and conversions faster than expected.",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: 4,
      author: "4. Daniel Rodrigues — Product Manager, NovaTech",
      comment: "The UI/UX design exceeded our expectations. Talwart brought clarity, elegance, and usability to our platform in a way that transformed the entire user journey.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: 5,
      author: "5. Meera Shah — Creative Director, Aristo Living",
      comment: "Talwart doesn’t just design—they understand brand storytelling at its core. Our brand now feels cohesive, premium, and truly connected to our audience.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
    }
  ],
  radius = 420,
  autoplay = true,
  autoplayInterval = 4500,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef(null);

  // Calculate slide positions along the circle
  const total = data.length;
  const angleStep = (2 * Math.PI) / total;
  const startAngleOffset = -Math.PI / 2;

  // Autoplay timer
  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, autoplayInterval);
    return () => clearInterval(timer);
  }, [autoplay, autoplayInterval, total]);

  // Optional: Scroll-based scrub rotation
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far container is through viewport (-1 to 1)
      const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
      const clampedProgress = Math.max(0, Math.min(1, progress));
      // Rotate from +35deg to -35deg
      const deg = 35 - clampedProgress * 70;
      setRotation(deg);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeItem = data[activeIndex] || data[0];

  return (
    <section 
      ref={containerRef}
      style={{
        position: 'relative',
        backgroundColor: '#07070a',
        color: '#ffffff',
        minHeight: '100vh',
        overflow: 'hidden',
        padding: '80px 20px 120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {/* Ambient Grid Background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.8) 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.8) 0%, transparent 80%)',
          pointerEvents: 'none'
        }} 
      />

      {/* Center Glow */}
      <div 
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }} 
      />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '680px', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#9ca3af',
          marginBottom: '16px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d6f345', boxShadow: '0 0 10px #d6f345' }} />
          <span>{'{06}'} Testimonial</span>
        </div>
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 700, margin: '0 0 16px', background: 'linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Real Feedback. Real Results.
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
          Authentic client experiences that reflect the impact of our work. Every review is a testament to the quality, precision, and results we deliver.
        </p>
      </div>

      {/* Stage */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '1100px', height: '620px', margin: '0 auto', zIndex: 1 }}>
        
        {/* Rotating Wheel */}
        <div style={{
          position: 'absolute',
          width: '950px',
          height: '950px',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          transition: 'transform 0.1s ease-out'
        }}>
          {data.map((item, index) => {
            const angle = startAngleOffset + index * angleStep;
            const x = 475 + radius * Math.cos(angle);
            const y = 475 + radius * Math.sin(angle);
            const isActive = index === activeIndex;

            return (
              <button
                key={item.id || index}
                onClick={() => setActiveIndex(index)}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  transform: `translate(-50%, -50%) rotate(${-rotation}deg) scale(${isActive ? 1.15 : 1})`,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              >
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#121216',
                  border: isActive ? '6px solid #a855f7' : '6px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: isActive ? '0 0 25px rgba(168, 85, 247, 0.7), 0 0 60px rgba(168, 85, 247, 0.4)' : 'none',
                  transition: 'all 0.4s ease'
                }}>
                  <img src={item.image} alt={item.author} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Center Testimonial Card */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '480px',
          textAlign: 'center',
          zIndex: 10
        }}>
          {/* Quote Icon */}
          <div style={{ width: '52px', height: '52px', margin: '0 auto 20px', color: '#a855f7' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
            </svg>
          </div>

          <p style={{
            fontSize: 'clamp(17px, 2.2vw, 21px)',
            fontWeight: 500,
            lineHeight: 1.6,
            color: '#f3f4f6',
            margin: '0 0 24px',
            minHeight: '80px',
            transition: 'opacity 0.3s ease'
          }}>
            “{activeItem.comment}”
          </p>

          <div style={{
            width: '80%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 20%, rgba(255,255,255,0.25) 80%, transparent 100%)',
            margin: '0 auto 20px'
          }} />

          {/* Rating Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '12px', color: '#fbbf24' }}>
            {'★'.repeat(5)}
          </div>

          <p style={{ fontSize: '15px', fontWeight: 600, color: '#e5e7eb', margin: 0 }}>
            {activeItem.author}
          </p>
        </div>

      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px', zIndex: 10 }}>
        <button
          onClick={() => setActiveIndex((prev) => (prev - 1 + total) % total)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ‹
        </button>
        <button
          onClick={() => setActiveIndex((prev) => (prev + 1) % total)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ›
        </button>
      </div>

      {/* Bottom Blur Mask */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '120px',
        pointerEvents: 'none',
        zIndex: 5,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'linear-gradient(to bottom, transparent, #07070a 90%)',
        maskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 100%)'
      }} />
    </section>
  );
}
