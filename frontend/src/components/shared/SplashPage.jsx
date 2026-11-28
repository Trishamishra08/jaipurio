import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';
import { isInApp } from '../../utils/appContext';

const VIDEO_SRC = mediaUrl('/splash.mp4');
const LOGO_SRC = mediaUrl('/jaipurio_logo_bg.png');
const SKIP_SEC = 2;
const SPLASH_MS = 3500;
const EXIT_MS = 500;
const SEEN_KEY = 'jp_splash_seen';

const isSignedIn = () => {
  try {
    return Boolean(localStorage.getItem('customer_token'));
  } catch {
    return false;
  }
};

/** Signed in → home. The app sends a signed-out visitor to login; the website goes to home. */
const nextPath = () => (isSignedIn() || !isInApp() ? '/home' : '/login');

const seenThisVisit = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Entry splash at "/" — camel video (skips its first 2s), then home or login.
 * Plays once per visit; tap anywhere or "Skip" to continue straight away.
 */
const SplashVideo = ({ onDone }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const timersRef = useRef([]);
  const startedRef = useRef(false);
  const leftRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const leave = () => {
    if (leftRef.current) return;
    leftRef.current = true;
    clearTimers();
    document.body.style.overflow = '';
    // Opened on a page other than "/": just uncover that page. At "/": go home/login.
    if (onDone) onDone();
    else navigate(nextPath(), { replace: true });
  };

  const skip = () => {
    if (leftRef.current) return;
    clearTimers();
    setExiting(true);
    timersRef.current.push(setTimeout(leave, EXIT_MS));
  };

  const beginExitSequence = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setReady(true);

    const exitTimer = setTimeout(() => setExiting(true), SPLASH_MS);
    const navTimer = setTimeout(leave, SPLASH_MS + EXIT_MS);
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
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage blocked: the splash just plays again next time */
    }

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
    // Frames are on screen: show the video now (play() can resolve much later).
    const onPlaying = () => beginExitSequence();
    video.addEventListener('playing', onPlaying);

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
      video.removeEventListener('playing', onPlaying);
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
      onClick={skip}
    >
      <div className="relative w-full h-full max-w-md mx-auto sm:max-w-lg overflow-hidden bg-black">
        {!ready && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 bg-[#FFF8EE]">
            <img
              src={LOGO_SRC}
              alt="jaipurio"
              className="w-[78%] max-w-[320px] h-auto object-contain select-none"
              draggable={false}
            />
            <p className="font-brand text-sm italic text-[#6F241D]/80 mt-5 text-center">
              Mitti ki khushboo, Rajasthan ki pehchaan
            </p>
          </div>
        )}

        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover object-center select-none transition-[opacity,transform] duration-500 ease-out ${
            ready ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
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
              className="w-[46%] max-w-[190px] h-auto object-contain select-none rounded-2xl bg-[#FFF8EE]/90 px-3 py-2 shadow-lg"
              draggable={false}
            />
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            skip();
          }}
          className="absolute bottom-6 right-4 z-30 rounded-full bg-black/45 px-4 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-sm border border-white/25"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

const BOT_UA = /(googlebot|bingbot|applebot|duckduckbot|yandexbot|baiduspider|slurp|lighthouse|pagespeed|headlesschrome|facebookexternalhit|whatsapp|twitterbot|linkedinbot|ahrefs|semrush)/i;

/**
 * Plays the splash over the FIRST page of a visit, wherever the visitor lands:
 * the app on any page, the website on its home page. Not for admin/seller
 * pages, search-engine bots, or product/category links opened from Google.
 */
export const SplashGate = () => {
  const [done, setDone] = useState(false);
  const [show] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (seenThisVisit()) return false;
    if (BOT_UA.test(navigator.userAgent || '')) return false;
    const p = window.location.pathname;
    if (p === '/' || /^\/(admin|vendor)(\/|$)/.test(p)) return false; // "/" has its own splash route
    return isInApp() || p === '/home';
  });
  if (!show || done) return null;
  return <SplashVideo onDone={() => setDone(true)} />;
};

/** "/" entry: the splash once per visit; after that straight on. */
const SplashPage = () => {
  const [alreadySeen] = useState(seenThisVisit);
  if (alreadySeen) return <Navigate to={nextPath()} replace />;
  return <SplashVideo />;
};

export default SplashPage;
