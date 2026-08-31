import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 2100,
}) => {
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
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

  // Smooth progress calculation
  useEffect(() => {
    if (prefersReducedMotion) {
      setProgress(100);
      const timer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }

    const intervalTime = 25;
    const increment = 100 / (durationMs / intervalTime);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(completeTimer);
    };
  }, [durationMs, onComplete, prefersReducedMotion]);

  // Keyboard shortcut to skip splash if desired
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
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9999] w-screen min-h-[100svh] min-h-[100dvh] bg-[#050508] text-slate-100 flex flex-col justify-between items-center select-none overflow-hidden px-6 pt-[calc(env(safe-area-inset-top,0px)+2rem)] pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]"
      style={{
        width: "100vw",
        height: "100dvh",
      }}
      role="region"
      aria-label="LINCO Application Loading"
    >
      {/* Background Ambient Layers */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Subtle deep ambient glow behind emblem */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[480px] h-[320px] sm:h-[480px] bg-gradient-to-tr from-indigo-600/10 via-purple-600/5 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar: Discreet Status / Category */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="w-full max-w-lg flex justify-between items-center text-[10px] sm:text-xs font-mono tracking-widest text-slate-400 uppercase"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LINCO Network India
        </span>
        <button
          onClick={onComplete}
          className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-[10px] tracking-wider uppercase font-mono px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          aria-label="Skip splash screen"
        >
          Skip
        </button>
      </motion.div>

      {/* Center Stage: The LINCO Reunion Symbol & Typography */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-md text-center">
        
        {/* Animated Brand Emblem */}
        <div className="relative mb-8 sm:mb-10 flex items-center justify-center">
          <svg
            width="88"
            height="88"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[0_0_35px_rgba(99,102,241,0.25)]"
            aria-label="LINCO Reunion Mark"
          >
            <defs>
              {/* Left Path: Lost / Owner Path (Deep Violet to Indigo) */}
              <linearGradient id="splash-left-grad" x1="6" y1="38" x2="30" y2="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>

              {/* Right Path: Found / Finder Path (Cyan to Light Indigo) */}
              <linearGradient id="splash-right-grad" x1="42" y1="38" x2="18" y2="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="60%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#a5b4fc" />
              </linearGradient>

              {/* Central Reunion Core Glow */}
              <radialGradient id="splash-core-glow" cx="24" cy="19" r="12" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#a5b4fc" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>

              <filter id="splash-filter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Ambient background glow */}
            <circle cx="24" cy="20" r="15" fill="url(#splash-core-glow)" opacity="0.16" />

            {/* 1. Left Arc: The Lost Object / Owner Journey */}
            <motion.path
              d="M 16 38 C 10 32 8 22 13 14 C 17 8 24 6 24 13 C 24 19 18 24 18 28 C 18 32 21 35 24 38"
              stroke="url(#splash-left-grad)"
              strokeWidth="3.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={prefersReducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* 2. Right Arc: The Finder / Community Journey */}
            <motion.path
              d="M 32 38 C 38 32 40 22 35 14 C 31 8 24 6 24 13 C 24 19 30 24 30 28 C 30 32 27 35 24 38"
              stroke="url(#splash-right-grad)"
              strokeWidth="3.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={prefersReducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* 3. Central Verification Beacon (The Reunion Point) */}
            <motion.circle
              cx="24"
              cy="19"
              r="4.25"
              stroke="#ffffff"
              strokeWidth="2.2"
              fill="#080914"
              filter="url(#splash-filter)"
              initial={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            />

            {/* Inner Core Pulse */}
            <motion.circle
              cx="24"
              cy="19"
              r="1.75"
              fill="#38bdf8"
              initial={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.75 }}
            />

            {/* Converged Anchor Base Point */}
            <motion.circle
              cx="24"
              cy="38"
              r="2"
              fill="#818cf8"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.85 }}
            />
          </svg>
        </div>

        {/* Brand Name: LINCO */}
        <motion.h1
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans font-black text-4xl sm:text-5xl tracking-tight text-white select-none"
        >
          LINCO
        </motion.h1>

        {/* Category Descriptor */}
        <motion.p
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="font-mono text-xs sm:text-sm font-semibold text-indigo-400 tracking-[0.25em] uppercase mt-2 select-none"
        >
          AI Lost & Found India
        </motion.p>

        {/* Three Core Brand Pillars */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono font-medium text-slate-300 uppercase tracking-widest mt-4"
        >
          <span className="text-slate-200 font-semibold">Locate</span>
          <span className="text-indigo-500">•</span>
          <span className="text-slate-200 font-semibold">Verify</span>
          <span className="text-indigo-500">•</span>
          <span className="text-slate-200 font-semibold">Reunite</span>
        </motion.div>

        {/* Emotional Subtitle */}
        <motion.p
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="text-xs sm:text-sm text-slate-400 font-normal mt-5 max-w-[280px] sm:max-w-xs leading-relaxed"
        >
          Because every lost thing has a story.
        </motion.p>

        {/* Minimal Precision Progress Bar */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-40 sm:w-48 h-1 bg-[#151520] rounded-full overflow-hidden mt-8 relative"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </motion.div>
      </div>

      {/* Bottom Footer Details */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="w-full max-w-lg text-center"
      >
        <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 tracking-wider">
          SECURE CITIZEN NETWORK • GEMINI AI POWERED
        </p>
      </motion.div>
    </motion.div>
  );
};
