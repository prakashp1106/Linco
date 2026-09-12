import React from "react";
import { 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  Clock,
  HeartHandshake
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
  return (
    <div className="space-y-24 sm:space-y-32 max-w-5xl mx-auto px-4 sm:px-6 w-full py-8 select-none">
      
      {/* ========================================================================= */}
      {/* SHOWCASE 1: REPORT — "One report is all it takes." */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Visual Column */}
        <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
          <div className="relative">
            <div className="absolute inset-0 bg-slate-100 rounded-full blur-2xl -z-10" />
            <Linco3DHeroObject type="phone" scale={1} interactive={false} />
          </div>
        </div>

        {/* Story Column */}
        <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              01 &bull; Report
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              One report is all it takes.
            </h3>
          </div>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            No frantic social media posts exposing your private telephone number to strangers. LINCO lets you report a lost or found item in under two minutes with simple, everyday language.
          </p>

          {/* Reassuring human points */}
          <div className="space-y-2.5 pt-1 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Lock size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Your phone number stays hidden:</span>
                <span className="text-slate-500 ml-1">Nobody can see your personal contact details on the public feed.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Simple location pin:</span>
                <span className="text-slate-500 ml-1">Just tap where you remember having it: a metro station, college campus, or market.</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigateToReport("Lost")}
              className="px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer pointer-events-auto active:scale-98"
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
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Story Column */}
        <div className="lg:col-span-6 space-y-5 text-left">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              02 &bull; Match
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              LINCO connects the clues.
            </h3>
          </div>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Instead of endlessly searching through chaotic forum posts, LINCO compares the item description, location, and timeline to gently notify you when something looks like yours.
          </p>

          <div className="space-y-2.5 pt-1 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Works in any language:</span>
                <span className="text-slate-500 ml-1">Reports in Hindi, Tamil, Bengali, or English match with each other automatically.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Clock size={12} />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Timeline matching:</span>
                <span className="text-slate-500 ml-1">Understands that things found 15 minutes after being lost along a metro line are closely related.</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToMatches}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer pointer-events-auto active:scale-98"
            >
              <span>Check Current Matches</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Visual: Human Evidence Matching Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900">Possible Match Found</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Ready to review
              </span>
            </div>

            {/* Human evidence points */}
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-200/70">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Item matches:</strong> Both describe a navy blue college backpack with a water bottle and notebook.</span>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-200/70">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Area matches:</strong> Reported near Rajiv Chowk Metro station concourse.</span>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-200/70">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Time matches:</strong> Lost at ~2:15 PM, found at ~2:30 PM.</span>
              </div>
            </div>

            <div className="pt-1 text-[11px] text-slate-500 text-center">
              Clear, human facts before anyone connects.
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SHOWCASE 3: VERIFY & REUNITE — "Both sides stay protected." */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Visual Column */}
        <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Protected Connection</h4>
                <p className="text-[11px] text-slate-500">Mutual consent required</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Finder Confirmed</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Agreed
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Owner Confirmed</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Agreed
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Contact shared safely for public handover</span>
              </div>
            </div>
          </div>
        </div>

        {/* Story Column */}
        <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              03 &bull; Trust &amp; Reunion
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Both sides stay protected.
            </h3>
          </div>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Safety and dignity always come first. A question only the genuine owner knows confirms ownership. Phone numbers are only shared when both people click &ldquo;I agree to connect&rdquo;.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <HeartHandshake size={15} className="text-indigo-600" />
              <span>Safe handover places recommended</span>
            </div>
            <p className="text-slate-600">
              We recommend meeting at public, staffed locations: metro customer service desks, college library counters, or local society security gates.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
