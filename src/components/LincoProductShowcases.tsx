import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  Clock,
  Navigation
} from "lucide-react";
import { Linco3DHeroObject } from "./Linco3DHeroObject";

interface LincoProductShowcasesProps {
  onNavigateToReport: (type?: "Lost" | "Found") => void;
  onNavigateToMatches: () => void;
}

export const LincoProductShowcases: React.FC<LincoProductShowcasesProps> = ({
  onNavigateToReport,
  onNavigateToMatches
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="space-y-28 sm:space-y-36 max-w-5xl mx-auto px-4 sm:px-6 w-full py-8 select-none">
      
      {/* ========================================================================= */}
      {/* SHOWCASE 1: LOST — "One report is all it takes." */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Visual Column */}
        <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
          <div className="relative">
            {/* Subtle multi-layer ambient halo */}
            <div className="absolute inset-0 bg-slate-100 rounded-full blur-3xl -z-10" />
            <Linco3DHeroObject type="wallet" scale={1.05} />
          </div>
        </div>

        {/* Story Column */}
        <div className="lg:col-span-6 space-y-6 text-left order-1 lg:order-2">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              01 / Private Incident Log
            </span>
            <div className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              LOST
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-indigo-600">
              &ldquo;One report is all it takes.&rdquo;
            </h3>
          </div>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            No desperate social media posts exposing your private telephone number. LINCO lets you file an incident report in under two minutes with precision spatial pinning, approximate timeline windows, and local client-side PIN encryption.
          </p>

          {/* Minimalist proof points */}
          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Lock size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Zero Public Contact Disclosure:</span>
                <span className="text-slate-500 ml-1">Your phone number is encrypted in your browser and hidden from the public feed.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Spatial Accuracy Radius:</span>
                <span className="text-slate-500 ml-1">Pinpoint transit lines, campus buildings, or society grounds with custom search radiuses.</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateToReport("Lost")}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Report Lost Item</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SHOWCASE 2: MATCH — "LINCO connects the clues." */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Story Column */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              02 / Contextual Intelligence
            </span>
            <div className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              MATCH
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-indigo-600">
              &ldquo;LINCO connects the clues.&rdquo;
            </h3>
          </div>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Instead of manual scrolling through hundreds of messy forum posts, LINCO compares spatial proximity vectors, loss-to-find timeline windows, and item characteristics across languages to discover likely matches quietly.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Cross-Lingual Recognition:</span>
                <span className="text-slate-500 ml-1">Reports in Hindi, Marathi, Tamil, Bengali, or English match seamlessly across communities.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <Clock size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Timeline Vector Matching:</span>
                <span className="text-slate-500 ml-1">Intelligently accounts for movement patterns along metro routes and college corridors.</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onNavigateToMatches}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Smart Matches</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Visual Showcase: Visual Matching Diagram */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900">Match Correlation Matrix</span>
              <span className="text-[11px] font-mono text-indigo-600 font-semibold">96% Confidence</span>
            </div>

            {/* Visual Vector Comparison Bars */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Category &amp; Object Class</span>
                  <span className="text-slate-500 font-mono">100% Identical</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-indigo-600 rounded-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Spatial Proximity (Rajiv Chowk)</span>
                  <span className="text-slate-500 font-mono">18m Radius</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-[94%] h-full bg-indigo-600 rounded-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Temporal Concordance</span>
                  <span className="text-slate-500 font-mono">35 mins apart</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-[88%] h-full bg-indigo-600 rounded-full" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600">Verification Readiness</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Safe to Connect
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SHOWCASE 3: VERIFY — "Both sides stay protected." */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Visual Showcase Column */}
        <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_12px_40px_rgba(15,23,42,0.05)] space-y-4 text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-900">Mutual Trust Vault</h4>
                <p className="text-[11px] text-slate-500">Contact release requires bilateral consent</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Finder Verification</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Approved
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Owner Verification</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Approved
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Encrypted contact unlocked via 4-digit PIN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Story Column */}
        <div className="lg:col-span-6 space-y-6 text-left order-1 lg:order-2">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              03 / Zero-Knowledge Proof
            </span>
            <div className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              VERIFY
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-indigo-600">
              &ldquo;Both sides stay protected.&rdquo;
            </h3>
          </div>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Personal property recovery should never feel predatory or unsafe. LINCO generates blind verification queries so claimants must prove their authentic ownership without seeing the finder&apos;s photos or phone number beforehand.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Anti-Scam Architecture:</span>
                <span className="text-slate-500 ml-1">Impostors cannot inspect high-resolution images or copy item serials.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Lock size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Mutual Consent Unlock:</span>
                <span className="text-slate-500 ml-1">Both sides must tap &ldquo;I Trust This Person&rdquo; before direct contact or WhatsApp is revealed.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SHOWCASE 4: REUNITED — "Until it finds its way home." */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Story Column */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              04 / Dignified Return
            </span>
            <div className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              REUNITED
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-indigo-600">
              &ldquo;Until it finds its way home.&rdquo;
            </h3>
          </div>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            The journey completes where public community life thrives. LINCO guides both individuals to safe, high-footfall handover points such as metro customer desks, college security booths, or clubhouse lobbies.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Navigation size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Public Meeting Presets:</span>
                <span className="text-slate-500 ml-1">Pre-selected secure meeting points ensure no one has to invite strangers to their home.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Final Handshake Closure:</span>
                <span className="text-slate-500 ml-1">Finder confirms item delivered; owner confirms item received; post closes automatically.</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateToReport("Lost")}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Start a Recovery Today</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Visual Showcase */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">Recovery Complete</h4>
              <p className="text-xs text-slate-500">Item returned to genuine owner with dignity and trust.</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-600 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Case closed on LINCO Community Network</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
