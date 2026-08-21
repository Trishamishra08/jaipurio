/**
 * CircularTestimonialCarousel
 * Extracted & Enhanced from Talwart Digital Agency
 * 
 * Features:
 * - Mathematical radial positioning along an elliptical/circular orbit
 * - GSAP ScrollTrigger scrubbed rotation on page scroll
 * - Clickable avatar selection with smooth orbital rotation & glow transition
 * - Optional auto-rotation / interval switching
 * - Vanilla JS with zero build-step requirement
 */

class CircularTestimonialCarousel {
  constructor(options = {}) {
    this.container = typeof options.container === 'string' 
      ? document.querySelector(options.container) 
      : (options.container || document.querySelector('.orbital-testimonial-section'));

    if (!this.container) {
      console.warn('CircularTestimonialCarousel: container element not found.');
      return;
    }

    this.options = Object.assign({
      radius: 440,              // Orbit radius in pixels (auto-scales on mobile)
      rotationRange: 80,         // Total degrees to rotate during scroll (-40deg to +40deg)
      startAngleOffset: -Math.PI / 2, // Starting angle for index 0 (top of circle)
      autoplay: true,           // Auto advance active testimonial
      autoplayInterval: 4500,   // Delay between auto advances (ms)
      enableScrollTrigger: true // Enable GSAP ScrollTrigger scrub animation
    }, options);

    this.wheel = this.container.querySelector('.orbital-wheel');
    this.slides = Array.from(this.container.querySelectorAll('.orbital-slide-item'));
    this.centerCard = this.container.querySelector('.orbital-center-card');
    this.commentEl = this.container.querySelector('.orbital-comment');
    this.authorEl = this.container.querySelector('.orbital-author');
    this.prevBtn = this.container.querySelector('.orbital-prev-btn');
    this.nextBtn = this.container.querySelector('.orbital-next-btn');

    this.activeIndex = 0;
    this.total = this.slides.length;
    this.autoplayTimer = null;
    this.currentRotation = 0;

    this.init();
  }

  init() {
    if (this.total === 0) return;

    this.positionSlides();
    this.bindEvents();
    this.setActive(0, false);

    if (this.options.enableScrollTrigger && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      this.initScrollTrigger();
    }

    if (this.options.autoplay) {
      this.startAutoplay();
    }
  }

  // Calculate coordinates for each avatar around the center of the wheel
  positionSlides() {
    if (!this.wheel) return;

    const rect = this.wheel.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Scale radius dynamically on smaller screens
    let effectiveRadius = this.options.radius;
    if (window.innerWidth <= 640) {
      effectiveRadius = rect.width * 0.42;
    } else if (window.innerWidth <= 991) {
      effectiveRadius = rect.width * 0.44;
    }

    const angleStep = (2 * Math.PI) / this.total;

    this.slides.forEach((slide, index) => {
      const angle = this.options.startAngleOffset + (index * angleStep);
      const x = centerX + effectiveRadius * Math.cos(angle);
      const y = centerY + effectiveRadius * Math.sin(angle);

      slide.style.left = `${x}px`;
      slide.style.top = `${y}px`;
      slide.dataset.angle = angle;
    });
  }

  bindEvents() {
    // Click on individual avatar
    this.slides.forEach((slide, index) => {
      slide.addEventListener('click', () => {
        this.setActive(index, true);
        this.resetAutoplay();
      });
    });

    // Navigation buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.prev();
        this.resetAutoplay();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.next();
        this.resetAutoplay();
      });
    }

    // Pause autoplay on mouse hover over container
    this.container.addEventListener('mouseenter', () => this.stopAutoplay());
    this.container.addEventListener('mouseleave', () => {
      if (this.options.autoplay) this.startAutoplay();
    });

    // Reposition on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.positionSlides(), 150);
    });
  }

  // Switch the active testimonial
  setActive(index, animate = true) {
    this.activeIndex = (index + this.total) % this.total;
    const activeSlide = this.slides[this.activeIndex];
    if (!activeSlide) return;

    // Update active highlight classes
    this.slides.forEach((s, idx) => {
      s.classList.toggle('active', idx === this.activeIndex);
    });

    // Extract comment and author data
    const comment = activeSlide.dataset.comment;
    const author = activeSlide.dataset.author;

    if (this.centerCard && animate) {
      this.centerCard.classList.add('animating');
      setTimeout(() => {
        if (this.commentEl && comment) this.commentEl.textContent = `“${comment}”`;
        if (this.authorEl && author) this.authorEl.textContent = author;
        this.centerCard.classList.remove('animating');
      }, 250);
    } else {
      if (this.commentEl && comment) this.commentEl.textContent = `“${comment}”`;
      if (this.authorEl && author) this.authorEl.textContent = author;
    }
  }

  next() {
    this.setActive(this.activeIndex + 1);
  }

  prev() {
    this.setActive(this.activeIndex - 1);
  }

  startAutoplay() {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      this.next();
    }, this.options.autoplayInterval);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  resetAutoplay() {
    if (this.options.autoplay) {
      this.stopAutoplay();
      this.startAutoplay();
    }
  }

  // GSAP ScrollTrigger Integration
  initScrollTrigger() {
    gsap.registerPlugin(ScrollTrigger);

    const halfRange = this.options.rotationRange / 2;

    gsap.fromTo(
      this.wheel,
      {
        rotation: halfRange,
      },
      {
        rotation: -halfRange,
        ease: 'none',
        scrollTrigger: {
          trigger: this.container,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
          markers: false
        }
      }
    );
  }
}

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CircularTestimonialCarousel;
} else {
  window.CircularTestimonialCarousel = CircularTestimonialCarousel;
}
