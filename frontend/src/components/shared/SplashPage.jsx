import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VIDEO_SRC = '/splash.mp4';
const SKIP_SEC = 2;
const SPLASH_MS = 3500;
const EXIT_MS = 500;

/**
 * App entry splash — camel video (skips first 2s), then /login
 */
const SplashPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const timersRef = useRef([]);
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const beginExitSequence = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setReady(true);

    const exitTimer = setTimeout(() => setExiting(true), SPLASH_MS);
    const navTimer = setTimeout(() => {
      document.body.style.overflow = '';
      navigate('/login', { replace: true });
    }, SPLASH_MS + EXIT_MS);
    timersRef.current.push(exitTimer, navTimer);
  };

  const seekAndPlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.currentTime < SKIP_SEC) {
        video.currentTime = SKIP_SEC;
      }
      video.muted = true;
      await video.play();
      beginExitSequence();
    } catch {
      /* autoplay blocked — still continue splash timing */
      beginExitSequence();
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const video = videoRef.current;
    if (!video) return undefined;

    const onLoadedMeta = () => {
      seekAndPlay();
    };
    const onCanPlay = () => {
      if (!startedRef.current) seekAndPlay();
    };
    const onSeeked = () => {
      if (video.paused && !startedRef.current) {
        video.play().then(beginExitSequence).catch(beginExitSequence);
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMeta);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('seeked', onSeeked);

    /* Already cached / instant */
    if (video.readyState >= 1) {
      seekAndPlay();
    }

    /* Fallback if video never fires */
    const failSafe = setTimeout(() => beginExitSequence(), 6000);
    timersRef.current.push(failSafe);

    return () => {
      clearTimers();
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('seeked', onSeeked);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <div
      className={`splash-screen fixed inset-0 z-[9999] flex items-center justify-center bg-[#F8F1E3] ${
        exiting ? 'is-exiting' : ''
      }`}
      role="dialog"
      aria-label="jaipurio splash"
      aria-busy={!exiting}
    >
      <div className="relative w-full h-full max-w-md mx-auto sm:max-w-lg overflow-hidden bg-[#F8F1E3]">
        {!ready && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 bg-[#F8F1E3]">
            <p className="font-brand text-4xl font-bold tracking-[0.06em] text-[#6F241D]">
              jaipurio
            </p>
            <p className="font-brand text-sm italic text-[#4A3A2F] mt-2 text-center">
              Mitti ki khushboo, Rajasthan ki pehchaan
            </p>
          </div>
        )}

        <video
          ref={videoRef}
          className={`splash-art absolute inset-0 w-full h-full object-cover object-center select-none transition-opacity duration-300 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
          src={`${VIDEO_SRC}#t=${SKIP_SEC}`}
          muted
          playsInline
          autoPlay
          preload="auto"
          loop={false}
          controls={false}
          disablePictureInPicture
          aria-label="jaipurio camel splash"
        />
      </div>
    </div>
  );
};

export default SplashPage;
