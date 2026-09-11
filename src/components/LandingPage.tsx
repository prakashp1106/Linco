/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Shield, 
  Sparkles, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Compass, 
  Bot, 
  ChevronDown 
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { LincoLogo } from "./LincoLogo";
import { useLanguage } from "../context/LanguageContext";

interface LandingPageProps {
  stats: {
    total: number;
    lost: number;
    found: number;
    resolved: number;
  };
  onNavigateToReport: (type?: "Lost" | "Found") => void;
  onNavigateToFeed: () => void;
  onNavigateToMatches: () => void;
  onOpenNotifications: () => void;
  onFocusAIAssistant: () => void;
}

// Pre-configured scenarios for the Timeline Reconstructor USP Showcase
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
    triggerText: "Missing Watch at Metro/Park",
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
    }, 900);
  };

  const currentReconstructData = customResult || activeScenario;

  const faqs = [
    {
      q: "How does LINCO protect my private contact information?",
      a: "We keep your personal information completely private. When you report an item, you choose a 4-digit PIN. Your phone number is encrypted client-side and never displayed on public feeds. Only a claimant whose ownership proof you approve can request contact unlock."
    },
    {
      q: "What is the Timeline Reconstructor and how does it work?",
      a: "The Timeline Reconstructor analyzes the sequence of locations and times you traveled, maps high-probability hotspots where the item was most likely misplaced, and generates a concrete action checklist to focus your physical search."
    },
    {
      q: "How does LINCO verify genuine item ownership?",
      a: "To prevent unauthorized claims, LINCO generates dynamic verification questions based on unique details of the item. Claimants must prove ownership through these answers before details or contact exchanges can proceed."
    },
    {
      q: "What should I do if I find someone's belongings?",
      a: "Tap 'I Found Something' and log key details (item type, location found, and safe custody info). The owner can search and verify their item, and you can coordinate a safe handover in a public location."
    }
  ];

  return (
    <div className="space-y-16 select-none max-w-5xl mx-auto px-4 sm:px-6 w-full py-4">
      
      {/* 1. BRAND & HEADLINE */}
      <section className="pt-2 sm:pt-8 text-center max-w-3xl mx-auto space-y-4">
        <div className="flex flex-col items-center justify-center space-y-2">
          <LincoLogo variant="stacked" size="lg" showTagline taglineText={t("home.heroTag", "Locate • Verify • Reunite")} />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-sans font-extrabold tracking-tight text-white leading-tight">
            {t("home.heroTitle1", "Your identity stays private.")}{" "}
            <span className="text-indigo-400">
              {t("home.heroTitle2", "Your item doesn't.")}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl mx-auto">
            {t("home.heroDesc", "Report a lost or found item in under one minute while your identity remains private until ownership is verified.")}
          </p>
        </div>
      </section>

      {/* 2. PRIMARY ACTION CARDS: "WHAT DO YOU WANT TO DO?" */}
      <section className="space-y-4 max-w-4xl mx-auto">
        <div className="text-center pb-1">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            What do you want to do?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Card A: I Lost Something */}
          <div
            onClick={() => onNavigateToReport("Lost")}
            className="p-6 sm:p-7 rounded-2xl bg-[#0e0e13] border border-slate-800 hover:border-rose-500/40 text-left cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-5"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onNavigateToReport("Lost"); }}
            aria-label={t("home.reportLost", "Report Lost Item")}
          >
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Search size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                  {t("home.reportLost", "I Lost Something")}
                  <ArrowRight size={16} className="text-rose-400" />
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Lost a wallet, phone, keys, bag, or personal belonging? Register a search to alert the community and scan found items.
                </p>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors">
                {t("home.startReport", "Start Lost Report")}
                <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Card B: I Found Something */}
          <div
            onClick={() => onNavigateToReport("Found")}
            className="p-6 sm:p-7 rounded-2xl bg-[#0e0e13] border border-slate-800 hover:border-emerald-500/40 text-left cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-5"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onNavigateToReport("Found"); }}
            aria-label={t("home.reportFound", "Report Found Item")}
          >
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                  {t("home.reportFound", "I Found Something")}
                  <ArrowRight size={16} className="text-emerald-400" />
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Found someone's property in a metro, campus, or public space? Log details safely so verified owners can reclaim it.
                </p>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
                {t("home.reportFound", "Start Found Report")}
                <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Actions Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            onClick={onNavigateToFeed}
            className="px-4 py-2 rounded-xl bg-[#121218] border border-slate-800 hover:border-slate-700 hover:bg-[#181822] text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <Compass size={14} className="text-slate-400" />
            {t("home.browseFeed", "Browse Community Feed")}
          </button>
          <button
            onClick={onNavigateToMatches}
            className="px-4 py-2 rounded-xl bg-[#121218] border border-slate-800 hover:border-slate-700 hover:bg-[#181822] text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} className="text-indigo-400" />
            {t("home.viewMatches", "Smart Matches")}
          </button>
          <button
            onClick={onFocusAIAssistant}
            className="px-4 py-2 rounded-xl bg-[#121218] border border-slate-800 hover:border-slate-700 hover:bg-[#181822] text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <Bot size={14} className="text-slate-400" />
            {t("nav.saathii", "Linco Sathi Assistant")}
          </button>
        </div>
      </section>

      {/* 3. REAL PLATFORM OVERVIEW */}
      <section className="py-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {[
            {
              value: stats.total,
              label: t("home.statsTotal", "Total Items Logged"),
              color: "text-white"
            },
            {
              value: stats.lost,
              label: t("home.statsLost", "Active Lost Searches"),
              color: "text-rose-400"
            },
            {
              value: stats.found,
              label: t("home.statsFound", "Found Items Safe"),
              color: "text-emerald-400"
            },
            {
              value: stats.resolved,
              label: t("home.statsResolved", "Reunited Items"),
              color: "text-indigo-400"
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0c0c11] border border-slate-800/80 text-center"
            >
              <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${item.color}`}>
                {item.value}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. TRUST & PRIVACY FOUNDATION */}
      <section className="py-8 border-y border-slate-800/60 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="text-center space-y-1.5 max-w-xl mx-auto">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              {t("home.trustTitle", "Trusted by Design")}
            </h3>
            <p className="text-xl sm:text-2xl font-bold text-white">
              Built on Privacy, Verification, and Safety
            </p>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t("home.trustSubtitle", "Trusted by communities. Powered by AI. Built for everyone.")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: t("home.trustPrivacyTitle", "Private by Default"),
                desc: t("home.trustPrivacyDesc", "Your contact details are kept strictly private and anonymous until a matched claim is successfully verified.")
              },
              {
                title: t("home.trustProofTitle", "Verified Claims"),
                desc: t("home.trustProofDesc", "Owner validation uses dynamic, non-revealing questions generated by smart AI to block unauthorized claims.")
              },
              {
                title: t("nav.matches", "AI-Assisted Matching"),
                desc: t("notifications.matchFoundMsg", "Deep correlation matching finds exact similarities between lost reports and found logs instantly.")
              },
              {
                title: t("home.trustRecoveryTitle", "Trusted Handover"),
                desc: t("home.trustRecoveryDesc", "Connect through secure chat, mutual verification, and guided handovers in safe public locations.")
              }
            ].map((indicator, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-[#0c0c11] border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-xs">✓</span>
                  <h4 className="text-xs font-bold text-slate-200">{indicator.title}</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {indicator.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TIMELINE RECONSTRUCTOR TOOL */}
      <section className="py-8 px-5 sm:px-6 rounded-2xl bg-[#0c0c11] border border-slate-800/80 space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-300">
            <Clock size={12} />
            <span>Search Assistant</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {t("home.timelineShowcaseTitle", "Timeline Reconstructor")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {t("home.timelineShowcaseSubtitle", "Translate your daily sequence of events into a travel path, mapping key areas to simplify physical search efforts.")}
          </p>
        </div>

        {/* Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Preset Scenarios */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {t("home.timelineTryPrompt", "Choose a common scenario:")}
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
                      ? "bg-[#14141e] border-indigo-500/50 text-white"
                      : "bg-[#08080c] border-slate-800/80 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-semibold text-slate-200">
                      {scen.triggerText}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {scen.recoveryProbability}% confidence
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {scen.item}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              <label className="text-[11px] font-semibold text-slate-400 block">
                Or describe your sequence of places:
              </label>
              <textarea
                rows={3}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g. Took metro at 8:30am, went to office canteen at 1pm, noticed bag missing in room 204 at 4pm..."
                className="w-full p-3 rounded-xl bg-[#08080c] border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 placeholder:text-slate-500 resize-none outline-none"
              />
              <button
                onClick={handleCustomAnalyze}
                disabled={isAnalyzing || !customInput.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isAnalyzing ? "Analyzing path..." : "Reconstruct Path"}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Right Column: Reconstructed Map & Steps */}
          <div className="lg:col-span-7 p-4 sm:p-5 rounded-xl bg-[#08080c] border border-slate-800/80 space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">
                  {currentReconstructData.triggerText}
                </span>
                <span className="text-[11px] text-slate-400">
                  Target: {currentReconstructData.item}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                {currentReconstructData.recoveryProbability}% Probability
              </span>
            </div>

            {/* Chronological Checkpoints */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Predicted High-Probability Hotspots:
              </span>
              <div className="space-y-2">
                {currentReconstructData.checkpoints.map((cp, cIdx) => (
                  <div key={cIdx} className="p-3 rounded-lg bg-[#0e0e14] border border-slate-800 flex justify-between items-center gap-2 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-200 block">{cp.name}</span>
                      <span className="text-[10px] text-slate-500">{cp.time} • Radius: {cp.radius}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                      Loss: {cp.lossProb}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Next Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Recommended Actions:
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {currentReconstructData.suggestedActions.map((action, aIdx) => (
                  <li key={aIdx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION SECTION */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-1.5">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            {t("home.faqTitle", "Have questions?")}
          </h2>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {t("home.faqSubtitle", "Frequently Asked Questions")}
          </p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-slate-800 rounded-xl bg-[#0c0c11] overflow-hidden">
              <button
                onClick={() => setOpenFAQ(openFaq === i ? null : i)}
                className="w-full p-4 text-left flex justify-between items-center text-slate-200 hover:text-white transition cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-semibold pr-4 leading-relaxed">{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${openFaq === i ? "rotate-180 text-indigo-400" : ""}`}
                />
              </button>
              
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden bg-[#08080c]"
                  >
                    <div className="p-4 pt-2 text-xs text-slate-400 leading-relaxed border-t border-slate-800">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CLEAN FOOTER */}
      <footer className="pt-10 pb-6 border-t border-slate-800/80 text-slate-400 text-xs text-center space-y-4 max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 font-medium">
          <button onClick={() => onNavigateToReport("Lost")} className="hover:text-white transition cursor-pointer">
            Report Lost
          </button>
          <button onClick={() => onNavigateToReport("Found")} className="hover:text-white transition cursor-pointer">
            Report Found
          </button>
          <button onClick={onNavigateToFeed} className="hover:text-white transition cursor-pointer">
            Browse Feed
          </button>
          <button onClick={onNavigateToMatches} className="hover:text-white transition cursor-pointer">
            Smart Matches
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          &copy; {new Date().getFullYear()} LINCO. {t("home.heroSubtitle2", "Built for safe, swift community returns.")}
        </p>
      </footer>

    </div>
  );
};
