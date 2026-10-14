import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';

const MIN = 1;
const MAX = 4;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Full-screen image viewer with zoom: pinch or wheel to zoom, double-tap /
 * double-click to toggle 2.5×, drag to pan while zoomed, swipe or arrows to
 * change photo, Esc or ✕ to close.
 */
const ImageLightbox = ({ images, index, onIndexChange, onClose, alt = '' }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef(0);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (dir) => {
      if (images.length < 2) return;
      reset();
      onIndexChange((index + dir + images.length) % images.length);
    },
    [images.length, index, onIndexChange, reset]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [go, onClose]);

  const zoomTo = (next) => {
    const s = clamp(next, MIN, MAX);
    setScale(s);
    if (s === 1) setOffset({ x: 0, y: 0 });
  };

  const onWheel = (e) => zoomTo(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15));

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      gesture.current = { type: 'pinch', dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), scale };
    } else {
      gesture.current = { type: 'drag', x: e.clientX, y: e.clientY, offset, startX: e.clientX };
      const now = Date.now();
      if (now - lastTap.current < 300) zoomTo(scale > 1 ? 1 : 2.5);
      lastTap.current = now;
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];
    if (g.type === 'pinch' && pts.length === 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      zoomTo(g.scale * (dist / g.dist));
    } else if (g.type === 'drag' && scale > 1) {
      setOffset({ x: g.offset.x + (e.clientX - g.x), y: g.offset.y + (e.clientY - g.y) });
    }
  };

  const onPointerUp = (e) => {
    const g = gesture.current;
    // Swipe left/right to change photo when not zoomed in
    if (g?.type === 'drag' && scale === 1 && pointers.current.size === 1) {
      const dx = e.clientX - g.startX;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    }
    pointers.current.delete(e.pointerId);
    gesture.current = null;
  };

  const btn =
    'w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur transition-colors';

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col select-none" role="dialog" aria-modal="true" aria-label="Image viewer">
      <div className="flex items-center justify-between px-3 py-3 text-white">
        <span className="text-xs font-medium opacity-80">
          {index + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" className={btn} onClick={() => zoomTo(scale / 1.5)} aria-label="Zoom out">
            <ZoomOut size={18} />
          </button>
          <button type="button" className={btn} onClick={() => zoomTo(scale * 1.5)} aria-label="Zoom in">
            <ZoomIn size={18} />
          </button>
          <button type="button" className={btn} onClick={reset} aria-label="Reset zoom">
            <RotateCcw size={16} />
          </button>
          <button type="button" className={btn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden touch-none"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: scale > 1 ? 'grab' : 'zoom-in' }}
      >
        <img
          src={images[index]}
          alt={alt}
          draggable={false}
          className="absolute inset-0 m-auto max-w-full max-h-full object-contain"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: gesture.current ? 'none' : 'transform 150ms ease-out',
          }}
        />
        {images.length > 1 && (
          <>
            <button type="button" className={`${btn} absolute left-3 top-1/2 -translate-y-1/2`} onPointerDown={(e) => e.stopPropagation()} onClick={() => go(-1)} aria-label="Previous image">
              <ChevronLeft size={22} />
            </button>
            <button type="button" className={`${btn} absolute right-3 top-1/2 -translate-y-1/2`} onPointerDown={(e) => e.stopPropagation()} onClick={() => go(1)} aria-label="Next image">
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      <p className="text-center text-[11px] text-white/60 py-2">Pinch or double-tap to zoom · drag to move</p>
    </div>
  );
};

export default ImageLightbox;
