import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { 
  ArrowRight,
  HeartHandshake,
  Search,
  CheckCircle2,
  MapPin,
  Clock,
  Lock,
  Wallet,
  Smartphone,
  Key,
  Briefcase
} from "lucide-react";
import { Linco3DHeroObject, HeroObjectType } from "./Linco3DHeroObject";
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

  // Active story scene: 0=Lost, 1=Search, 2=Match, 3=Verify, 4=Reunite
  const [activeScene, setActiveScene] = useState<number>(0);
  const [selectedHeroType, setSelectedHeroType] = useState<HeroObjectType>("phone");

  const scenes = [
    {
      id: "lost",
      badge: "01 — The Moment",
      title: "Lost doesn't have to mean gone.",
      subtitle: "That sinking feeling when you reach into your pocket and find empty space. But you are not alone.",
      humanNote: "Most lost items are found by everyday people who want to return them.",
      color: "text-slate-800 bg-slate-100 border-slate-200"
    },
    {
      id: "search",
      badge: "02 — The Search",
      title: "LINCO helps you look.",
      subtitle: "Report in under two minutes with simple everyday words. No complicated forms or technical jargon.",
      humanNote: "We quietly look across nearby community posts, metro desks, and local finders.",
      color: "text-indigo-700 bg-indigo-50 border-indigo-200"
    },
    {
      id: "match",
      badge: "03 — The Connection",
      title: "We found something that may be yours.",
      subtitle: "Clear, human-readable evidence connects what was lost with what was found.",
      humanNote: "No confusing percentages. Just real, plain-English details that match.",
      color: "text-sky-700 bg-sky-50 border-sky-200"
    },
    {
      id: "verify",
      badge: "04 — Safe & Private",
      title: "Both people verify before connecting.",
      subtitle: "Your phone number stays strictly private until both sides confirm and agree to connect.",
      humanNote: "A simple question only the genuine owner knows protects your privacy.",
      color: "text-violet-700 bg-violet-50 border-violet-200"
    },
    {
      id: "reunite",
      badge: "05 — The Reunion",
      title: "Safely brought back home.",
      subtitle: "A relief like no other. Your personal belongings, memories, and peace of mind restored.",
      humanNote: "Some things are worth finding. LINCO: Let's bring it back.",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200"
    }
  ];

  return (
    <div className="relative w-full bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      
      {/* ===================================================================== */}
      {/* SECTION 1: HERO (ABOVE THE FOLD - CLEAN, DECISIVE, EMOTIONALLY WARM) */}
      {/* Answers: 1. What is LINCO? 2. Can LINCO help me? 3. What do I click? */}
      {/* ===================================================================== */}
      <section className="relative pt-8 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-slate-100">
        
        {/* Decorative soft glow - pointer events strictly none */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 rounded-full bg-indigo-50/70 blur-3xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-center">
          
          {/* LEFT: Core emotional invitation & direct actions (7 cols) */}
          <div className="lg:col-span-7 text-left space-y-6 z-20">
            
            {/* Reassuring badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Community Lost &amp; Found Network</span>
            </div>

            {/* Clear, direct, human headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.1]">
                Lost something?
                <br />
                <span className="text-slate-900">Let&rsquo;s bring it back.</span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl pt-2">
                LINCO helps everyday people report, search, and safely return lost items in their community.
              </p>
            </div>

            {/* PRIMARY USER ACTIONS — ALWAYS INSTANTLY CLICKABLE (POINTER-EVENTS-AUTO) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-30">
              <button
                type="button"
                onClick={() => onNavigateToReport("Lost")}
                className="px-6 py-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
              >
                <span>Report Lost Item</span>
                <ArrowRight size={16} className="text-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToReport("Found")}
                className="px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 hover:border-slate-400 shadow-xs transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
              >
                <HeartHandshake size={16} className="text-indigo-600" />
                <span>I Found Something</span>
              </button>
            </div>

            {/* Quick item switcher — helps user relate immediately */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-medium text-slate-400 block">
                What are you looking for?
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "wallet", label: "Wallet", icon: Wallet },
                  { id: "phone", label: "Phone", icon: Smartphone },
                  { id: "keys", label: "Keys", icon: Key },
                  { id: "bag", label: "Bag", icon: Briefcase }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedHeroType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedHeroType(item.id as HeroObjectType)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected 
                          ? "bg-slate-900 text-white shadow-xs" 
                          : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                      }`}
                    >
                      <Icon size={13} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT: Recognizable Physical Item Presentation (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-4 lg:py-0">
            {/* Contact surface card - warm and calm */}
            <div className="relative w-full max-w-sm flex items-center justify-center">
              <Linco3DHeroObject 
                type={selectedHeroType}
                scale={1}
                interactive={true}
                className="z-10"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-4 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              Recognizable everyday lost belongings
            </span>
          </div>

        </div>

      </section>

      {/* ===================================================================== */}
      {/* SECTION 2: ONE CONTINUOUS STORY (LOSS -> SEARCH -> MATCH -> TRUST -> REUNION) */}
      {/* Human, quiet, completely unblocked, native scroll friendly */}
      {/* ===================================================================== */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            How It Feels
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            From the moment it&rsquo;s lost to the moment it&rsquo;s home.
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Follow the simple journey of how LINCO connects lost items with their rightful owners.
          </p>
        </div>

        {/* Minimal, quiet Scene Beat Selector (Accessible & never blocking) */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
          {scenes.map((s, idx) => {
            const isActive = activeScene === idx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveScene(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                }`}
              >
                <span>{s.badge.split("—")[1] || s.badge}</span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE SCENE CARD: Spacious, human-centered, emotionally clear */}
        <div className="relative min-h-[380px] sm:min-h-[400px] w-full rounded-3xl bg-slate-50 border border-slate-200/80 p-6 sm:p-10 shadow-xs flex flex-col justify-between overflow-hidden">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScene}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Scene Badge & Title */}
              <div className="space-y-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${scenes[activeScene].color}`}>
                  {scenes[activeScene].badge}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {scenes[activeScene].title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                  {scenes[activeScene].subtitle}
                </p>
              </div>

              {/* DYNAMIC SCENE ILLUSTRATION & HUMAN EVIDENCE */}
              {activeScene === 0 && (
                /* SCENE 1: LOST */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-left space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <MapPin size={14} className="text-rose-500" />
                      <span>Where it usually happens</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Left on a metro seat, slipped out in an auto-rickshaw, or left at a coffee counter during morning rush.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-left space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Clock size={14} className="text-amber-500" />
                      <span>Time matters, but hope remains</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Even days later, items frequently sit safely at station security desks or with local store managers.
                    </p>
                  </div>
                </div>
              )}

              {activeScene === 1 && (
                /* SCENE 2: SEARCH */
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 text-left space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Simple Recovery Steps</span>
                    <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">2 mins</span>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">1</span>
                      <span>Tell us what it looks like (e.g. &ldquo;Matte black smartphone with protective case&rdquo;)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">2</span>
                      <span>Pin where you last remember having it</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">3</span>
                      <span>LINCO starts watching for matching reports 24/7</span>
                    </div>
                  </div>
                </div>
              )}

              {activeScene === 2 && (
                /* SCENE 3: MATCH (HUMAN READABLE EVIDENCE ONLY) */
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 text-left space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-bold text-slate-900">Possible Match Found</span>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Human Review Ready
                    </span>
                  </div>

                  {/* Human readable evidence list */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 text-slate-700">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Item description matches:</strong> Both reports describe a matte black smartphone with an ID transit pass tucked inside.</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 text-slate-700">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Location matches:</strong> Both were reported along the Rajiv Chowk station concourse.</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 text-slate-700">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Time matches:</strong> Lost at ~2:15 PM, found and safely handed over at ~2:30 PM.</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onNavigateToMatches}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Check Matches
                    </button>
                  </div>
                </div>
              )}

              {activeScene === 3 && (
                /* SCENE 4: VERIFY (PEACE OF MIND & PRIVACY) */
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 text-left space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Your Privacy is Protected</h4>
                      <p className="text-[11px] text-slate-500">No public phone numbers or home addresses are ever exposed.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                      <span className="font-semibold text-slate-800">1. Verification Question</span>
                      <p className="text-slate-600">The finder asks a detail only the real owner knows (e.g. &ldquo;What family photo is inside?&rdquo;).</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                      <span className="font-semibold text-slate-800">2. Both Agree to Connect</span>
                      <p className="text-slate-600">Contact information is only unlocked when both parties tap &ldquo;I agree to connect&rdquo;.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeScene === 4 && (
                /* SCENE 5: REUNITE (EMOTIONAL ENDING) */
                <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 size={28} />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-slate-900">Item Reunited</h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Safely returned through a public station desk or community meetup point. Trust restored.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigateToReport("Lost")}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Report Your Lost Item
                    </button>
                    <button
                      type="button"
                      onClick={onNavigateToFeed}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer"
                    >
                      Explore Recent Finds
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Bottom scene controls: Previous / Next beat */}
          <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-600">
              {scenes[activeScene].humanNote}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeScene === 0}
                onClick={() => setActiveScene((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={activeScene === scenes.length - 1}
                onClick={() => setActiveScene((p) => Math.min(scenes.length - 1, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition cursor-pointer"
              >
                Next Step
              </button>
            </div>
          </div>

        </div>

      </section>

    </div>
  );
};
