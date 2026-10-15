import React, { useEffect, useRef, useState } from 'react';

/**
 * Horizontal carousel of pre-built pages (e.g. 4 cards each). Pages snap into
 * place, slide to the next one every `autoMs`, can be swiped by the user, and
 * get dots when there is more than one. Auto-sliding pauses while the user is
 * touching/hovering it and while the browser tab is hidden.
 */
const PagedCarousel = ({ pages, autoMs = 5000, className = '' }) => {
  const track = useRef(null);
  const paused = useRef(false);
  const resumeTimer = useRef(null);
  const [page, setPage] = useState(0);
  const count = pages.length;

  const goTo = (index) => {
    const el = track.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  const pause = (ms = 8000) => {
    paused.current = true;
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      paused.current = false;
    }, ms);
  };

  useEffect(() => {
    if (count < 2) return undefined;
    const id = setInterval(() => {
      const el = track.current;
      if (!el || paused.current || document.hidden) return;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      goTo((current + 1) % count);
    }, autoMs);
    return () => {
      clearInterval(id);
      clearTimeout(resumeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, autoMs]);

  if (!count) return null;

  return (
    <div className={className}>
      <div
        ref={track}
        onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        onTouchStart={() => pause(10000)}
        onPointerDown={() => pause(10000)}
        onMouseEnter={() => pause(4000)}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {pages.map((content, i) => (
          <div key={i} className="w-full shrink-0 snap-start px-px">
            {content}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                pause(10000);
                goTo(i);
              }}
              aria-label={`Show page ${i + 1}`}
              className={`rounded-full transition-all ${page === i ? 'w-4 h-1.5 bg-[#C45C6A]' : 'w-1.5 h-1.5 bg-[#D8C9B5]'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PagedCarousel;
