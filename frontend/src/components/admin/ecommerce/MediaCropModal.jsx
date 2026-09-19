import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Botble-style crop dialog: drag selection + height/width + aspect lock.
 * Exports a cropped blob via onCrop(blob).
 */
export default function MediaCropModal({ open, imageUrl, onClose, onCrop }) {
  const imgRef = useRef(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);

  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [display, setDisplay] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [keepRatio, setKeepRatio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const syncSizeInputs = useCallback((c, nat, disp) => {
    if (!disp.w || !nat.w) return;
    const scaleX = nat.w / disp.w;
    const scaleY = nat.h / disp.h;
    setWidth(String(Math.max(1, Math.round(c.w * scaleX))));
    setHeight(String(Math.max(1, Math.round(c.h * scaleY))));
  }, []);

  const initCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const nat = { w: img.naturalWidth, h: img.naturalHeight };
    const disp = { w: img.clientWidth, h: img.clientHeight };
    setNatural(nat);
    setDisplay(disp);
    const w = Math.round(disp.w * 0.8);
    const h = Math.round(disp.h * 0.8);
    const next = {
      x: Math.round((disp.w - w) / 2),
      y: Math.round((disp.h - h) / 2),
      w,
      h,
    };
    setCrop(next);
    syncSizeInputs(next, nat, disp);
  }, [syncSizeInputs]);

  useEffect(() => {
    if (!open) return;
    setError('');
    setKeepRatio(false);
    setSaving(false);
  }, [open, imageUrl]);

  if (!open || !imageUrl) return null;

  const clampCrop = (next) => {
    const maxW = display.w || 1;
    const maxH = display.h || 1;
    let { x, y, w, h } = next;
    w = Math.max(20, Math.min(w, maxW));
    h = Math.max(20, Math.min(h, maxH));
    x = Math.max(0, Math.min(x, maxW - w));
    y = Math.max(0, Math.min(y, maxH - h));
    return { x, y, w, h };
  };

  const onPointerDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    const stage = stageRef.current?.getBoundingClientRect();
    if (!stage) return;
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...crop },
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    let next = { ...d.origin };

    if (d.mode === 'move') {
      next.x = d.origin.x + dx;
      next.y = d.origin.y + dy;
    } else if (d.mode === 'se') {
      next.w = d.origin.w + dx;
      next.h = keepRatio ? (d.origin.w + dx) * (d.origin.h / d.origin.w) : d.origin.h + dy;
    } else if (d.mode === 'ne') {
      next.w = d.origin.w + dx;
      next.h = keepRatio ? (d.origin.w + dx) * (d.origin.h / d.origin.w) : d.origin.h - dy;
      next.y = keepRatio
        ? d.origin.y + d.origin.h - next.h
        : d.origin.y + dy;
    } else if (d.mode === 'sw') {
      next.w = d.origin.w - dx;
      next.h = keepRatio ? (d.origin.w - dx) * (d.origin.h / d.origin.w) : d.origin.h + dy;
      next.x = d.origin.x + dx;
    } else if (d.mode === 'nw') {
      next.w = d.origin.w - dx;
      next.h = keepRatio ? (d.origin.w - dx) * (d.origin.h / d.origin.w) : d.origin.h - dy;
      next.x = d.origin.x + dx;
      next.y = d.origin.y + dy;
    } else if (d.mode === 'e') {
      next.w = d.origin.w + dx;
      if (keepRatio) next.h = next.w * (d.origin.h / d.origin.w);
    } else if (d.mode === 'w') {
      next.w = d.origin.w - dx;
      next.x = d.origin.x + dx;
      if (keepRatio) next.h = next.w * (d.origin.h / d.origin.w);
    } else if (d.mode === 's') {
      next.h = d.origin.h + dy;
      if (keepRatio) next.w = next.h * (d.origin.w / d.origin.h);
    } else if (d.mode === 'n') {
      next.h = d.origin.h - dy;
      next.y = d.origin.y + dy;
      if (keepRatio) next.w = next.h * (d.origin.w / d.origin.h);
    }

    const clamped = clampCrop(next);
    setCrop(clamped);
    syncSizeInputs(clamped, natural, display);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const applySizeFromInputs = (nextW, nextH) => {
    if (!display.w || !natural.w) return;
    const scaleX = display.w / natural.w;
    const scaleY = display.h / natural.h;
    let w = Math.max(20, Number(nextW) * scaleX);
    let h = Math.max(20, Number(nextH) * scaleY);
    if (keepRatio && crop.w > 0) {
      const ratio = crop.h / crop.w;
      if (nextW !== width) h = w * ratio;
      else w = h / ratio;
    }
    const clamped = clampCrop({ ...crop, w, h });
    setCrop(clamped);
    syncSizeInputs(clamped, natural, display);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const img = imgRef.current;
      if (!img || !display.w || !natural.w) throw new Error('Image not ready');

      const scaleX = natural.w / display.w;
      const scaleY = natural.h / display.h;
      const sx = Math.round(crop.x * scaleX);
      const sy = Math.round(crop.y * scaleY);
      const sw = Math.max(1, Math.round(crop.w * scaleX));
      const sh = Math.max(1, Math.round(crop.h * scaleY));

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Could not crop image'))),
          'image/webp',
          0.92
        );
      });

      await onCrop?.(blob, { width: sw, height: sh });
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Crop failed');
    } finally {
      setSaving(false);
    }
  };

  const handleClass =
    'absolute w-2.5 h-2.5 bg-blue-500 border border-white rounded-sm z-10';

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-3xl bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Crop"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">Crop</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-0">
          <div className="bg-slate-900/90 p-4 flex items-center justify-center min-h-[280px]">
            <div
              ref={stageRef}
              className="relative inline-block max-w-full select-none"
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop"
                crossOrigin="anonymous"
                onLoad={initCrop}
                className="max-h-[55vh] max-w-full block"
                draggable={false}
              />
              <div
                className="absolute border border-dashed border-white cursor-move"
                style={{
                  left: crop.x,
                  top: crop.y,
                  width: crop.w,
                  height: crop.h,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                  background: 'transparent',
                }}
                onPointerDown={(e) => onPointerDown(e, 'move')}
              >
                <span className={`${handleClass} -left-1 -top-1 cursor-nw-resize`} onPointerDown={(e) => onPointerDown(e, 'nw')} />
                <span className={`${handleClass} left-1/2 -translate-x-1/2 -top-1 cursor-n-resize`} onPointerDown={(e) => onPointerDown(e, 'n')} />
                <span className={`${handleClass} -right-1 -top-1 cursor-ne-resize`} onPointerDown={(e) => onPointerDown(e, 'ne')} />
                <span className={`${handleClass} -right-1 top-1/2 -translate-y-1/2 cursor-e-resize`} onPointerDown={(e) => onPointerDown(e, 'e')} />
                <span className={`${handleClass} -right-1 -bottom-1 cursor-se-resize`} onPointerDown={(e) => onPointerDown(e, 'se')} />
                <span className={`${handleClass} left-1/2 -translate-x-1/2 -bottom-1 cursor-s-resize`} onPointerDown={(e) => onPointerDown(e, 's')} />
                <span className={`${handleClass} -left-1 -bottom-1 cursor-sw-resize`} onPointerDown={(e) => onPointerDown(e, 'sw')} />
                <span className={`${handleClass} -left-1 top-1/2 -translate-y-1/2 cursor-w-resize`} onPointerDown={(e) => onPointerDown(e, 'w')} />
              </div>
            </div>
          </div>

          <div className="p-4 border-t md:border-t-0 md:border-l border-slate-200 space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              Height
              <input
                type="number"
                min={1}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                onBlur={() => applySizeFromInputs(width, height)}
                className="mt-1 w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Width
              <input
                type="number"
                min={1}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                onBlur={() => applySizeFromInputs(width, height)}
                className="mt-1 w-full border border-slate-300 rounded-md px-2.5 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={keepRatio}
                onChange={(e) => setKeepRatio(e.target.checked)}
                className="rounded border-slate-300"
              />
              Aspect ratio?
            </label>

            {error ? <p className="text-xs text-red-600">{error}</p> : null}

            <div className="pt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Crop'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full border border-slate-300 text-slate-700 text-sm font-medium py-2 rounded-md hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
