import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 1400,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
      return () => mediaQuery.removeEventListener("change", handleMediaChange);
    }
  }, []);

  // Graceful, calm completion timer
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  // Keyboard shortcut to skip splash immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        onComplete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] w-screen h-screen bg-white text-slate-900 flex flex-col justify-between items-center select-none overflow-hidden px-6 pt-[calc(env(safe-area-inset-top,0px)+2rem)] pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]"
      style={{
        width: "100vw",
        height: "100dvh",
      }}
      role="region"
      aria-label="LINCO Entrance"
    >
      {/* Subtle soft ambient warmth behind emblem */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] bg-gradient-to-tr from-indigo-50/80 via-purple-50/40 to-sky-50/60 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Bar: Discreet Network Status & Skip Option */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md flex justify-between items-center text-[10px] sm:text-xs font-mono tracking-widest text-slate-400 uppercase"
      >
        <span className="flex items-center gap-1.5 font-medium text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LINCO Community Network
        </span>
        <button
          onClick={onComplete}
          className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-[10px] tracking-wider uppercase font-mono px-2 py-1 rounded"
          aria-label="Skip to home"
        >
          Skip
        </button>
      </motion.div>

      {/* Center Stage: The LINCO Reunion Symbol & Typographic Lockup */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-sm text-center">
        
        {/* Animated Brand Emblem */}
        <div className="relative mb-6 sm:mb-8 flex items-center justify-center">
          <svg
            width="80"
            height="80"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-18 h-18 sm:w-20 sm:h-20 drop-shadow-[0_12px_24px_rgba(79,70,229,0.12)]"
            aria-label="LINCO Reunion Mark"
          >
            <defs>
              {/* Left Path: Lost / Owner Path (Indigo to Violet) */}
              <linearGradient id="splash-white-left-grad" x1="6" y1="38" x2="30" y2="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4338ca" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>

              {/* Right Path: Finder / Community Path (Indigo to Sky Cyan) */}
              <linearGradient id="splash-white-right-grad" x1="42" y1="38" x2="18" y2="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="70%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>

            {/* 1. Left Arc: Owner Journey */}
            <motion.path
              d="M 16 38 C 10 32 8 22 13 14 C 17 8 24 6 24 13 C 24 19 18 24 18 28 C 18 32 21 35 24 38"
              stroke="url(#splash-white-left-grad)"
              strokeWidth="3.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={prefersReducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* 2. Right Arc: Community Return Journey */}
            <motion.path
              d="M 32 38 C 38 32 40 22 35 14 C 31 8 24 6 24 13 C 24 19 30 24 30 28 C 30 32 27 35 24 38"
              stroke="url(#splash-white-right-grad)"
              strokeWidth="3.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={prefersReducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* 3. Central Verification Beacon (The Reunion Point) */}
            <motion.circle
              cx="24"
              cy="19"
              r="4.25"
              stroke="#4f46e5"
              strokeWidth="2.2"
              fill="#ffffff"
              initial={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            />

            {/* Inner Core Pulse */}
            <motion.circle
              cx="24"
              cy="19"
              r="1.75"
              fill="#4f46e5"
              initial={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.55 }}
            />

            {/* Converged Anchor Base Point */}
            <motion.circle
              cx="24"
              cy="38"
              r="2"
              fill="#4f46e5"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.65 }}
            />
          </svg>
        </div>

        {/* Brand Name: LINCO */}
        <motion.h1
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans font-black text-4xl sm:text-5xl tracking-tight text-slate-950 select-none"
        >
          LINCO
        </motion.h1>

        {/* Gentle Subtitle requested in prompt */}
        <motion.p
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-sm sm:text-base text-slate-600 font-medium tracking-tight mt-2.5 select-none"
        >
          Recover what matters.
        </motion.p>
      </div>

      {/* Bottom Footer Details */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full max-w-md text-center"
      >
        <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 tracking-wider">
          PRIVACY-FIRST LOST &amp; FOUND NETWORK
        </p>
      </motion.div>
    </motion.div>
  );
};
