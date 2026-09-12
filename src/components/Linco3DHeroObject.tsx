import React, { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Check, 
  Lock,
  Smartphone,
  Wallet,
  Key,
  Briefcase
} from "lucide-react";

export type HeroObjectType = "wallet" | "phone" | "keys" | "bag";

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
  
  // Mouse parallax state for desktop
  const [rotateX, setRotateX] = useState(12);
  const [rotateY, setRotateY] = useState(-18);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || !interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate normalized delta (-1 to 1)
      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

      // Subtle tilt limits: ±14 deg
      setRotateY(-18 + deltaX * 14);
      setRotateX(12 - deltaY * 12);
    };

    const handleMouseLeave = () => {
      setRotateX(12);
      setRotateY(-18);
      setIsHovered(false);
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

  // Object Renderers with layered 3D depth and tactile realism
  const renderObjectContent = () => {
    switch (type) {
      case "phone":
        return (
          <div 
            className="relative w-48 h-80 sm:w-56 sm:h-92 rounded-[38px] p-2 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35),0_0_0_1px_rgba(255,255,255,0.12)_inset] border border-slate-700/60"
            style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
          >
            {/* Glossy bezel highlight */}
            <div className="absolute inset-0 rounded-[38px] bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Screen Surface */}
            <div className="relative w-full h-full rounded-[30px] bg-slate-950 overflow-hidden flex flex-col justify-between p-4 border border-slate-800/80">
              {/* Top Dynamic Island / Notch */}
              <div className="flex items-center justify-between pt-1 px-2">
                <span className="text-[10px] font-mono text-slate-400 font-semibold">9:41</span>
                <div className="w-16 h-3.5 bg-black rounded-full border border-slate-800 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-1.5 border border-slate-400 rounded-2xs" />
                </div>
              </div>

              {/* Notification Card appearing on screen */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg text-left backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white">
                    <ShieldCheck size={12} />
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-300">LINCO Security</span>
                  <span className="text-[9px] text-slate-500 ml-auto">now</span>
                </div>
                <p className="text-[11px] font-bold text-slate-200 leading-tight">
                  Item located safely
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin size={10} className="text-indigo-400" />
                  Rajiv Chowk Metro Concourse
                </p>
              </div>

              {/* Bottom Unlock / Home bar */}
              <div className="flex flex-col items-center gap-2 pb-1">
                <span className="text-[9px] text-slate-500 flex items-center gap-1 font-medium">
                  <Lock size={9} />
                  Protected by LINCO Vault
                </span>
                <div className="w-24 h-1 bg-slate-700/80 rounded-full" />
              </div>
            </div>
          </div>
        );

      case "keys":
        return (
          <div 
            className="relative w-56 h-72 sm:w-64 sm:h-80 flex items-center justify-center"
            style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
          >
            {/* Brass / Steel Key Ring */}
            <div className="relative w-28 h-28 rounded-full border-[8px] border-slate-300 shadow-[0_15px_30px_rgba(15,23,42,0.15)] bg-gradient-to-tr from-slate-400 via-slate-200 to-white flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-100/80 border border-slate-300/60 shadow-inner" />
            </div>

            {/* Smart FOB */}
            <div 
              className="absolute -bottom-2 -left-2 w-28 h-40 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 border border-slate-700 p-3 shadow-2xl flex flex-col justify-between"
              style={{ transform: "rotate(-18deg) translateZ(20px)" }}
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
                <Sparkles size={12} className="text-indigo-400" />
              </div>
              <div className="space-y-1">
                <div className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase">LINCO FOB</div>
                <div className="text-[8px] text-slate-500">ID: SEC-8842</div>
              </div>
            </div>

            {/* Metal Key blade */}
            <div 
              className="absolute -bottom-6 -right-2 w-12 h-44 rounded-b-xl bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 border border-amber-300/80 shadow-xl flex flex-col justify-end p-1.5"
              style={{ transform: "rotate(24deg) translateZ(10px)" }}
            >
              <div className="w-3 h-2 bg-amber-400/80 mb-2 rounded-xs self-end" />
              <div className="w-4 h-2 bg-amber-400/80 mb-3 rounded-xs self-end" />
              <div className="w-2 h-2 bg-amber-400/80 mb-4 rounded-xs self-end" />
            </div>
          </div>
        );

      case "bag":
        return (
          <div 
            className="relative w-60 h-76 sm:w-68 sm:h-84 rounded-3xl bg-gradient-to-b from-stone-800 via-slate-800 to-slate-900 border border-slate-700/80 p-5 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] flex flex-col justify-between"
            style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
          >
            {/* Top Carry Handle */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-10 border-4 border-slate-700 rounded-t-2xl bg-transparent" />
            
            {/* Bag Body Design */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-bold">COMMUTE PACK</span>
              <div className="w-8 h-4 bg-amber-600/30 border border-amber-500/50 rounded flex items-center justify-center text-[9px] text-amber-300 font-semibold">
                TAGGED
              </div>
            </div>

            {/* Front Pocket Detail */}
            <div className="w-full h-36 rounded-2xl bg-slate-950/60 border border-slate-700/80 p-3.5 flex flex-col justify-between shadow-inner">
              <div className="w-full h-1 bg-slate-700 rounded-full" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <ShieldCheck size={14} />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold text-slate-200">Campus Registered</div>
                  <div className="text-[8px] text-slate-400">Library Level 2 Hotspot</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
              <span>Secure Handover Ready</span>
              <span>100% Privacy</span>
            </div>
          </div>
        );

      case "wallet":
      default:
        return (
          <div 
            className="relative w-64 h-80 sm:w-72 sm:h-92 rounded-[32px] p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-[#131b2e] to-[#0a0f1d] border border-slate-700/80 shadow-[0_30px_70px_-15px_rgba(15,23,42,0.4),0_0_0_1px_rgba(255,255,255,0.08)_inset] flex flex-col justify-between text-left select-none overflow-hidden"
            style={{ transform: "translateZ(35px)", transformStyle: "preserve-3d" }}
          >
            {/* Subtle tactile leather grain & light sheen */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 border border-dashed border-slate-600/40 rounded-[28px] m-1 pointer-events-none" />

            {/* Top Cards Slipped Out in 3D Stack */}
            <div className="relative -mt-2 space-y-1.5" style={{ transform: "translateZ(20px)" }}>
              {/* Card 1 - Emerald Debit/ID Card */}
              <div className="h-14 sm:h-16 w-full rounded-xl bg-gradient-to-r from-emerald-700 to-teal-900 border border-emerald-500/40 p-2.5 shadow-md flex items-center justify-between text-white transform -rotate-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-xs bg-amber-300/80 shadow-xs" />
                  <span className="text-[10px] font-mono tracking-wider font-semibold">•••• 4892</span>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-emerald-200 font-bold">Transit Pass</span>
              </div>

              {/* Card 2 - Indigo LINCO Identity Pass */}
              <div className="h-14 sm:h-16 w-full rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 border border-indigo-400/40 p-2.5 shadow-md flex items-center justify-between text-white transform rotate-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-indigo-200" />
                  <span className="text-[10px] font-bold tracking-wide">LINCO Guard ID</span>
                </div>
                <div className="flex items-center gap-1 text-[8px] bg-white/10 px-1.5 py-0.5 rounded-full">
                  <Check size={9} />
                  <span>Verified</span>
                </div>
              </div>
            </div>

            {/* Wallet Fold & Debossed LINCO Emblem */}
            <div className="my-auto py-2 text-center" style={{ transform: "translateZ(25px)" }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/90 text-slate-300 text-[11px] font-semibold backdrop-blur-xs shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span>Genuine Personal Item</span>
              </div>
            </div>

            {/* Bottom Details & Tactile Stitching */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[10px]" style={{ transform: "translateZ(15px)" }}>
              <div className="flex items-center gap-1.5">
                <Lock size={11} className="text-indigo-400" />
                <span>PIN Secured</span>
              </div>
              <span className="font-mono text-slate-500 font-semibold">LINCO-VAULT</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      className={`relative inline-block cursor-pointer select-none transition-transform duration-300 ${className}`}
      style={{ perspective: "1200px" }}
    >
      {/* 3D Animated Floating Stage */}
      <motion.div
        animate={
          prefersReducedMotion
            ? { rotateX: 0, rotateY: 0, y: 0 }
            : {
                rotateX: isHovered ? rotateX - 3 : rotateX,
                rotateY: isHovered ? rotateY + 4 : rotateY,
                y: subtleFloating ? [0, -10, 0] : 0,
              }
        }
        transition={{
          rotateX: { type: "spring", stiffness: 120, damping: 20 },
          rotateY: { type: "spring", stiffness: 120, damping: 20 },
          y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{
          transformStyle: "preserve-3d",
          scale
        }}
        className="relative flex items-center justify-center p-4"
      >
        {/* Soft Realistic Contact Shadow (responds to floating elevation) */}
        <motion.div 
          animate={
            prefersReducedMotion
              ? { scale: 1, opacity: 0.2 }
              : {
                  scale: subtleFloating ? [1, 0.88, 1] : 1,
                  opacity: subtleFloating ? [0.25, 0.16, 0.25] : 0.2,
                }
          }
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-6 w-52 sm:w-64 h-8 bg-slate-900 rounded-[100%] blur-xl -z-10 pointer-events-none"
        />

        {/* Ambient Warm/Cool Soft Bounce Glow */}
        <div className="absolute inset-0 bg-indigo-500/8 rounded-full blur-2xl -z-10 pointer-events-none" />

        {/* The 3D Object */}
        {renderObjectContent()}
      </motion.div>
    </div>
  );
};
