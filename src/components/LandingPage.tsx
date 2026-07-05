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
  HelpCircle, 
  Mic, 
  Camera, 
  Lock, 
  Bell, 
  Users, 
  BookOpen,
  ChevronDown,
  Award,
  TrendingUp,
  Map,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LandingPageProps {
  stats: {
    total: number;
    lost: number;
    found: number;
    resolved: number;
  };
  onNavigateToReport: () => void;
  onNavigateToFeed: () => void;
}

// Pre-configured scenarios for the Timeline Reconstructor USP Showcase
const SCENARIOS = [
  {
    id: "scen-1",
    persona: "Rahul Sharma (Engineering Student)",
    item: "Asus ROG Gaming Laptop",
    triggerText: "Left Laptop in Campus",
    inputTimeline: "Entered Symbiosis Cafe at 1:15 PM, sat near window. Moved to Central Library, Level 2 Study Desk from 2:00 PM to 4:00 PM. Checked into Lab 402 for seminar at 4:15 PM.",
    checkpoints: [
      { name: "Symbiosis Cafeteria (Window Seat)", time: "1:15 PM", lossProb: "20%", radius: "15 meters", status: "Low Risk - CCTV Active" },
      { name: "Central Library (Level 2 Desk)", time: "2:00 PM - 4:00 PM", lossProb: "65%", radius: "5 meters", status: "High Risk - Crowded Area" },
      { name: "Academic Building Lab 402", time: "4:15 PM", lossProb: "15%", radius: "10 meters", status: "Very Low Risk - Swiped Card Entry" }
    ],
    recoveryProbability: 82,
    suggestedActions: [
      "Ask Librarian Anjali at Level 2 main counter.",
      "Check with Café Coffee Day supervisor for lost-property log.",
      "Verify Card-Access logs with IT Admin in Lab 402."
    ]
  },
  {
    id: "scen-2",
    persona: "Anjali Mehta (Software Engineer)",
    item: "Fossil Gen 6 Smartwatch",
    triggerText: "Lost Watch at Tech Park",
    inputTimeline: "Arrived at Tech Park Parking Lot B at 9:00 AM. Walked to Lift Lobby 4. Had lunch at Central Cafeteria from 1:00 PM to 1:45 PM. Discovered watch missing in Conference Room B at 3:30 PM.",
    checkpoints: [
      { name: "Parking Lot B (Row G3)", time: "9:00 AM", lossProb: "15%", radius: "25 meters", status: "Low Risk - Low footfall" },
      { name: "Lift Lobby 4 / Escalators", time: "9:15 AM", lossProb: "30%", radius: "12 meters", status: "Medium Risk - Heavy transit" },
      { name: "Central Cafeteria", time: "1:00 PM - 1:45 PM", lossProb: "55%", radius: "8 meters", status: "High Risk - Busy lunch hour" }
    ],
    recoveryProbability: 74,
    suggestedActions: [
      "Contact Security Officer Ramesh at the Lobby 4 desk.",
      "Check cafeteria table area where you sat.",
      "Lodge a ticket in the Tech Park Internal Helpdesk."
    ]
  },
  {
    id: "scen-3",
    persona: "Priya Deshmukh (Society Manager)",
    item: "Master Key Ring (5 Keys)",
    triggerText: "Lost Keys in Residential Block",
    inputTimeline: "Inspected Block A elevators at 10:15 AM. Walked through the Children's Playground. Checked the Society Gym Locker Room at 11:30 AM. Discovered keys missing at the Main Gate at 12:00 PM.",
    checkpoints: [
      { name: "Block A Elevator shaft area", time: "10:15 AM", lossProb: "10%", radius: "5 meters", status: "Very Low Risk - Empty" },
      { name: "Children's Playground Park", time: "10:35 AM", lossProb: "50%", radius: "35 meters", status: "High Risk - Open lawn, kids playing" },
      { name: "Society Gym & Locker Area", time: "11:30 AM", lossProb: "40%", radius: "10 meters", status: "Medium Risk - Restricted access" }
    ],
    recoveryProbability: 89,
    suggestedActions: [
      "Inspect the lawn sand-pit near swing set.",
      "Inquire with Gym Instructor on duty.",
      "Broaden search radius to paths connecting Block A and Gym."
    ]
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({
  stats,
  onNavigateToReport,
  onNavigateToFeed
}) => {
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
        persona: "Your Custom Case",
        item: "Your Belongs",
        triggerText: "Custom Reconstruction",
        inputTimeline: customInput,
        checkpoints: [
          { name: "First Point in Description", time: "Approx Start", lossProb: "30%", radius: "20 meters", status: "Potential checkpoint" },
          { name: "Last Known Location", time: "Mid-day Window", lossProb: "60%", radius: "15 meters", status: "Highest Risk Spot" },
          { name: "Location of Discovery", time: "End Window", lossProb: "10%", radius: "10 meters", status: "Lower Risk" }
        ],
        recoveryProbability: 79,
        suggestedActions: [
          "Check the locations you visited during mid-day window.",
          "Inquire immediately with local security/administrators.",
          "Check if anyone reported matching items in the directory."
        ]
      };
      setCustomResult(generatedResult);
      setIsAnalyzing(false);
    }, 1200);
  };

  const currentReconstructData = customResult || activeScenario;

  const faqs = [
    {
      q: "How does LINCO protect my private contact information?",
      a: "LINCO implements full client-side AES-GCM encryption. When you report an item, you choose a 4-digit PIN. Your mobile number is encrypted inside your browser before it is sent to our server. The server never sees or stores your plaintext contact number, only a secure cryptographic hash of your PIN. Unlocking contact details requires entering the correct PIN directly on the claimant's screen."
    },
    {
      q: "What is the Timeline Reconstructor and how does it work?",
      a: "The Timeline Reconstructor is LINCO's flagship AI algorithm. Instead of just static location logging, it analyzes your full description of events chronologically, predicts movement intervals, estimates probable search boundaries, maps physical hotspots with a recovery probability score, and generates a concrete action checklist to guide your search."
    },
    {
      q: "Is there a community network of volunteers?",
      a: "Yes! LINCO encourages community participation. Trusted users can sign up as verified volunteers, help locate lost items reported on campus or in their societies, earn community reward points, and unlock achievements. Active contributions help build safer and tighter community trust networks."
    },
    {
      q: "Can I use voice reporting if I am in a hurry?",
      a: "Absolutely. LINCO has a dedicated Voice Reporting feature. Simply tap the mic icon, speak naturally about what you lost or found and where, and our Gemini-powered engine will parse the raw speech, extract crucial metadata, map categories, and automatically fill out the report form."
    },
    {
      q: "How does the AI smart matching verify true ownership?",
      a: "To prevent fraudulent claims, LINCO uses dynamic smart ownership verification. When a user tries to claim a found item, our Gemini engine generates strict, non-revealing questions based on unique details of the item. Claimants must answer these correctly, and the AI evaluates the response without exposing the original details to prevent guessing."
    }
  ];

  return (
    <div className="space-y-24 select-none overflow-hidden max-w-7xl mx-auto px-4 md:px-6">
      
      {/* 1. PREMIUM HERO SECTION */}
      <section className="relative pt-16 pb-8 text-center overflow-visible">
        {/* Deep luxurious multi-layered gradient backdrop */}
        <div className="absolute inset-x-0 -top-40 max-h-[600px] bg-gradient-to-b from-cyan-500/10 via-violet-500/10 to-transparent blur-[130px] pointer-events-none z-0 opacity-90 animate-pulse" />
        <div className="absolute left-1/2 top-12 -translate-x-1/2 w-[70%] h-[320px] bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-indigo-500/10 rounded-full filter blur-[100px] opacity-70 pointer-events-none z-0" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-[11px] font-extrabold text-emerald-300 uppercase tracking-widest backdrop-blur-xl shadow-lg shadow-slate-950/40 relative overflow-hidden group"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>
            </span>
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-200 bg-clip-text text-transparent">
              Verified Trust Security Network
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-sans font-extrabold tracking-tight text-white leading-[1.08] pr-2"
          >
            Recover What's Lost. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              Built on Local Trust.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-normal"
          >
            India's most secure Lost &amp; Found directory for campuses, offices, and housing blocks. Built on community safety and browser-native encryption.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={onNavigateToReport}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-xs transition-all shadow-xl hover:shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer group"
            >
              Report Lost or Found Item
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onNavigateToFeed}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              Search Active Directory
              <Compass size={14} className="text-slate-400" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. TRUST STRIP */}
      <section className="border-y border-slate-900/80 py-8 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-cyan-400 font-mono text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5">
              <Users size={14} className="text-cyan-400" /> TRUSTED BY CAMPUSES
            </div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Verified environments only</p>
          </div>
          <div className="space-y-1">
            <div className="text-emerald-400 font-mono text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5">
              <Shield size={14} className="text-emerald-400" /> SECURE RECOVERY
            </div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Proof of ownership required</p>
          </div>
          <div className="space-y-1">
            <div className="text-violet-400 font-mono text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5">
              <Lock size={14} className="text-violet-400" /> END-TO-END PRIVACY
            </div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Client-side AES encryption</p>
          </div>
          <div className="space-y-1">
            <div className="text-indigo-400 font-mono text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5">
              <CheckCircle2 size={14} className="text-indigo-400" /> VERIFIED COMMUNITY
            </div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Vouched for by local residents</p>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM STATISTICS */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
            </span>
            <span>Live Platform Pulse</span>
          </div>
          <p className="text-xl font-sans font-extrabold text-slate-100 tracking-tight">Realtime Community Recovery Index</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            {
              value: stats.total,
              label: "Assets Shielded",
              desc: "Total cataloged items",
              color: "text-white",
              badge: "SECURED"
            },
            {
              value: stats.lost,
              label: "Active Searches",
              desc: "Currently seeking items",
              color: "text-rose-400",
              badge: "LIVE SEARCH"
            },
            {
              value: stats.found,
              label: "Safekeeping Logs",
              desc: "Awaiting owner verification",
              color: "text-emerald-400",
              badge: "SECURELY HELD"
            },
            {
              value: `${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 88}%`,
              label: "Recovery Rate",
              desc: "Proven safe return speed",
              color: "text-violet-400",
              badge: "PROVEN RATIO"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900 text-center shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-800/80"
            >
              <div className="absolute top-2 right-2 flex items-center">
                <span className="text-[8px] tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-500 border border-slate-800/50 uppercase">
                  {item.badge}
                </span>
              </div>
              <div className={`text-4xl font-extrabold font-mono tracking-tight ${item.color} mt-2 group-hover:scale-105 transition-transform duration-300`}>
                {item.value}
              </div>
              <p className="text-xs font-bold text-slate-200 mt-2">{item.label}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. FLAGSHIP USP: TIMELINE RECONSTRUCTOR SHOWCASE */}
      <section className="space-y-12 relative py-12 px-6 md:px-8 rounded-3xl bg-gradient-to-b from-slate-950/80 via-slate-900/40 to-slate-950/80 border border-slate-900 shadow-2xl overflow-hidden">
        
        {/* Subtle decorative grid lines and colored ambient circles for centerpiece focus */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="text-center space-y-3 max-w-2xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-300 uppercase tracking-widest shadow-inner">
            <Clock size={11} className="animate-pulse" />
            <span>Premium Community Tech</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-white tracking-tight leading-none">
            AI Timeline Reconstructor
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
            Our state-of-the-art diagnostic engine translates your daily actions into a structured geospatial search perimeter to pinpoint exactly where things went missing.
          </p>
        </div>

        {/* Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* Left Column: Preset Scenarios and Description Input */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
                01. Choose a Scenario Case Study:
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {SCENARIOS.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => {
                      setCustomResult(null);
                      setActiveScenario(scen);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all duration-300 cursor-pointer flex flex-col gap-1.5 ${
                      currentReconstructData.id === scen.id && !customResult
                        ? "bg-slate-900 border-violet-500/80 shadow-lg shadow-violet-950/20"
                        : "bg-slate-950/40 border-slate-900/80 hover:border-slate-800/80 hover:bg-slate-950/80"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-[11px] font-bold ${currentReconstructData.id === scen.id && !customResult ? "text-violet-300" : "text-slate-400"}`}>
                        {scen.triggerText}
                      </span>
                      <span className="text-[8px] font-mono font-bold bg-slate-900/60 text-slate-500 px-2 py-0.5 rounded-full">
                        CONFIDENCE: {scen.recoveryProbability}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal">
                      Target Belonging: {scen.item} ({scen.persona.split(" ")[0]})
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Interactive Sandbox Input */}
            <div className="space-y-3 pt-4 border-t border-slate-900/60">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
                  02. Or Simulate Your Own Sequence:
                </label>
                {customResult && (
                  <button 
                    onClick={() => setCustomResult(null)} 
                    className="text-[9px] text-rose-400 hover:underline cursor-pointer font-bold uppercase tracking-wider"
                  >
                    Reset to Preset
                  </button>
                )}
              </div>
              <div className="relative">
                <textarea
                  rows={3}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g. 'Studied at CCD cafeteria until 12 PM, walked across library quad to Chemistry Lab at 1:30 PM, noticed phone was lost at 3 PM.'"
                  className="w-full text-xs p-4 rounded-2xl bg-slate-950 border border-slate-900 focus:border-violet-500/50 text-slate-200 outline-none transition placeholder:text-slate-600 resize-none font-medium leading-relaxed"
                />
              </div>
              <button
                onClick={handleCustomAnalyze}
                disabled={isAnalyzing || !customInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:hover:from-violet-600 disabled:hover:to-indigo-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-950/20"
              >
                <Sparkles size={13} className={isAnalyzing ? "animate-spin" : ""} />
                {isAnalyzing ? "Reconstructing custom trace..." : "Trace Custom Timeline"}
              </button>
            </div>
          </div>

          {/* Right Column: High-fidelity Live Output Visualizer */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6 lg:border-l lg:border-slate-900 lg:pl-8">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-900">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Geospatial Diagnostic Core</span>
                </div>
                <span className="text-sm font-extrabold text-slate-200">Reconstructed Path: {currentReconstructData.item}</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-md">
                <TrendingUp size={13} />
                <span>Recovery Probability: {currentReconstructData.recoveryProbability}%</span>
              </div>
            </div>

            {/* High-Fidelity Interactive Map & Path Illustration */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-900 relative">
              <div className="h-64 w-full rounded-2xl bg-slate-950 relative overflow-hidden flex items-center justify-center border border-slate-900 shadow-inner">
                
                {/* Simulated Grid Background */}
                <div className="absolute inset-0 bg-dot-grid opacity-[0.15]" />
                
                {/* Sonar scanning concentric rings */}
                <div className="absolute left-[320px] top-[115px] -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-violet-500/10 animate-ping pointer-events-none" />
                <div className="absolute left-[320px] top-[115px] -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-violet-500/20 pointer-events-none" />

                {/* Animated Path Canvas representation */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  {/* Draw dashed lines connecting checkpoints */}
                  <path
                    d="M 80,140 Q 190,50 320,125 T 520,90"
                    fill="none"
                    stroke="url(#pathGradient)"
                    strokeWidth="3"
                    strokeDasharray="6, 6"
                    className="animate-dash"
                  />

                  {/* Pulsing Hotspots (highlighting check-points) */}
                  <circle cx="80" cy="140" r="16" fill="rgba(6, 182, 212, 0.12)" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1" />
                  <circle cx="320" cy="125" r="40" fill="rgba(139, 92, 246, 0.12)" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1" />
                  <circle cx="520" cy="90" r="14" fill="rgba(6, 182, 212, 0.12)" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1" />
                </svg>

                {/* Simulated Markers with Labels */}
                <div className="absolute left-[80px] top-[140px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-[0_0_8px_#06b6d4]" />
                  <span className="text-[8px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 text-slate-400 mt-1.5 font-mono font-bold">CP-01</span>
                </div>

                <div className="absolute left-[320px] top-[125px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-violet-500 border-2 border-slate-950 shadow-[0_0_16px_#8b5cf6] animate-pulse relative z-10 flex items-center justify-center text-[8px] text-white font-black">!</div>
                  <span className="text-[8px] bg-violet-950/90 border border-violet-500/40 text-violet-300 px-2 py-0.5 rounded-md mt-2 font-black tracking-widest shadow-xl uppercase font-sans">
                    Loss Zone ({currentReconstructData.checkpoints[1].lossProb})
                  </span>
                </div>

                <div className="absolute left-[520px] top-[90px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-[0_0_8px_#06b6d4]" />
                  <span className="text-[8px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 text-slate-400 mt-1.5 font-mono font-bold">CP-03</span>
                </div>

                {/* Telemetry info HUD box overlay */}
                <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-900 p-2.5 rounded-xl text-[8px] text-slate-500 font-mono space-y-0.5 select-none pointer-events-none shadow-xl">
                  <div>LAT_RNG: 18.5204° N</div>
                  <div>LNG_RNG: 73.8567° E</div>
                  <div>ALT_ERR: &lt; 2.4 METERS</div>
                  <div className="text-cyan-400 font-bold">STATUS: RADAR_SWEEP_ACTIVE</div>
                </div>
              </div>

              {/* Dynamic Checkpoints Feed */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                {currentReconstructData.checkpoints.map((cp, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-900/60 flex flex-col justify-between hover:border-slate-800 transition duration-300">
                    <div>
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                        <span>Point 0{idx+1}</span>
                        <span className="text-slate-400 font-mono">{cp.time}</span>
                      </div>
                      <h4 className="text-[11px] font-bold text-slate-200 leading-snug line-clamp-2">{cp.name}</h4>
                      <p className="text-[9px] text-slate-500 mt-1 font-medium italic">"{cp.status}"</p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-900/40 flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-semibold">Zone Probability:</span>
                      <span className={`font-mono font-extrabold ${idx === 1 ? "text-violet-400 text-xs" : "text-cyan-400"}`}>{cp.lossProb}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Action Checklist */}
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <CheckCircle2 size={13} className="text-violet-400 animate-pulse" />
                Suggested Physical Action Checklist:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {currentReconstructData.suggestedActions.map((action, i) => (
                  <li key={i} className="text-[11px] p-3 rounded-xl bg-slate-950/50 border border-slate-900/50 text-slate-300 leading-snug flex gap-2.5">
                    <span className="text-violet-400 font-black font-mono">0{i+1}.</span>
                    <span className="font-medium text-slate-300">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 5. HOW LINCO WORKS */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Procedural Architecture</h2>
          <p className="text-2xl font-bold text-slate-200">How LINCO Connects People and Belongings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          
          <div className="p-6 rounded-2xl bg-slate-900/10 border border-slate-900/60 space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold font-mono">
              01
            </div>
            <h3 className="text-base font-bold text-slate-200">1. Publish Secure Report</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Describe what was lost or found. Add details, upload an optional photo, and set a private 4-digit security PIN to encrypt your mobile number directly in your browser.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/10 border border-slate-900/60 space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold font-mono">
              02
            </div>
            <h3 className="text-base font-bold text-slate-200">2. Realtime AI Cross-Matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google Gemini matches descriptions, locations, categories, and times. It highlights possible matches and triggers local notifications to relevant users.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/10 border border-slate-900/60 space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold font-mono">
              03
            </div>
            <h3 className="text-base font-bold text-slate-200">3. Claim &amp; Prove Ownership</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Claimants are tested using dynamic ownership questions generated by AI. Upon success, they enter your 4-digit PIN to decrypt contact details and connect.
            </p>
          </div>
        </div>
      </section>

      {/* 6. CORE FEATURES BENTO GRID */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Platform Capabilities</h2>
          <p className="text-2xl font-bold text-slate-200">High-Fidelity Safeguards for Recovery</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl mx-auto">
          
          {/* PRIMARY FEATURE CARD 1: Voice-Powered AI Reporting (md:col-span-8) */}
          <div className="rounded-3xl bg-slate-900/10 border border-slate-900/80 md:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 relative z-10">
              <div className="sm:col-span-7 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md">
                  <Mic size={18} className="animate-pulse" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-100 font-sans tracking-tight">Voice-Powered AI Reporting</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Tap the microphone and describe your situation naturally. Our AI extracts item attributes, tags, locations, and time-ranges to pre-populate your form in real-time.
                </p>
              </div>

              {/* High-Fidelity Audio Waveform Mockup */}
              <div className="sm:col-span-5 bg-slate-950/60 border border-slate-900/60 p-4 rounded-2xl flex flex-col justify-between space-y-3 font-mono text-[9px] text-slate-500">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900/60">
                  <span className="text-cyan-400 font-bold">SPEECH_INPUT.WAV</span>
                  <span className="text-slate-600">00:04</span>
                </div>
                <div className="flex items-center gap-1 h-8 justify-center py-1">
                  {[3, 7, 5, 8, 4, 9, 6, 8, 5, 3, 7, 4, 6, 8, 3].map((val, index) => (
                    <motion.div
                      key={index}
                      animate={{ height: ["20%", "90%", "20%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.08 }}
                      className="w-[3px] bg-gradient-to-t from-cyan-500 to-violet-500 rounded-full"
                      style={{ height: `${val * 10}%` }}
                    />
                  ))}
                </div>
                <div className="bg-slate-900/40 p-2 rounded-lg text-slate-400 leading-normal border border-slate-900/50">
                  "Found a blue water bottle near tech lounge table 2..."
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900/40">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-900 text-[10px] text-slate-400 font-mono font-semibold">Speech-to-Text</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-900 text-[10px] text-slate-400 font-mono font-semibold">JSON Entity Extraction</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-900 text-[10px] text-slate-400 font-mono font-semibold">Gemini API</span>
            </div>
          </div>

          {/* PRIMARY FEATURE CARD 2: AI Image Recognition (md:col-span-4) */}
          <div className="rounded-3xl bg-slate-900/10 border border-slate-900/80 md:col-span-4 p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-md">
                <Camera size={18} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-slate-100 font-sans tracking-tight">AI Image Recognition</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Snap a photo of any found item to instantly identify objects, brand logos, colors, and physical attributes for streamlined matching.
                </p>
              </div>
            </div>

            {/* Micro vision scanner mockup */}
            <div className="bg-slate-950/60 border border-slate-900/60 p-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-violet-400 animate-scan" />
                <span className="text-lg">🔑</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 space-y-0.5">
                <div className="text-violet-300 font-bold">DETECTION: SUCCESS</div>
                <div>Class: Keyring (99%)</div>
                <div>Tags: Crimson, Leather</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900/40">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-900 text-[10px] text-slate-400 font-mono font-semibold">Vision AI</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-900 text-[10px] text-slate-400 font-mono font-semibold">Metadata Predict</span>
            </div>
          </div>

          {/* SECONDARY FEATURE CARD 3: AES Encryption (md:col-span-4) */}
          <div className="rounded-3xl bg-slate-950/20 border border-slate-900/80 md:col-span-4 p-6 flex flex-col justify-between space-y-6 hover:border-slate-800 transition-all duration-300">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Lock size={16} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-200">Local AES-GCM Privacy</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Contact details are fully encrypted on your local machine using the Web Crypto API before saving. No plaintext number ever touches our databases.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-900 text-[9px] text-slate-500 font-mono">Local Crypt</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-900 text-[9px] text-slate-500 font-mono">AES-GCM-256</span>
            </div>
          </div>

          {/* SECONDARY FEATURE CARD 4: Live Alerts (md:col-span-4) */}
          <div className="rounded-3xl bg-slate-950/20 border border-slate-900/80 md:col-span-4 p-6 flex flex-col justify-between space-y-6 hover:border-slate-800 transition-all duration-300">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-pink-500/5 border border-pink-500/10 flex items-center justify-center text-pink-400">
                <Bell size={16} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-200">Instant Match Alerts</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Receive proactive, real-time match notifications when objects matching your loss parameters are checked into the database anywhere in your local society.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-900 text-[9px] text-slate-500 font-mono">Notifications</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-900 text-[9px] text-slate-500 font-mono">Geo Match</span>
            </div>
          </div>

          {/* SECONDARY FEATURE CARD 5: Geospatial Map (md:col-span-4) */}
          <div className="rounded-3xl bg-slate-950/20 border border-slate-900/80 md:col-span-4 p-6 flex flex-col justify-between space-y-6 hover:border-slate-800 transition-all duration-300">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Map size={16} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-200">Interactive Spatial Map</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Visualize and explore reported lost or found items geographically with precision radius controls and interactive OpenStreetMap markers.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-900 text-[9px] text-slate-500 font-mono">Geospatial</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-900 text-[9px] text-slate-500 font-mono">OpenStreetMap</span>
            </div>
          </div>

        </div>
      </section>

      {/* 7. COMMUNITY IMPACT SECTION */}
      <section className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Community Network</h2>
          <p className="text-2xl font-bold text-slate-200">Citizen Volunteers &amp; Recovery Badges</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/20 border border-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Users size={18} className="text-cyan-400" />
              Verified Volunteer System
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our campus and neighborhood networks are powered by students, residential managers, and civic volunteers who monitor local reports, verify found belongings, and facilitate safe transfers.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-bold font-mono">✓</div>
                <span className="text-slate-300 font-medium">Coordinate with college deans and society offices.</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-bold font-mono">✓</div>
                <span className="text-slate-300 font-medium">Organize search groups for high-value items.</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-bold font-mono">✓</div>
                <span className="text-slate-300 font-medium">Establish physical drop-off kiosks in local lobbies.</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/20 border border-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Award size={18} className="text-violet-400" />
              Honorary Badges &amp; Leaderboard
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Earn community points and unlock achievements for facilitating successful recoveries, helping lost owners, and verifying security checks.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 text-center space-y-1">
                <span className="text-lg">🥇</span>
                <span className="text-[10px] font-bold text-slate-200 block">First Recovery</span>
                <span className="text-[9px] text-slate-500 font-medium">Verify your first found report</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 text-center space-y-1">
                <span className="text-lg">🦸</span>
                <span className="text-[10px] font-bold text-slate-200 block">Community Hero</span>
                <span className="text-[9px] text-slate-500 font-medium">Successfully match 5 items</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 text-center space-y-1">
                <span className="text-lg">🚀</span>
                <span className="text-[10px] font-bold text-slate-200 block">AI Explorer</span>
                <span className="text-[9px] text-slate-500 font-medium">Use Timeline trace tool</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PERSONA TESTIMONIALS */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Real Stories</h2>
          <p className="text-2xl font-bold text-slate-200">Trusted by Real People in Everyday Situations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Persona 1: Rahul */}
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-col justify-between">
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "I lost my ROG gaming laptop at the cafeteria. I was panicked because it contains all my computer engineering semester projects. Within minutes of mapping my timeline on LINCO, the AI predicted library Level 2 desk as the highest loss spot. Sure enough, a student found it there and returned it. Absolute lifesaver!"
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-slate-900 mt-4">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-300 font-bold text-xs">
                RS
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Rahul Sharma</span>
                <span className="text-[9px] text-slate-500 font-medium">Symbiosis Engineering Student</span>
              </div>
            </div>
          </div>

          {/* Persona 2: Ramesh */}
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-col justify-between">
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "As security staff, my register used to be filled with scribbled notes of lost keys and wallets. Now, when a resident drops an item off, I take a photo, let the AI scanner identify it, and publish it instantly. No paperwork, and the owners recover their items in less than 24 hours."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-slate-900 mt-4">
              <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-300 font-bold text-xs">
                RP
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Ramesh Patil</span>
                <span className="text-[9px] text-slate-500 font-medium">Tech Park Security Lead</span>
              </div>
            </div>
          </div>

          {/* Persona 3: Priya */}
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-col justify-between">
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "Our housing society WhatsApp groups were flooded with spam messages about lost items. Integrating LINCO gave us a centralized, secure directory. Our residents love the client-side PIN encryption because they know their contact numbers are never exposed to random spammers. It has improved resident trust immensely."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-slate-900 mt-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-300 font-bold text-xs">
                PD
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Priya Deshmukh</span>
                <span className="text-[9px] text-slate-500 font-medium">Society Manager, Pune Block</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION SECTION */}
      <section className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Support Portal</h2>
          <p className="text-2xl font-bold text-slate-200">Frequently Answered Queries</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-slate-900/80 rounded-2xl bg-slate-950/40 overflow-hidden">
              <button
                onClick={() => setOpenFAQ(openFaq === i ? null : i)}
                className="w-full p-5 text-left flex justify-between items-center text-slate-200 hover:text-white transition cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-semibold pr-4">{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-slate-900/20"
                  >
                    <div className="p-5 pt-0 text-xs text-slate-400 leading-relaxed border-t border-slate-900/40">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
