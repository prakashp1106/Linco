import React, { useRef, useState } from "react";
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring, 
  useReducedMotion,
  AnimatePresence 
} from "motion/react";
import { 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  MapPin, 
  Clock, 
  Lock,
  ChevronDown
} from "lucide-react";
import { Linco3DHeroObject } from "./Linco3DHeroObject";
import { useLanguage } from "../context/LanguageContext";

interface LincoStoryScrollProps {
  onNavigateToReport: (type?: "Lost" | "Found") => void;
  onNavigateToFeed: () => void;
  onNavigateToMatches: () => void;
}

export const LincoStoryScroll: React.FC<LincoStoryScrollProps> = ({
  onNavigateToReport,
  onNavigateToFeed,
  onNavigateToMatches
}) => {
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Manual interactive phase preview state (if user taps a phase step)
  const [manualPhase, setManualPhase] = useState<number | null>(null);

  // Scroll Progress (0 to 1 over the 380vh scroll height)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 24,
    restDelta: 0.001
  });

  // Derived phase (1 to 5) for UI trackers
  const [activePhase, setActivePhase] = useState<number>(1);

  // Synchronize active phase via scroll listener
  React.useEffect(() => {
    return smoothProgress.on("change", (latest) => {
      if (manualPhase !== null) return;
      if (latest < 0.20) setActivePhase(1);
      else if (latest < 0.40) setActivePhase(2);
      else if (latest < 0.60) setActivePhase(3);
      else if (latest < 0.80) setActivePhase(4);
      else setActivePhase(5);
    });
  }, [smoothProgress, manualPhase]);

  // Phase 1 (Discover) Transforms
  const heroOpacity = useTransform(smoothProgress, [0, 0.18, 0.24], [1, 1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.18], [1, 0.94]);
  const heroY = useTransform(smoothProgress, [0, 0.18], [0, -30]);

  // Phase 2 (Report) Transforms
  const reportOpacity = useTransform(smoothProgress, [0.18, 0.24, 0.38, 0.44], [0, 1, 1, 0]);
  const reportY = useTransform(smoothProgress, [0.18, 0.24, 0.38, 0.44], [40, 0, 0, -40]);

  // Phase 3 (Match) Transforms
  const matchOpacity = useTransform(smoothProgress, [0.38, 0.44, 0.58, 0.64], [0, 1, 1, 0]);
  const matchDistance = useTransform(smoothProgress, [0.38, 0.52], [90, 18]); // Left & Right objects glide toward each other

  // Phase 4 (Verify) Transforms
  const verifyOpacity = useTransform(smoothProgress, [0.58, 0.64, 0.78, 0.84], [0, 1, 1, 0]);
  const verifyScale = useTransform(smoothProgress, [0.58, 0.64], [0.95, 1]);

  // Phase 5 (Reunite) Transforms
  const reuniteOpacity = useTransform(smoothProgress, [0.78, 0.84, 1], [0, 1, 1]);
  const reuniteScale = useTransform(smoothProgress, [0.78, 0.86], [0.92, 1]);

  const phases = [
    { num: 1, label: "Discover", title: "Lost something? Let's bring it back." },
    { num: 2, label: "Report", title: "What happened?" },
    { num: 3, label: "Match", title: "LINCO finds possible matches." },
    { num: 4, label: "Verify", title: "Verify safely." },
    { num: 5, label: "Reunite", title: "Bring it home." }
  ];

  // Helper to scroll smoothly to a specific phase
  const scrollToPhase = (phaseNum: number) => {
    setManualPhase(phaseNum);
    setActivePhase(phaseNum);
    if (!containerRef.current) return;
    const containerTop = containerRef.current.offsetTop;
    const containerHeight = containerRef.current.offsetHeight;
    const targetScroll = containerTop + ((phaseNum - 1) / 4) * (containerHeight - window.innerHeight);
    window.scrollTo({
      top: targetScroll,
      behavior: "smooth"
    });
    setTimeout(() => setManualPhase(null), 1000);
  };

  // If user has reduced motion enabled, render clean static sections
  if (prefersReducedMotion) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-12 space-y-16 text-center">
        {/* Static Phase 1 */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900">
            Lost something? <br />
            <span className="text-indigo-600">Let's bring it back.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
            LINCO connects people, places and intelligent matching to help lost items find their way home.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => onNavigateToReport("Lost")}
              className="px-6 py-3.5 rounded-xl bg-slate-900 text-white font-semibold"
            >
              Report Lost Item
            </button>
            <button
              onClick={() => onNavigateToReport("Found")}
              className="px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold"
            >
              I Found Something
            </button>
          </div>
          <div className="flex justify-center py-6">
            <Linco3DHeroObject type="wallet" interactive={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section 
      ref={containerRef}
      className="relative w-full bg-white selection:bg-indigo-50"
      style={{ height: "380vh" }} // Continuous scroll track
    >
      {/* Sticky Cinematic Screen Stage */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden px-4 sm:px-8 py-16 sm:py-20 z-10">
        
        {/* Subtle Ambient Background Wash that transitions subtly */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/40 to-white -z-20 pointer-events-none" />

        {/* Top Minimal Phase Navigation Strip */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between gap-1.5 p-1 bg-white/90 border border-slate-200/90 rounded-2xl shadow-xs backdrop-blur-md z-30">
          {phases.map((p) => {
            const isCurrent = activePhase === p.num;
            return (
              <button
                key={p.num}
                onClick={() => scrollToPhase(p.num)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer text-center ${
                  isCurrent
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
                aria-label={`Jump to ${p.label}`}
              >
                <span className="hidden sm:inline mr-1 text-[10px] opacity-70">0{p.num}</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Central Dynamic Visual Canvas (Switches based on scroll progress) */}
        <div className="relative flex-1 w-full max-w-4xl mx-auto flex items-center justify-center">
          
          {/* ================================================================= */}
          {/* PHASE 1: DISCOVER */}
          {/* ================================================================= */}
          <motion.div 
            style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 pointer-events-auto"
          >
            <div className="space-y-3 max-w-2xl mx-auto px-4">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Phase 1 — Discover
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Lost something? <br />
                <span className="text-indigo-600">Let's bring it back.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg mx-auto">
                LINCO connects people, places and intelligent matching to help lost items find their way home.
              </p>
            </div>

            {/* Floating Signature 3D Wallet Object */}
            <div className="relative my-2">
              <Linco3DHeroObject type="wallet" scale={1.05} />
            </div>

            {/* Minimalist Tactile Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => onNavigateToReport("Lost")}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-sm font-semibold shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search size={16} />
                <span>Report Lost Item</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => onNavigateToReport("Found")}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 text-sm font-semibold border border-slate-300 shadow-2xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>I Found Something</span>
              </button>
            </div>
          </motion.div>

          {/* ================================================================= */}
          {/* PHASE 2: REPORT */}
          {/* ================================================================= */}
          <motion.div 
            style={{ opacity: reportOpacity, y: reportY }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 pointer-events-auto px-4"
          >
            <div className="space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Phase 2 — Report
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                What happened?
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
                One report is all it takes. A private 2-minute record with zero contact disclosure.
              </p>
            </div>

            {/* Visual Report Card Transition */}
            <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(15,23,42,0.06)] space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold uppercase text-slate-900">Incident Dossier</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">ID: LINCO-9482</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  <Linco3DHeroObject type="wallet" scale={0.45} subtleFloating={false} interactive={false} />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">Leather Bifold Wallet</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={12} className="text-indigo-600 shrink-0" />
                    <span className="truncate">Rajiv Chowk Metro Concourse</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} className="text-slate-400 shrink-0" />
                    <span>Misplaced between 1:00 PM – 2:30 PM</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Lock size={12} /> Contact encrypted by PIN
                </span>
                <span className="font-semibold text-indigo-600">2-min filing</span>
              </div>
            </div>
          </motion.div>

          {/* ================================================================= */}
          {/* PHASE 3: MATCH */}
          {/* ================================================================= */}
          <motion.div 
            style={{ opacity: matchOpacity }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 pointer-events-auto px-4"
          >
            <div className="space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Phase 3 — Match
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                LINCO finds possible matches.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
                Comparing item attributes, time windows, and location radius quietly in the background.
              </p>
            </div>

            {/* Two Items Moving Toward Each Other */}
            <div className="relative w-full max-w-lg flex items-center justify-center gap-3 sm:gap-6">
              
              {/* Owner's Item */}
              <motion.div 
                style={{ x: useTransform(matchDistance, (d) => -d) }}
                className="w-44 sm:w-52 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-md text-left space-y-2"
              >
                <div className="text-[10px] font-bold tracking-wider text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded inline-block">
                  Your Report
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">Leather Bifold Wallet</div>
                <div className="text-[11px] text-slate-500">Rajiv Chowk Metro</div>
                <div className="text-[10px] text-slate-400">Lost 2 hrs ago</div>
              </motion.div>

              {/* Connecting Bridge Line */}
              <div className="relative flex flex-col items-center justify-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={16} />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 mt-1 whitespace-nowrap">98% Match</span>
              </div>

              {/* Finder's Item */}
              <motion.div 
                style={{ x: matchDistance }}
                className="w-44 sm:w-52 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-md text-left space-y-2"
              >
                <div className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded inline-block">
                  Found Item Log
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">Black Leather Wallet</div>
                <div className="text-[11px] text-slate-500">Platform 2 Bench</div>
                <div className="text-[10px] text-slate-400">Safely kept at desk</div>
              </motion.div>

            </div>

            {/* Human Readable Similarity Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-2 pt-2 text-xs text-slate-600">
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80">Same item category</span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80">Within 25 meters</span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80">Time matched within 45m</span>
            </div>
          </motion.div>

          {/* ================================================================= */}
          {/* PHASE 4: VERIFY */}
          {/* ================================================================= */}
          <motion.div 
            style={{ opacity: verifyOpacity, scale: verifyScale }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 pointer-events-auto px-4"
          >
            <div className="space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Phase 4 — Verify
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                Verify safely.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
                Both sides stay protected. Smart questions confirm ownership before anything is unlocked.
              </p>
            </div>

            {/* Clean Verification Shield Card */}
            <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(15,23,42,0.06)] space-y-4 text-left">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Zero-Knowledge Verification</h4>
                  <p className="text-xs text-slate-500">Only genuine owner knows unique markings</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                  <span className="font-semibold text-slate-700">1. Interior Transit Card Details</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Verified
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                  <span className="font-semibold text-slate-700">2. Lost Time Window Concordance</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Verified
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                  <span className="font-semibold text-slate-700">3. Mutual Trust Agreement</span>
                  <span className="text-indigo-600 font-bold">Both Confirmed</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-500 font-medium">
                  Contact details unlock only when both parties tap &ldquo;I Trust This Person&rdquo;
                </span>
              </div>
            </div>
          </motion.div>

          {/* ================================================================= */}
          {/* PHASE 5: REUNITE */}
          {/* ================================================================= */}
          <motion.div 
            style={{ opacity: reuniteOpacity, scale: reuniteScale }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 pointer-events-auto px-4"
          >
            <div className="space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                Phase 5 — Reunite
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                Bring it home.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
                Item returned safely. A dignified, secure recovery moment for the community.
              </p>
            </div>

            {/* United Success Showcase */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-lg max-w-md w-full text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Item Reunited</h3>
                <p className="text-xs text-slate-600">
                  Safely returned at Rajiv Chowk Station Information Desk
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => onNavigateToReport("Lost")}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Start Your Recovery
                </button>
                <button
                  onClick={onNavigateToFeed}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer"
                >
                  Browse Live Feed
                </button>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Bottom Scroll Prompt / Story Progression Bar */}
        <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-2 text-center text-xs text-slate-400 z-20">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Scroll to progress story</span>
            <ChevronDown size={14} className="animate-bounce text-slate-500" />
          </div>
          {/* Hairline progress track */}
          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              style={{ scaleX: smoothProgress, transformOrigin: "left" }} 
              className="h-full bg-slate-900"
            />
          </div>
        </div>

      </div>
    </section>
  );
};
