import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';

const VIDEO_SRC = mediaUrl('/splash.mp4');
const LOGO_SRC = mediaUrl('/jaipurio_logo_bg.png');
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
      className={`splash-screen fixed inset-0 z-[9999] flex items-center justify-center bg-black ${
        exiting ? 'is-exiting' : ''
      }`}
      role="dialog"
      aria-label="jaipurio splash"
      aria-busy={!exiting}
    >
      <div className="relative w-full h-full max-w-md mx-auto sm:max-w-lg overflow-hidden bg-black">
        {!ready && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 bg-black">
            <img
              src={LOGO_SRC}
              alt="jaipurio"
              className="w-[80%] max-w-[320px] h-auto object-contain select-none"
              draggable={false}
            />
            <p className="font-brand text-sm italic text-white/70 mt-5 text-center">
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

        {ready && (
          <div className="absolute top-4 left-0 right-0 z-20 flex justify-center px-5 pointer-events-none">
            <img
              src={LOGO_SRC}
              alt="jaipurio"
              className="w-[58%] max-w-[220px] h-auto object-contain select-none"
              style={{ mixBlendMode: 'screen' }}
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashPage;
