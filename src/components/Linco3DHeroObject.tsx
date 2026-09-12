import React, { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { 
  Clock,
  PhoneCall,
  Tag
} from "lucide-react";

export type HeroObjectType = "wallet" | "phone" | "keys" | "bag" | "idcard";

interface Linco3DHeroObjectProps {
  type?: HeroObjectType;
  interactive?: boolean;
  scale?: number;
  className?: string;
  subtleFloating?: boolean;
  onSelect?: () => void;
}

export const Linco3DHeroObject: React.FC<Linco3DHeroObjectProps> = ({
  type = "wallet",
  interactive = true,
  scale = 1,
  className = "",
  subtleFloating = true,
  onSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  // Parallax tilt angles for desktop cursor interaction
  const [rotateX, setRotateX] = useState(8);
  const [rotateY, setRotateY] = useState(-12);

  useEffect(() => {
    if (prefersReducedMotion || !interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

      // Subtle, refined tilt limits: ±10 deg
      setRotateY(-12 + deltaX * 10);
      setRotateX(8 - deltaY * 8);
    };

    const handleMouseLeave = () => {
      setRotateX(8);
      setRotateY(-12);
    };

    const node = containerRef.current;
    if (node) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      node.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (node) {
        node.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [prefersReducedMotion, interactive]);

  // Object Renderers: REALISTIC, RECOGNIZABLE, TACTILE PHYSICAL LOST BELONGINGS
  const renderObjectContent = () => {
    switch (type) {
      // =======================================================================
      // 1. SMARTPHONE: Real personal phone with lockscreen, photo, and missed call
      // =======================================================================
      case "phone":
        return (
          <div 
            className="relative w-52 h-84 sm:w-60 sm:h-96 rounded-[40px] p-2.5 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3),0_0_0_1px_rgba(255,255,255,0.15)_inset] border border-slate-700/80 select-none"
            style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
          >
            {/* Glossy subtle glass reflection */}
            <div className="absolute inset-0 rounded-[40px] bg-gradient-to-tr from-white/12 via-transparent to-transparent pointer-events-none" />

            {/* Screen Surface with warm personal wallpaper */}
            <div className="relative w-full h-full rounded-[32px] overflow-hidden flex flex-col justify-between p-4 bg-gradient-to-br from-amber-900/60 via-slate-900 to-slate-950 border border-slate-800 text-white">
              
              {/* Subtle wallpaper texture hint */}
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/40 via-purple-900/20 to-transparent pointer-events-none" />

              {/* Status Bar & Notch */}
              <div className="relative z-10 flex items-center justify-between pt-1 px-1">
                <span className="text-[11px] font-mono text-slate-300 font-semibold">2:41</span>
                {/* Dynamic Camera Island */}
                <div className="w-16 h-4 bg-black rounded-full border border-slate-800 flex items-center justify-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <div className="w-1 h-1 rounded-full bg-slate-900" />
                </div>
                <div className="flex items-center gap-1 text-[9px] text-slate-300">
                  <span className="font-mono">5G</span>
                  <div className="w-3.5 h-2 border border-slate-300 rounded-xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-slate-200 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Big Clock Display on Lockscreen */}
              <div className="relative z-10 text-center my-auto space-y-1">
                <div className="text-4xl sm:text-5xl font-extralight tracking-tight font-sans text-white/95">
                  02:41
                </div>
                <p className="text-xs font-medium text-slate-300">
                  Sunday, September 12
                </p>
              </div>

              {/* Real Human Missed Notification — "Mom: 2 missed calls" */}
              <div className="relative z-10 p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                    <PhoneCall size={12} className="animate-pulse" />
                    <span>Mom</span>
                  </div>
                  <span className="text-[10px] text-white/60">4m ago</span>
                </div>
                <p className="text-[11px] text-white/90 font-medium leading-tight">
                  2 Missed Calls &bull; &ldquo;Where are you beta? Did you reach?&rdquo;
                </p>
              </div>

              {/* Bottom Unlock / Home bar */}
              <div className="relative z-10 flex flex-col items-center gap-1.5 pt-2">
                <span className="text-[9px] text-slate-400 font-medium">
                  Swipe up to open
                </span>
                <div className="w-24 h-1 bg-white/60 rounded-full" />
              </div>
            </div>
          </div>
        );

      // =======================================================================
      // 2. KEYS: Real keychain with house keys, brass tag and apartment ring
      // =======================================================================
      case "keys":
        return (
          <div 
            className="relative w-56 h-76 sm:w-64 sm:h-84 flex items-center justify-center select-none"
            style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
          >
            {/* Stainless Steel Split Key Ring */}
            <div className="absolute top-10 w-24 h-24 rounded-full border-[6px] border-slate-300 shadow-[0_12px_28px_rgba(15,23,42,0.15)] bg-gradient-to-tr from-slate-400 via-slate-200 to-white flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white border border-slate-300 shadow-inner" />
            </div>

            {/* Natural Woven Fabric Key Fob ("Flat 402") */}
            <div 
              className="absolute top-20 -left-2 w-24 h-36 rounded-2xl bg-gradient-to-b from-stone-800 to-stone-900 border border-stone-700 p-3 shadow-xl flex flex-col justify-between text-left text-white"
              style={{ transform: "rotate(-16deg) translateZ(15px)" }}
            >
              <div className="w-5 h-5 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-[10px]">
                🔑
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-wide">HOME</div>
                <div className="text-[9px] text-stone-400 font-mono">B-402 &bull; Green Glen</div>
              </div>
            </div>

            {/* Realistic Brass/Silver Master House Key */}
            <div 
              className="absolute top-22 left-16 w-14 h-44 rounded-b-xl bg-gradient-to-r from-slate-200 via-white to-slate-300 border border-slate-300 shadow-2xl flex flex-col items-center justify-between p-1.5"
              style={{ transform: "rotate(14deg) translateZ(25px)" }}
            >
              {/* Key Head */}
              <div className="w-10 h-10 rounded-full border-2 border-slate-400 bg-gradient-to-tr from-slate-300 to-slate-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-400 shadow-inner" />
              </div>

              {/* Shaft & Serrations */}
              <div className="w-5 h-28 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 relative border-x border-slate-400">
                {/* Genuine key notches */}
                <div className="absolute right-0 top-6 w-2 h-2.5 bg-white border-b border-t border-slate-400" />
                <div className="absolute right-0 top-14 w-2 h-3.5 bg-white border-b border-t border-slate-400" />
                <div className="absolute right-0 top-22 w-1.5 h-2 bg-white border-b border-t border-slate-400" />
              </div>

              {/* Tip */}
              <div className="w-4 h-2 bg-slate-300 rounded-b" />
            </div>

            {/* Second Smaller Padlock Key */}
            <div 
              className="absolute top-24 left-24 w-10 h-32 rounded-b-lg bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400 border border-amber-400 shadow-lg flex flex-col items-center justify-between p-1"
              style={{ transform: "rotate(28deg) translateZ(8px)" }}
            >
              <div className="w-8 h-8 rounded-full border border-amber-500 bg-amber-200 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-inner" />
              </div>
              <div className="w-3.5 h-18 bg-amber-300 relative">
                <div className="absolute right-0 top-4 w-1.5 h-2 bg-amber-100" />
                <div className="absolute right-0 top-10 w-1.5 h-2 bg-amber-100" />
              </div>
              <div className="w-3 h-1.5 bg-amber-400 rounded-b" />
            </div>
          </div>
        );

      // =======================================================================
      // 3. BACKPACK: Real student canvas backpack with zipper and luggage tag
      // =======================================================================
      case "bag":
        return (
          <div 
            className="relative w-56 h-76 sm:w-64 sm:h-84 rounded-[32px] bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 border border-slate-700/90 p-4 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col justify-between select-none text-white"
            style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
          >
            {/* Top Fabric Carrying Loop */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-20 h-8 border-4 border-slate-700 rounded-t-xl bg-transparent" />

            {/* Top Zipper Line with Metal Puller */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/70">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-4 bg-slate-400 rounded-xs shadow-xs" />
                <div className="h-0.5 w-24 bg-slate-600 rounded-full" />
              </div>
              <span className="text-[10px] font-sans text-slate-400 font-medium">Oxford Canvas</span>
            </div>

            {/* Front Zipper Compartment with Personal Student Tag */}
            <div className="w-full h-36 rounded-2xl bg-slate-950/70 border border-slate-800 p-3.5 flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between">
                <div className="h-0.5 w-16 bg-slate-700 rounded-full" />
                <div className="w-2 h-3.5 bg-slate-400 rounded-xs shadow-xs" />
              </div>

              {/* Student Name Tag Attached */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Tag size={14} />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-[11px] font-bold text-slate-100">A. Sharma</div>
                  <div className="text-[9px] text-slate-400">Campus ID &bull; Semester IV</div>
                </div>
              </div>
            </div>

            {/* Bottom Base details */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Commute Pack</span>
              <span className="text-indigo-400 font-medium">Notebooks Inside</span>
            </div>
          </div>
        );

      // =======================================================================
      // 4. STUDENT / TRANSIT ID CARD
      // =======================================================================
      case "idcard":
        return (
          <div 
            className="relative w-56 h-80 sm:w-64 sm:h-90 rounded-2xl p-4 bg-white border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.15)] flex flex-col justify-between select-none text-slate-800 text-left"
            style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
          >
            {/* Top Lanyard Clip Hole */}
            <div className="w-10 h-2 bg-slate-200 rounded-full mx-auto" />

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 tracking-wide">STUDENT IDENTITY CARD</span>
                <span className="text-[10px] text-slate-400 font-mono">2026-27</span>
              </div>

              <div className="flex gap-3 items-center">
                {/* Photo Placeholder */}
                <div className="w-14 h-16 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <div className="w-6 h-6 rounded-full bg-slate-300 mb-1" />
                  <div className="w-10 h-3 rounded-t-lg bg-slate-300" />
                </div>

                <div className="space-y-1 leading-tight">
                  <div className="text-xs font-bold text-slate-900">Rohan Verma</div>
                  <div className="text-[10px] text-slate-500">Dept. of Architecture</div>
                  <div className="text-[9px] font-mono text-slate-400">Roll: 2024-ARC-089</div>
                </div>
              </div>
            </div>

            {/* Barcode & Signature Strip */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="w-full h-7 bg-slate-100 rounded flex items-center justify-between px-2">
                <span className="text-[9px] font-mono text-slate-500">RFID: 9482 1083 4402</span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
              </div>
            </div>
          </div>
        );

      // =======================================================================
      // 5. CLASSIC LEATHER WALLET: Real warm leather, realistic stitching, cards
      // =======================================================================
      case "wallet":
      default:
        return (
          <div 
            className="relative w-60 h-80 sm:w-68 sm:h-88 rounded-[32px] p-5 sm:p-6 bg-gradient-to-br from-[#3b2416] via-[#2c1a10] to-[#1e110a] border border-[#52331f]/70 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] flex flex-col justify-between text-left select-none overflow-hidden"
            style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
          >
            {/* Genuine Leather Warm Sheen & Tactile Stitching */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-600/15 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 border border-dashed border-amber-700/30 rounded-[28px] m-1.5 pointer-events-none" />

            {/* Top Cards Naturally Slipped Into Inner Slits */}
            <div className="relative -mt-1 space-y-2" style={{ transform: "translateZ(18px)" }}>
              {/* Card 1: Metro Transit Card */}
              <div className="h-14 sm:h-16 w-full rounded-xl bg-gradient-to-r from-teal-700 to-emerald-800 border border-teal-500/40 p-2.5 shadow-md flex items-center justify-between text-white transform -rotate-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-xs bg-amber-300/90 shadow-xs" />
                  <span className="text-[10px] font-mono tracking-wider font-semibold">Metro Smart Card</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-teal-200 font-bold">Transit</span>
              </div>

              {/* Card 2: Personal Bank Debit Card */}
              <div className="h-14 sm:h-16 w-full rounded-xl bg-gradient-to-r from-slate-800 via-indigo-950 to-slate-900 border border-indigo-500/30 p-2.5 shadow-md flex items-center justify-between text-white transform rotate-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-xs bg-slate-300 shadow-xs" />
                  <span className="text-[10px] font-mono font-medium">•••• 4892</span>
                </div>
                <span className="text-[9px] text-slate-300 font-medium">HDFC Bank</span>
              </div>
            </div>

            {/* Middle: Leather Fold with Warm Genuine Leather Crease */}
            <div className="my-auto py-1 text-center" style={{ transform: "translateZ(20px)" }}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-amber-900/40 text-amber-200/90 text-[11px] font-medium backdrop-blur-xs">
                <span>Natural Saddle Leather</span>
              </div>
            </div>

            {/* Bottom: Tucked Currency Corner & Personal Note Hint */}
            <div className="pt-3 border-t border-amber-900/40 flex items-center justify-between text-[10px] text-amber-200/60" style={{ transform: "translateZ(12px)" }}>
              <span className="font-sans">Contains Family Photo</span>
              <span className="font-mono text-amber-300/80 font-medium">Bifold</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={onSelect}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        perspective: "1000px",
        cursor: onSelect ? "pointer" : "default"
      }}
    >
      <motion.div
        animate={
          subtleFloating && !prefersReducedMotion
            ? {
                y: [0, -6, 0],
                rotateZ: [0, 0.5, 0]
              }
            : {}
        }
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          transform: `scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        className="relative flex items-center justify-center pointer-events-none"
      >
        {/* Soft, realistic contact shadow on the floor beneath */}
        <div 
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 sm:w-60 h-8 rounded-full bg-slate-900/10 blur-xl -z-10"
          style={{ transform: "translateZ(-30px)" }}
        />

        {/* The Realistic Physical Object */}
        {renderObjectContent()}
      </motion.div>
    </div>
  );
};
