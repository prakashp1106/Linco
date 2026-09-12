/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  ChevronDown,
  Lock,
  Heart,
  Users,
  Building2,
  GraduationCap,
  Train
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { LincoLogo } from "./LincoLogo";
import { LincoStoryScroll } from "./LincoStoryScroll";
import { LincoInteractiveDiscovery } from "./LincoInteractiveDiscovery";
import { LincoProductShowcases } from "./LincoProductShowcases";
import { useLanguage } from "../context/LanguageContext";

interface LandingPageProps {
  stats: {
    total: number;
    lost: number;
    found: number;
    resolved: number;
  };
  onNavigateToReport: (type?: "Lost" | "Found", category?: string) => void;
  onNavigateToFeed: () => void;
  onNavigateToMatches: () => void;
  onOpenNotifications: () => void;
  onFocusAIAssistant: () => void;
}

// Pre-configured scenarios for the Timeline Reconstructor
const SCENARIOS = [
  {
    id: "scen-1",
    persona: "Campus Student",
    item: "Laptop Bag & Charger",
    triggerText: "Left Bag on Campus",
    inputTimeline: "Entered Cafeteria at 1:15 PM, sat near window. Moved to Central Library, Level 2 Study Desk from 2:00 PM to 4:00 PM. Checked into Seminar Room 402 at 4:15 PM.",
    checkpoints: [
      { name: "Cafeteria (Window Seat)", time: "1:15 PM", lossProb: "20%", radius: "15m", status: "Low Risk - Monitored" },
      { name: "Central Library (Level 2 Desk)", time: "2:00 PM - 4:00 PM", lossProb: "65%", radius: "5m", status: "Highest Risk - Transit Desk" },
      { name: "Seminar Room 402", time: "4:15 PM", lossProb: "15%", radius: "10m", status: "Low Risk - Keycard Entry" }
    ],
    recoveryProbability: 82,
    suggestedActions: [
      "Inquire at Library Level 2 main circulation desk.",
      "Check cafeteria lost-and-found registry.",
      "Verify with department administration for Room 402."
    ]
  },
  {
    id: "scen-2",
    persona: "Transit Commuter",
    item: "Smartwatch & Keys",
    triggerText: "Missing Watch at Metro",
    inputTimeline: "Arrived at Station Parking at 9:00 AM. Walked to Lift Lobby 4. Had lunch at Food Court from 1:00 PM to 1:45 PM. Discovered watch missing in Conference Room at 3:30 PM.",
    checkpoints: [
      { name: "Station Parking Area", time: "9:00 AM", lossProb: "15%", radius: "25m", status: "Low Risk" },
      { name: "Transit Escalator / Gate 2", time: "9:15 AM", lossProb: "30%", radius: "12m", status: "Medium Risk - Heavy Footfall" },
      { name: "Central Food Court", time: "1:00 PM - 1:45 PM", lossProb: "55%", radius: "8m", status: "High Risk - Busy Lunch Area" }
    ],
    recoveryProbability: 74,
    suggestedActions: [
      "Contact security desk at Transit Gate 2.",
      "Check table area in the food court with facilities staff.",
      "File a community notice on LINCO for the route."
    ]
  },
  {
    id: "scen-3",
    persona: "Community Resident",
    item: "Key Ring with Access Tag",
    triggerText: "Lost Keys in Society Grounds",
    inputTimeline: "Inspected Block A elevator lobby at 10:15 AM. Walked through community park. Visited society clubhouse at 11:30 AM. Noticed keys missing at Main Gate at 12:00 PM.",
    checkpoints: [
      { name: "Block A Entrance", time: "10:15 AM", lossProb: "10%", radius: "5m", status: "Low Risk" },
      { name: "Community Park Pathway", time: "10:35 AM", lossProb: "50%", radius: "35m", status: "High Risk - Open Area" },
      { name: "Clubhouse Lobby", time: "11:30 AM", lossProb: "40%", radius: "10m", status: "Medium Risk" }
    ],
    recoveryProbability: 89,
    suggestedActions: [
      "Check community park walking track and benches.",
      "Inquire with clubhouse manager.",
      "Post a found inquiry on the society LINCO notice board."
    ]
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({
  stats,
  onNavigateToReport,
  onNavigateToFeed,
  onNavigateToMatches,
  onFocusAIAssistant
}) => {
  const { t } = useLanguage();

  // Timeline Reconstructor State
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [customInput, setCustomInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customResult, setCustomResult] = useState<typeof SCENARIOS[0] | null>(null);

  // Accordion FAQ State
  const [openFaq, setOpenFAQ] = useState<number | null>(null);

  const handleCustomAnalyze = () => {
    if (!customInput.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const generatedResult = {
        id: "custom",
        persona: "Custom Trajectory",
        item: "Your Item",
        triggerText: "Custom Path Reconstruction",
        inputTimeline: customInput,
        checkpoints: [
          { name: "Starting Location", time: "Initial window", lossProb: "25%", radius: "20m", status: "Departure point" },
          { name: "Primary Transition Zone", time: "Mid-day window", lossProb: "60%", radius: "15m", status: "High probability hotspot" },
          { name: "Discovery Location", time: "Point of discovery", lossProb: "15%", radius: "10m", status: "Notice point" }
        ],
        recoveryProbability: 78,
        suggestedActions: [
          "Retrace steps at the primary transition zone during mid-day.",
          "Check local security or administrative lost property registers.",
          "Verify if a matching found item has been logged on LINCO."
        ]
      };
      setCustomResult(generatedResult);
      setIsAnalyzing(false);
    }, 800);
  };

  const currentReconstructData = customResult || activeScenario;

  const faqs = [
    {
      q: "How does LINCO protect my private contact details?",
      a: "Your personal phone number and exact identity stay completely private. When you report an item, you choose a simple 4-digit PIN. Your contact info is encrypted and hidden from public view until both finder and owner mutually verify the item."
    },
    {
      q: "How does LINCO ensure items go to their genuine owners?",
      a: "LINCO prepares non-revealing verification questions based on unique details of the item. Claimants must prove ownership through these answers before private contact can be unlocked."
    },
    {
      q: "What should I do if I find someone's belongings?",
      a: "Tap 'I Found Something', upload a quick photo or description, and specify where it is safely kept. LINCO automatically notifies potential owners so they can verify their property safely."
    },
    {
      q: "Is LINCO free to use for communities?",
      a: "Yes. LINCO is built for students, transit commuters, housing societies, and public spaces across India to make lost property recovery simple, dignified, and fast."
    }
  ];

  return (
    <div className="w-full select-none">
      
      {/* ========================================================================= */}
      {/* 1. SCROLL-DRIVEN CINEMATIC HERO & 5-PHASE STORYTELLING */}
      {/* ========================================================================= */}
      <LincoStoryScroll 
        onNavigateToReport={onNavigateToReport}
        onNavigateToFeed={onNavigateToFeed}
        onNavigateToMatches={onNavigateToMatches}
      />

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE ITEM DISCOVERY: "What's missing?" */}
      {/* ========================================================================= */}
      <LincoInteractiveDiscovery 
        onSelectCategory={(cat) => onNavigateToReport("Lost", cat)}
      />

      {/* ========================================================================= */}
      {/* 3. PRODUCT REVEAL SHOWCASE SECTIONS (LOST, MATCH, VERIFY, REUNITED) */}
      {/* ========================================================================= */}
      <LincoProductShowcases 
        onNavigateToReport={onNavigateToReport}
        onNavigateToMatches={onNavigateToMatches}
      />

      {/* Main Content Container for Secondary Modules */}
      <div className="space-y-24 sm:space-y-32 max-w-5xl mx-auto px-4 sm:px-6 w-full py-12">

        {/* ========================================================================= */}
        {/* 4. BUILT FOR REAL PEOPLE (Everyday Environments) */}
        {/* ========================================================================= */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Everyday Communities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Built for real people
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Designed for colleges, metro stations, residential complexes, and public hubs across India.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {[
              {
                icon: GraduationCap,
                title: "Colleges & Universities",
                desc: "Lost notebooks, student ID cards, earbuds, or backpacks in lecture halls and study libraries.",
                color: "text-indigo-600"
              },
              {
                icon: Train,
                title: "Metros & Transit",
                desc: "Misplaced umbrellas, keys, transit passes, or phones on metro commutes or platform benches.",
                color: "text-sky-600"
              },
              {
                icon: Building2,
                title: "Societies & Neighborhoods",
                desc: "Dropped keys, courier parcel mixups, or children's items in residential gardens and clubhouses.",
                color: "text-emerald-600"
              },
              {
                icon: Users,
                title: "Cafes & Public Places",
                desc: "Left your wallet, spectacles, or chargers behind at food counters and coffee shops.",
                color: "text-amber-600"
              },
              {
                icon: Heart,
                title: "Kind Good Samaritans",
                desc: "Finders who want to do the right thing without broadcasting their personal telephone number.",
                color: "text-rose-600"
              },
              {
                icon: ShieldCheck,
                title: "Campus Security & Desks",
                desc: "Public help desks streamlining custody records without manual, illegible paper registers.",
                color: "text-purple-600"
              }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Icon size={16} className={card.color} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. COMMUNITY RECOVERY / IMPACT NUMBERS */}
        {/* ========================================================================= */}
        <section className="space-y-6 text-center max-w-4xl mx-auto">
          <div className="space-y-1 max-w-md mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Community Statistics
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Every return is a story saved
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                value: stats.total,
                label: "Items Registered",
                color: "text-slate-900",
                bg: "bg-slate-50"
              },
              {
                value: stats.lost,
                label: "Active Searches",
                color: "text-rose-600",
                bg: "bg-rose-50/50"
              },
              {
                value: stats.found,
                label: "Items Safe with Finders",
                color: "text-emerald-700",
                bg: "bg-emerald-50/50"
              },
              {
                value: stats.resolved,
                label: "Reunited with Owners",
                color: "text-indigo-600",
                bg: "bg-indigo-50/50"
              }
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-5 rounded-2xl border border-slate-200/80 ${stat.bg} text-center space-y-1`}
              >
                <div className={`text-3xl sm:text-4xl font-extrabold font-display tracking-tight ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-slate-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. TIMELINE RECONSTRUCTOR: Search Assistant Tool */}
        {/* ========================================================================= */}
        <section className="p-6 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6 max-w-5xl mx-auto text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-700 mb-1.5">
                <Clock size={12} />
                <span>Search Assistant</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Timeline Reconstructor
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Retrace your steps to pinpoint the most probable location where your item was misplaced.
              </p>
            </div>
          </div>

          {/* Interactive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Preset Scenarios & Custom Box */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-semibold text-slate-700 block">
                Try an everyday scenario:
              </span>
              <div className="space-y-2">
                {SCENARIOS.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => {
                      setCustomResult(null);
                      setActiveScenario(scen);
                    }}
                    className={`w-full p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                      currentReconstructData.id === scen.id && !customResult
                        ? "bg-indigo-50/80 border-indigo-300 text-indigo-950 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold text-slate-900">
                        {scen.triggerText}
                      </span>
                      <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                        {scen.recoveryProbability}% chance
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {scen.item}
                    </p>
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700 block">
                  Or describe the places you visited:
                </label>
                <textarea
                  rows={3}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g. Took metro at 8:30am, visited office canteen at 1pm, noticed bag missing in room 204 at 4pm..."
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:border-indigo-600 text-xs text-slate-800 placeholder:text-slate-400 resize-none outline-none"
                />
                <button
                  onClick={handleCustomAnalyze}
                  disabled={isAnalyzing || !customInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? "Analyzing path..." : "Reconstruct My Path"}
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Right Column: Reconstructed Map & Steps */}
            <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {currentReconstructData.triggerText}
                  </span>
                  <span className="text-xs text-slate-500">
                    Item: {currentReconstructData.item}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-700 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200">
                  {currentReconstructData.recoveryProbability}% Match Potential
                </span>
              </div>

              {/* Chronological Checkpoints */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-700 block">
                  High-Probability Hotspots to Check First:
                </span>
                <div className="space-y-2">
                  {currentReconstructData.checkpoints.map((cp, cIdx) => (
                    <div key={cIdx} className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between items-center gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-900 block">{cp.name}</span>
                        <span className="text-[11px] text-slate-500">{cp.time} • Radius: {cp.radius}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        Likelihood: {cp.lossProb}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Next Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700 block">
                  Recommended Actions:
                </span>
                <ul className="space-y-1 text-xs text-slate-600">
                  {currentReconstructData.suggestedActions.map((action, aIdx) => (
                    <li key={aIdx} className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold mt-0.5">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FAQ ACCORDION SECTION */}
        {/* ========================================================================= */}
        <section className="space-y-6 max-w-3xl mx-auto text-left">
          <div className="text-center space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Frequently Asked
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Common questions about LINCO
            </h2>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-2xs">
                <button
                  onClick={() => setOpenFAQ(openFaq === i ? null : i)}
                  className="w-full p-4.5 text-left flex justify-between items-center text-slate-800 hover:text-indigo-600 transition cursor-pointer"
                >
                  <span className="text-sm font-semibold pr-4 leading-relaxed">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180 text-indigo-600" : ""}`}
                  />
                </button>
                
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden bg-slate-50/50"
                    >
                      <div className="p-4.5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. STRONG FINAL CTA */}
        {/* ========================================================================= */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200/90 text-center space-y-6 max-w-4xl mx-auto">
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Lost something? Start here.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every minute counts. File a quick report to notify nearby finders and scan existing logs.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3">
            <button
              onClick={() => onNavigateToReport("Lost")}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-sm font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Search size={16} />
              <span>Report Lost Item</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => onNavigateToReport("Found")}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 text-sm font-semibold border border-slate-300 shadow-2xs transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>I Found Something</span>
            </button>
            <button
              onClick={onNavigateToFeed}
              className="px-5 py-3.5 rounded-xl bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-sm font-medium transition cursor-pointer"
            >
              Browse Community Feed →
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. CLEAN MINIMAL CONSUMER FOOTER */}
        {/* ========================================================================= */}
        <footer className="pt-8 pb-12 border-t border-slate-200 text-xs text-center space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <LincoLogo variant="full" size="sm" theme="light" />
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500 font-medium">
            <button onClick={() => onNavigateToReport("Lost")} className="hover:text-slate-900 transition cursor-pointer">
              Report Lost
            </button>
            <button onClick={() => onNavigateToReport("Found")} className="hover:text-slate-900 transition cursor-pointer">
              Report Found
            </button>
            <button onClick={onNavigateToFeed} className="hover:text-slate-900 transition cursor-pointer">
              Browse Feed
            </button>
            <button onClick={onNavigateToMatches} className="hover:text-slate-900 transition cursor-pointer">
              Smart Matches
            </button>
            <button onClick={onFocusAIAssistant} className="hover:text-slate-900 transition cursor-pointer">
              Linco Saathii Assistant
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} LINCO. Intelligent community lost and found network.
          </p>
        </footer>

      </div>
    </div>
  );
};
