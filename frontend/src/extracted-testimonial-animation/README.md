# Circular Orbital Testimonial Scroll Animation

This package contains the fully extracted, modular, and self-contained **Circular Orbital Testimonial Animation** from the Talwart website.

---

## 📁 Package Contents

| File | Description |
| :--- | :--- |
| **`index.html`** | Standalone demo featuring live scroll scrub rotation, click selection, and auto-advance. |
| **`circular-testimonial.css`** | Clean, customizable CSS tokens (neon glow, fonts, grid background, blur mask). |
| **`circular-testimonial.js`** | Vanilla JavaScript component with GSAP ScrollTrigger and click interactions. |
| **`React-Component.jsx`** | Plug-and-play React / Next.js component. |
| **`assets/`** | 13 extracted circular avatar webp images. |
| **`testimonials-data.json`** | Clean JSON data with authors, quotes, and image paths. |

---

## 🚀 How It Works (The Mechanics)

### 1. Radial Coordinate Positioning
Avatars are dynamically placed along an orbit using polar coordinates:
$$\text{angle} = \text{startOffset} + \left(\frac{2\pi}{N}\right) \times i$$
$$x = \text{centerX} + \text{radius} \times \cos(\text{angle})$$
$$y = \text{centerY} + \text{radius} \times \sin(\text{angle})$$

### 2. Scroll-Triggered Orbital Scrubbing
As the user scrolls down the page, GSAP's `ScrollTrigger` scrubs the wheel's rotation from `+35°` to `-35°`:
```javascript
gsap.fromTo(
  ".orbital-wheel",
  { rotation: 35 },
  {
    rotation: -35,
    ease: "none",
    scrollTrigger: {
      trigger: ".orbital-testimonial-section",
      start: "top bottom",
      end: "bottom top",
      scrub: 1.2
    }
  }
);
```

### 3. Glowing Active Ring & Content Transitions
The active avatar gets a neon purple/lime glow box-shadow:
```css
.orbital-slide-item.active .orbital-avatar-box {
  border-color: #a855f7;
  box-shadow: 0 0 25px rgba(168, 85, 247, 0.7), 0 0 60px rgba(168, 85, 247, 0.4);
  transform: scale(1.15);
}
```

---

## 🛠️ Usage in Plain HTML / Vanilla JS

### 1. Include GSAP & Styles
```html
<link rel="stylesheet" href="circular-testimonial.css">

<!-- GSAP + ScrollTrigger (from CDN) -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>

<!-- Component Script -->
<script src="circular-testimonial.js"></script>
```

### 2. Initialize
```javascript
const carousel = new CircularTestimonialCarousel({
  container: '#testimonial-section',
  radius: 440,              // Orbit radius in pixels
  rotationRange: 70,        // Rotation scrub degrees on scroll
  autoplay: true,           // Auto rotate active testimonials
  autoplayInterval: 4500,   // Transition delay in ms
  enableScrollTrigger: true // Enable GSAP scroll scrub
});
```

---

## ⚛️ Usage in React / Next.js
Copy `React-Component.jsx` into your components folder and use it directly:
```jsx
import CircularTestimonial from './components/React-Component';

export default function Page() {
  return (
    <main>
      <CircularTestimonial autoplay={true} />
    </main>
  );
}
```

---

## 🎨 Customizing Options

You can adjust the CSS variables in `circular-testimonial.css` or pass custom props:
- `--orbit-accent-glow`: Color of the glowing ring and quote icon (default: `#a855f7`).
- `--orbit-accent-secondary`: Secondary badge dot color (default: `#d6f345`).
- `--orbit-diameter`: Outer diameter of the wheel (default: `950px`).
- `--orbit-avatar-size`: Width/height of each avatar (default: `88px`).
