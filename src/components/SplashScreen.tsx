/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 1600,
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

  // Safe, guaranteed completion timer
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  // Keyboard shortcut to dismiss immediately
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
      exit={{ opacity: 0, scale: 0.995 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] w-screen h-screen bg-[#fafbfc] text-slate-900 flex flex-col justify-between items-center select-none overflow-hidden px-6 pt-[calc(env(safe-area-inset-top,0px)+2rem)] pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]"
      style={{
        width: "100vw",
        height: "100dvh",
      }}
      role="region"
      aria-label="LINCO Entrance"
    >
      {/* Subtle soft ambient light vignette in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[540px] h-[380px] sm:h-[540px] bg-gradient-to-tr from-indigo-50/60 via-purple-50/30 to-sky-50/50 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar: Discreet Live Status & Skip Option */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md flex justify-between items-center text-[11px] font-mono tracking-wider text-slate-400 uppercase z-10"
      >
        <span className="flex items-center gap-2 font-medium text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Community Network
        </span>
        <button
          onClick={onComplete}
          className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-[10px] tracking-widest uppercase font-mono px-2.5 py-1 rounded-full hover:bg-slate-100"
          aria-label="Skip splash screen"
        >
          Skip ↵
        </button>
      </motion.div>

      {/* Center Stage: The Cinematic LINCO Reunion Emblem & Typographic Lockup */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-md text-center z-10">
        
        {/* Animated Brand Emblem */}
        <div className="relative mb-6 sm:mb-8 flex items-center justify-center">
          <svg
            width="88"
            height="88"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-20 h-20 sm:w-22 sm:h-22 drop-shadow-[0_12px_28px_rgba(79,70,229,0.12)]"
            aria-label="LINCO Emblem"
          >
            <defs>
              <linearGradient id="splash-left-grad" x1="6" y1="38" x2="30" y2="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4338ca" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>

              <linearGradient id="splash-right-grad" x1="42" y1="38" x2="18" y2="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="70%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>

            {/* Left Arc: Owner Journey */}
            <motion.path
              d="M 16 38 C 10 32 8 22 13 14 C 17 8 24 6 24 13 C 24 19 18 24 18 28 C 18 32 21 35 24 38"
              stroke="url(#splash-left-grad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={prefersReducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Right Arc: Community Return Journey */}
            <motion.path
              d="M 32 38 C 38 32 40 22 35 14 C 31 8 24 6 24 13 C 24 19 30 24 30 28 C 30 32 27 35 24 38"
              stroke="url(#splash-right-grad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={prefersReducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Central Verification Beacon (The Reunion Point) */}
            <motion.circle
              cx="24"
              cy="19"
              r="4"
              stroke="#4f46e5"
              strokeWidth="2"
              fill="#ffffff"
              initial={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            />

            {/* Inner Core Pulse */}
            <motion.circle
              cx="24"
              cy="19"
              r="1.8"
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
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans font-black text-4xl sm:text-5xl tracking-tight text-slate-950 select-none"
        >
          LINCO
        </motion.h1>

        {/* Emotional Copy: "Because every lost thing has a story." */}
        <motion.p
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-sm sm:text-base text-slate-600 font-medium tracking-normal mt-3 select-none"
        >
          Because every lost thing has a story.
        </motion.p>

        {/* Subtle, refined connection indicator line */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-6 flex items-center justify-center gap-1.5"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 animate-pulse" />
          <div className="w-12 h-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 via-indigo-600/60 to-indigo-500/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 animate-pulse" />
        </motion.div>
      </div>

      {/* Bottom Footer Details */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full max-w-md text-center z-10"
      >
        <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 tracking-widest uppercase">
          PRIVACY-FIRST RECOVERY NETWORK
        </p>
      </motion.div>
    </motion.div>
  );
};
