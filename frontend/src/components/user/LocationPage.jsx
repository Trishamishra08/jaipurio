import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crosshair, MapPin, Navigation } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

const DEFAULT_LOCATION = {
  label: 'Jaipur, Rajasthan',
  address: 'Johari Bazaar, Jaipur, Rajasthan 302003',
  lat: 26.9124,
  lng: 75.7873,
};

/**
 * Full-page delivery location picker (Maps-style).
 * Demo: “Use current location” sets default Jaipur.
 */
const LocationPage = () => {
  const navigate = useNavigate();
  const { deliveryLocation, setDeliveryLocation } = useShop();
  const [locating, setLocating] = useState(false);
  const [preview, setPreview] = useState(deliveryLocation || DEFAULT_LOCATION);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/home');
  };

  const useLiveLocation = () => {
    setLocating(true);
    window.setTimeout(() => {
      setPreview(DEFAULT_LOCATION);
      setLocating(false);
    }, 650);
  };

  const confirmLocation = () => {
    setDeliveryLocation(preview);
    goBack();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-dm">
      <header className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-[#E8E2D9] bg-white">
        <button
          type="button"
          onClick={goBack}
          className="p-1.5 -ml-0.5 text-[#3F261B] rounded-full hover:bg-[#F7F3EE]"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-dm text-[15px] font-semibold text-[#3F261B] leading-tight">
            Select delivery location
          </h1>
          <p className="font-dm text-[10px] text-[#806653] truncate">{preview.label}</p>
        </div>
      </header>

      {/* Full map area */}
      <div className="relative flex-1 min-h-0 bg-[#E8F0E4] overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(#c5d4c0 1px, transparent 1px), linear-gradient(90deg, #c5d4c0 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 45% 42%, #9db89a 0%, transparent 45%), radial-gradient(circle at 70% 65%, #b8c9b0 0%, transparent 40%)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center -mt-8">
            <MapPin size={40} className="text-[#6F241D] drop-shadow-md" fill="#6F241D" />
            <span className="mt-1.5 font-dm text-[11px] font-semibold bg-white px-2.5 py-1 rounded-full text-[#3F261B] shadow-md">
              {preview.label}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom action panel */}
      <div className="shrink-0 bg-white border-t border-[#E8E2D9] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={useLiveLocation}
          disabled={locating}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-[#E8E2D9] hover:border-[#6F241D]/35 bg-white text-left transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-[#E8F0E4] flex items-center justify-center shrink-0">
            <Crosshair size={18} className="text-[#354B35]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-dm text-[13px] font-semibold text-[#3F261B]">
              {locating ? 'Detecting location…' : 'Use current location'}
            </p>
            <p className="font-dm text-[10px] text-[#806653]">
              Live location (demo: {DEFAULT_LOCATION.label})
            </p>
          </div>
          <Navigation size={15} className="text-[#6F241D] shrink-0" />
        </button>

        <div className="px-0.5">
          <p className="font-dm text-[9px] font-semibold uppercase tracking-wide text-[#9A8B7A] mb-0.5">
            Selected
          </p>
          <p className="font-dm text-[13px] font-semibold text-[#3F261B]">{preview.label}</p>
          <p className="font-dm text-[11px] text-[#806653] leading-snug">{preview.address}</p>
        </div>

        <button
          type="button"
          onClick={confirmLocation}
          className="w-full py-3 rounded-xl bg-[#6F241D] text-white font-dm text-[13px] font-semibold"
        >
          Confirm location
        </button>
      </div>
    </div>
  );
};

export default LocationPage;
