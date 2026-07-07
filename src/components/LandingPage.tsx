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
  Compass,
  Search,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  onNavigateToFeed,
  onNavigateToMatches,
  onOpenNotifications,
  onFocusAIAssistant
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
      a: "We keep your personal information completely hidden and isolated. When you report an item, you choose a 4-digit PIN. Your mobile number is shielded from the public feed and is only revealed to a verified claimant when they successfully pass your security check. Our platform is built on data minimization, meaning we don't store plain contact digits for public crawlers to see."
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
    <div className="space-y-24 select-none overflow-hidden max-w-5xl mx-auto px-4 md:px-6 w-full">
      
      {/* 1. PREMIUM HERO SECTION */}
      <section className="relative pt-28 pb-20 text-center overflow-visible">
        {/* Deep luxurious multi-layered gradient backdrop */}
        <div className="absolute inset-x-0 -top-40 max-h-[600px] bg-gradient-to-b from-indigo-500/5 via-cyan-500/5 to-transparent blur-[130px] pointer-events-none z-0 opacity-90 animate-pulse" />
        <div className="absolute left-1/2 top-12 -translate-x-1/2 w-[70%] h-[320px] bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-cyan-500/10 rounded-full filter blur-[100px] opacity-70 pointer-events-none z-0" />
        
        <div className="relative z-10 max-w-5xl mx-auto space-y-8 px-4">
          {/* Brand & Tagline Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-3"
          >
            <h2 className="text-sm font-black tracking-[0.3em] text-slate-100 font-sans uppercase">
              LINCO
            </h2>
            <p className="text-[10px] md:text-xs font-mono font-bold text-indigo-400 uppercase tracking-[0.2em] max-w-md mx-auto">
              Locate &bull; Identify &bull; Notify &bull; Connect &bull; Owner
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[clamp(2.5rem,6.5vw,4.5rem)] font-sans font-extrabold tracking-tight text-white leading-[1.1]"
          >
            Your identity stays private. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Your item doesn't.
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-4 max-w-2xl mx-auto"
          >
            <p className="text-slate-200 text-sm md:text-lg font-medium tracking-tight">
              Never lose what matters. <br className="sm:hidden" />
              <span className="text-slate-400">Powered by people. Protected by AI.</span>
            </p>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-xl mx-auto">
              Report a lost or found item in under one minute while your identity remains private until ownership is verified.
            </p>
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => onNavigateToReport()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all duration-300 shadow-xl shadow-indigo-950/20 flex items-center justify-center gap-2 cursor-pointer group active:scale-95"
            >
              Start Report
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onNavigateToFeed}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#12121a] border border-[#1c1c26] hover:bg-[#1a1a26] text-slate-200 font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              Browse Community Feed
              <Compass size={14} className="text-slate-400 animate-spin" style={{ animationDuration: '60s' }} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. PREMIUM TRUST SECTION */}
      <section className="relative py-16 bg-[#07070a]/30 border-y border-[#161621] overflow-hidden w-full max-w-5xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 relative z-10 space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
              🛡️ Trusted by Design
            </h3>
            
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-sans font-extrabold text-white leading-tight">
                Your identity stays private.
              </p>
              <p className="text-2xl md:text-3xl font-sans font-extrabold text-slate-400 leading-tight">
                Your item doesn't.
              </p>
            </div>

            <p className="text-xs md:text-sm text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
              Trusted by communities. Powered by AI. Built for everyone.
            </p>
          </div>

          {/* Asymmetric Grid of Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Private by Default",
                desc: "Your contact details are kept strictly private and anonymous until a matched claim is successfully verified."
              },
              {
                title: "Verified Claims",
                desc: "Owner validation uses dynamic, non-revealing questions generated by smart AI to block unauthorized claims."
              },
              {
                title: "AI-Assisted Matching",
                desc: "Deep correlation matching finds exact similarities between lost reports and found logs instantly."
              },
              {
                title: "Secure Communication",
                desc: "Direct coordination is enabled only after local security PIN validation to keep conversations protected."
              }
            ].map((indicator, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-[#030304]/60 border border-[#161621] space-y-3 hover:border-[#1c1c26] hover:bg-[#07070a]/60 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-extrabold text-sm">✓</span>
                  <h4 className="text-xs font-bold text-slate-200 tracking-wide font-sans">{indicator.title}</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  {indicator.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Operational Status Badge */}
          <div className="flex justify-center pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase shadow-md shadow-emerald-950/10">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>Operational &bull; All Systems Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 PREMIUM CONTROL CENTER */}
      <section className="space-y-8 py-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-cyan-500/5 to-transparent blur-[80px] pointer-events-none" />
        
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#09090c] border border-[#1c1c26] text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            <span className="relative flex h-1.5 w-1.5">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"></span>
            </span>
            <span>LINCO Control Center</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-sans font-extrabold text-white tracking-tight">
            How can we help you today?
          </h2>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-normal">
            Quick-start portals to secure your belongings, verify smart similarity matches, and connect with local keepers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-5 max-w-5xl mx-auto">
          {/* Card 1: Report Lost Item */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={() => onNavigateToReport("Lost")}
            className="md:col-span-3 p-6 rounded-3xl bg-gradient-to-br from-[#140a0e] via-[#090507] to-[#07070a] border border-rose-950/30 hover:border-rose-500/30 text-left cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-lg shadow-rose-950/5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 text-rose-400 group-hover:scale-110 transition-transform">
              <Search size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-rose-400 transition-colors mb-2 flex items-center gap-2">
              Report Lost Item
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium mb-4">
              Lost a laptop, wallet, key, or device? Create a private search listing to notify your community.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/15 uppercase tracking-wide">
                Start Search
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                Private
              </span>
            </div>
          </motion.div>

          {/* Card 2: Report Found Item */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={() => onNavigateToReport("Found")}
            className="md:col-span-3 p-6 rounded-3xl bg-gradient-to-br from-[#06100c] via-[#030806] to-[#07070a] border border-emerald-950/30 hover:border-emerald-500/30 text-left cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-lg shadow-emerald-950/5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-2 flex items-center gap-2">
              Report Found Item
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium mb-4">
              Found keys, luggage, or accessories on campus? Hand it over safely and list descriptions for owners.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/15 uppercase tracking-wide">
                Safe Handover
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                Verify claimants
              </span>
            </div>
          </motion.div>

          {/* Card 3: View Smart Matches */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={onNavigateToMatches}
            className="md:col-span-2 p-5 rounded-3xl bg-[#09090c] border border-[#161621] hover:border-indigo-500/30 text-left cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10" />
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
              <Sparkles size={16} />
            </div>
            <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors mb-1.5 flex items-center gap-1.5">
              Smart Matches
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium mb-4">
              Instantly discover possible matching items found nearby, powered by smart AI.
            </p>
            <span className="text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/15 uppercase tracking-wide">
              AI Powered
            </span>
          </motion.div>

          {/* Card 4: Notification Alerts */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={onOpenNotifications}
            className="md:col-span-2 p-5 rounded-3xl bg-[#09090c] border border-[#161621] hover:border-amber-500/30 text-left cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10" />
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400 group-hover:scale-110 transition-transform">
              <Bell size={16} />
            </div>
            <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors mb-1.5">
              Notification Center
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium mb-4">
              Get real-time updates on your active claims, messages, and matches.
            </p>
            <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/15 uppercase tracking-wide">
              Live Alerts
            </span>
          </motion.div>

          {/* Card 5: AI Assistant */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={onFocusAIAssistant}
            className="md:col-span-2 p-5 rounded-3xl bg-[#09090c] border border-[#161621] hover:border-cyan-500/30 text-left cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/10" />
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
              <Bot size={16} />
            </div>
            <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors mb-1.5 flex items-center gap-1.5">
              LINCO AI Assistant
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium mb-4">
              Talk directly with Linco Sathi to generate timelines, log locations, or auto-fill filings.
            </p>
            <span className="text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/15 uppercase tracking-wide animate-pulse">
              Ask Sathi
            </span>
          </motion.div>
        </div>
      </section>

      {/* 3. PLATFORM STATISTICS */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#09090c] border border-[#1c1c26] text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"></span>
            </span>
            <span>Platform Pulse</span>
          </div>
          <p className="text-2xl md:text-3xl font-sans font-extrabold text-slate-100 tracking-tight">Active community recovery counter</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            {
              value: stats.total,
              label: "Assets cataloged",
              desc: "Total listings verified",
              color: "text-white",
              badge: "SECURED"
            },
            {
              value: stats.lost,
              label: "Active searches",
              desc: "Seeking missing objects",
              color: "text-rose-400",
              badge: "ACTIVE SEARCH"
            },
            {
              value: stats.found,
              label: "Safekeeping logs",
              desc: "Awaiting safe returns",
              color: "text-emerald-400",
              badge: "SAFEGUARDED"
            },
            {
              value: `${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 88}%`,
              label: "Recovery rate",
              desc: "Proven safe return speed",
              color: "text-indigo-400",
              badge: "SUCCESS RATE"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="p-6 rounded-2xl bg-[#07070a]/80 border border-[#161621] text-center shadow-[0_12px_24px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden group hover:border-[#222230] transition duration-300"
            >
              <div className="absolute top-3 right-3 flex items-center">
                <span className="text-[8px] tracking-wider font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#030304]/80 text-[#5a5d85] border border-[#161621] uppercase">
                  {item.badge}
                </span>
              </div>
              <div className={`text-3.5xl font-black font-mono tracking-tight ${item.color} mt-3 group-hover:scale-105 transition-transform duration-300`}>
                {item.value}
              </div>
              <p className="text-xs font-bold text-slate-100 mt-2.5">{item.label}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. FLAGSHIP USP: TIMELINE RECONSTRUCTOR SHOWCASE */}
      <section className="space-y-16 relative py-16 px-6 md:px-8 rounded-[32px] bg-[#07070a]/80 border border-[#1c1c26] shadow-2xl overflow-hidden w-full max-w-5xl mx-auto">
        
        {/* Subtle decorative grid lines and colored ambient circles for centerpiece focus */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="text-center space-y-3 max-w-2xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest shadow-inner">
            <Clock size={11} className="animate-pulse" />
            <span>Community search tool</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-white tracking-tight leading-none">
            Timeline Reconstructor
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
            Translate your daily sequence of events into a travel path, mapping key areas to simplify physical search efforts.
          </p>
        </div>

        {/* Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          
          {/* Left Column: Preset Scenarios and Description Input */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                01. CHOOSE A SCENARIO:
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {SCENARIOS.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => {
                      setCustomResult(null);
                      setActiveScenario(scen);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all duration-300 cursor-pointer flex flex-col gap-1.5 active:scale-[0.98] ${
                      currentReconstructData.id === scen.id && !customResult
                        ? "bg-[#12121a] border-indigo-500/60 shadow-lg shadow-indigo-950/20"
                        : "bg-[#030304]/80 border-[#161621] hover:border-[#222230] hover:bg-[#09090d]/80"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-[11px] font-bold ${currentReconstructData.id === scen.id && !customResult ? "text-indigo-400" : "text-slate-400"}`}>
                        {scen.triggerText}
                      </span>
                      <span className="text-[8px] font-mono font-bold bg-[#030304] text-slate-500 px-2.5 py-0.5 rounded-full border border-[#161621]">
                        CONFIDENCE: {scen.recoveryProbability}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal font-medium">
                      Target Belonging: {scen.item} ({scen.persona.split(" ")[0]})
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Interactive Sandbox Input */}
            <div className="space-y-3 pt-4 border-t border-[#161621]">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                  02. DESCRIBE WHAT HAPPENED:
                </label>
                {customResult && (
                  <button 
                    onClick={() => setCustomResult(null)} 
                    className="text-[9px] text-rose-400 hover:underline cursor-pointer font-mono font-bold uppercase tracking-wider"
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
                  className="w-full text-xs p-4 rounded-xl bg-[#030304] border border-[#1c1c26] focus:border-indigo-500/60 text-slate-200 outline-none transition placeholder:text-slate-600 resize-none font-medium leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                />
              </div>
              <button
                onClick={handleCustomAnalyze}
                disabled={isAnalyzing || !customInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/20 active:scale-95"
              >
                <Sparkles size={13} className={isAnalyzing ? "animate-spin" : ""} />
                {isAnalyzing ? "Reconstructing path..." : "Map Search Path"}
              </button>
            </div>
          </div>

          {/* Right Column: High-fidelity Live Output Visualizer */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6 lg:border-l lg:border-[#1c1c26] lg:pl-8">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#161621]">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Smart Path Mapping</span>
                </div>
                <span className="text-sm font-extrabold text-slate-200">Reconstructed Path: {currentReconstructData.item}</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md">
                <TrendingUp size={13} />
                <span>Recovery Probability: {currentReconstructData.recoveryProbability}%</span>
              </div>
            </div>

            {/* High-Fidelity Interactive Map & Path Illustration */}
            <div className="p-4 rounded-2xl bg-[#030304]/60 border border-[#161621] relative">
              <div className="h-64 w-full rounded-2xl bg-[#030304] relative overflow-hidden flex items-center justify-center border border-[#1c1c26] shadow-inner">
                
                {/* Simulated Grid Background */}
                <div className="absolute inset-0 bg-dot-grid opacity-[0.15]" />
                
                {/* Sonar scanning concentric rings */}
                <div className="absolute left-[320px] top-[115px] -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-indigo-500/10 animate-ping pointer-events-none" />
                <div className="absolute left-[320px] top-[115px] -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-indigo-500/20 pointer-events-none" />

                {/* Animated Path Canvas representation */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
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
                  <circle cx="320" cy="125" r="40" fill="rgba(99, 102, 241, 0.12)" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="1" />
                  <circle cx="520" cy="90" r="14" fill="rgba(6, 182, 212, 0.12)" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1" />
                </svg>

                {/* Simulated Markers with Labels */}
                <div className="absolute left-[80px] top-[140px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-[#030304] shadow-[0_0_8px_#06b6d4]" />
                  <span className="text-[8px] bg-[#030304] px-1.5 py-0.5 rounded border border-[#161621] text-slate-500 mt-1.5 font-mono font-bold">CP-01</span>
                </div>

                <div className="absolute left-[320px] top-[125px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-[#030304] shadow-[0_0_16px_#6366f1] animate-pulse relative z-10 flex items-center justify-center text-[8px] text-white font-black">!</div>
                  <span className="text-[8px] bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded-md mt-2 font-black tracking-widest shadow-xl uppercase font-mono">
                    Loss Zone ({currentReconstructData.checkpoints[1].lossProb})
                  </span>
                </div>

                <div className="absolute left-[520px] top-[90px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-[#030304] shadow-[0_0_8px_#06b6d4]" />
                  <span className="text-[8px] bg-[#030304] px-1.5 py-0.5 rounded border border-[#161621] text-slate-500 mt-1.5 font-mono font-bold">CP-03</span>
                </div>

                {/* Genuine Legend overlay */}
                <div className="absolute bottom-3 left-3 bg-[#07070a]/95 border border-[#161621] p-2.5 rounded-xl text-[9px] text-slate-400 font-sans space-y-1 select-none pointer-events-none shadow-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#06b6d4]" />
                    <span>Estimated Checkpoint</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_4px_#6366f1]" />
                    <span>Likely Search Area</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Checkpoints Feed */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                {currentReconstructData.checkpoints.map((cp, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#030304]/90 border border-[#161621] flex flex-col justify-between hover:border-[#222230] transition duration-300">
                    <div>
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider mb-1.5">
                        <span>Point 0{idx+1}</span>
                        <span className="text-slate-400 font-mono">{cp.time}</span>
                      </div>
                      <h4 className="text-[11px] font-bold text-slate-200 leading-snug line-clamp-2">{cp.name}</h4>
                      <p className="text-[9px] text-slate-500 mt-1 font-mono italic">"{cp.status}"</p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#161621] flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-semibold font-mono">Zone Prob:</span>
                      <span className={`font-mono font-extrabold ${idx === 1 ? "text-indigo-400 text-xs" : "text-cyan-400"}`}>{cp.lossProb}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Action Checklist */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-indigo-400 animate-pulse" />
                SUGGESTED SEARCH STEPS:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {currentReconstructData.suggestedActions.map((action, i) => (
                  <li key={i} className="text-[11px] p-3 rounded-xl bg-[#030304]/60 border border-[#161621] text-slate-300 leading-snug flex gap-2.5">
                    <span className="text-indigo-400 font-black font-mono">0{i+1}.</span>
                    <span className="font-medium text-slate-300">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 5. HOW LINCO WORKS */}
      <section className="space-y-16 w-full max-w-5xl mx-auto">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Simplicity first</h2>
          <p className="text-3xl md:text-4xl font-sans font-extrabold text-white tracking-tight">How it works</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          
          <div className="p-6 sm:p-8 rounded-[24px] bg-[#07070a]/60 border border-[#161621] space-y-4 relative shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-[#222230] transition duration-300">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold font-mono">
              01
            </div>
            <h3 className="text-base font-bold text-slate-200">1. Publish Secure Report</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Describe what was lost or found. Add details, upload an optional photo, and set a private 4-digit PIN to keep your contact number safe.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-[24px] bg-[#07070a]/60 border border-[#161621] space-y-4 relative shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-[#222230] transition duration-300">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold font-mono">
              02
            </div>
            <h3 className="text-base font-bold text-slate-200">2. Smart Cross-Matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Our smart matching matches descriptions, locations, and details to find matching items and trigger local alerts immediately.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-[24px] bg-[#07070a]/60 border border-[#161621] space-y-4 relative shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-[#222230] transition duration-300">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold font-mono">
              03
            </div>
            <h3 className="text-base font-bold text-slate-200">3. Secure Handover</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Claimants verify their ownership using smart questions. They unlock your contact info with your 4-digit PIN to coordinate a safe return.
            </p>
          </div>
        </div>
      </section>

      {/* 6. CORE FEATURES BENTO GRID */}
      <section className="space-y-16 w-full max-w-5xl mx-auto">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Intelligent design</h2>
          <p className="text-3xl md:text-4xl font-sans font-extrabold text-white tracking-tight">Built for safe, swift recovery.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-5xl mx-auto">
          
          {/* PRIMARY FEATURE CARD 1: Voice-Powered AI Reporting (md:col-span-8) */}
          <div className="rounded-3xl bg-[#07070a]/60 border border-[#161621] md:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-[#222230] transition-all duration-300 shadow-[0_12px_24px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 relative z-10">
              <div className="sm:col-span-7 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-md">
                  <Mic size={18} className="animate-pulse" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-100 font-sans tracking-tight">Voice-Powered Reporting</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Tap the microphone and describe your situation naturally. Our AI extracts item attributes, tags, locations, and time-ranges to pre-populate your form in real-time.
                </p>
              </div>

              {/* High-Fidelity Audio Waveform Mockup */}
              <div className="sm:col-span-5 bg-[#030304]/80 border border-[#1c1c26] p-4 rounded-2xl flex flex-col justify-between space-y-3 font-mono text-[9px] text-slate-500">
                <div className="flex justify-between items-center pb-2 border-b border-[#161621]">
                  <span className="text-indigo-400 font-bold">Audio Recording</span>
                  <span className="text-slate-600">00:04</span>
                </div>
                <div className="flex items-center gap-1 h-8 justify-center py-1">
                  {[3, 7, 5, 8, 4, 9, 6, 8, 5, 3, 7, 4, 6, 8, 3].map((val, index) => (
                    <motion.div
                      key={index}
                      animate={{ height: ["20%", "90%", "20%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.08 }}
                      className="w-[3px] bg-gradient-to-t from-indigo-500 to-cyan-500 rounded-full"
                      style={{ height: `${val * 10}%` }}
                    />
                  ))}
                </div>
                <div className="bg-[#12121a] p-2 rounded-lg text-slate-400 leading-normal border border-[#1c1c26]">
                  "Found a blue water bottle near tech lounge table 2..."
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#161621]">
              <span className="px-2.5 py-1 rounded-lg bg-[#030304] border border-[#161621] text-[10px] text-slate-400 font-mono font-semibold">Voice Assist</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#030304] border border-[#161621] text-[10px] text-slate-400 font-mono font-semibold">Smart Fill</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#030304] border border-[#161621] text-[10px] text-slate-400 font-mono font-semibold">Auto Parsing</span>
            </div>
          </div>

          {/* PRIMARY FEATURE CARD 2: AI Image Recognition (md:col-span-4) */}
          <div className="rounded-3xl bg-[#07070a]/60 border border-[#161621] md:col-span-4 p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-[#222230] transition-all duration-300 shadow-[0_12px_24px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-md">
                <Camera size={18} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-slate-100 font-sans tracking-tight">Photo Match Verification</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Snap a photo of any found item to instantly identify objects, brand logos, colors, and physical attributes for streamlined matching.
                </p>
              </div>
            </div>

            {/* Micro vision scanner mockup */}
            <div className="bg-[#030304]/80 border border-[#1c1c26] p-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#12121a] border border-[#1c1c26] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-indigo-400 animate-scan" />
                <span className="text-lg">🔑</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 space-y-0.5">
                <div className="text-indigo-400 font-bold">DETECTION: SUCCESS</div>
                <div>Class: Keyring (99%)</div>
                <div>Tags: Crimson, Leather</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#161621]">
              <span className="px-2.5 py-1 rounded-lg bg-[#030304] border border-[#161621] text-[10px] text-slate-400 font-mono font-semibold">Photo Scanner</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#030304] border border-[#161621] text-[10px] text-slate-400 font-mono font-semibold">Auto Tagging</span>
            </div>
          </div>

          {/* SECONDARY FEATURE CARD 3: Private Contact Safeguards (md:col-span-4) */}
          <div className="rounded-3xl bg-[#07070a]/60 border border-[#161621] md:col-span-4 p-6 flex flex-col justify-between space-y-6 hover:border-[#222230] transition-all duration-300 shadow-[0_12px_24px_rgba(0,0,0,0.4)]">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Lock size={16} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-200">Secure Local Privacy</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Your contact details are encrypted directly in your browser before they are sent to our server, keeping your number private until a match is confirmed.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#030304] border border-[#1c1c26] text-[9px] text-slate-500 font-mono">Private</span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#030304] border border-[#1c1c26] text-[9px] text-slate-500 font-mono">Safe</span>
            </div>
          </div>

          {/* SECONDARY FEATURE CARD 4: Live Alerts (md:col-span-4) */}
          <div className="rounded-3xl bg-[#07070a]/60 border border-[#161621] md:col-span-4 p-6 flex flex-col justify-between space-y-6 hover:border-[#222230] transition-all duration-300 shadow-[0_12px_24px_rgba(0,0,0,0.4)]">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Bell size={16} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-200">Instant Match Alerts</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Receive proactive, real-time match notifications when objects matching your loss parameters are checked into the database anywhere in your local society.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#030304] border border-[#1c1c26] text-[9px] text-slate-500 font-mono">Instant Alert</span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#030304] border border-[#1c1c26] text-[9px] text-slate-500 font-mono">Nearby Match</span>
            </div>
          </div>

          {/* SECONDARY FEATURE CARD 5: Geospatial Map (md:col-span-4) */}
          <div className="rounded-3xl bg-[#07070a]/60 border border-[#161621] md:col-span-4 p-6 flex flex-col justify-between space-y-6 hover:border-[#222230] transition-all duration-300 shadow-[0_12px_24px_rgba(0,0,0,0.4)]">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Map size={16} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-200">Interactive Area Map</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                See reported lost or found items on a clean map with precision area highlights to track reported sightings easily.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#030304] border border-[#1c1c26] text-[9px] text-slate-500 font-mono">Map View</span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#030304] border border-[#1c1c26] text-[9px] text-slate-500 font-mono">Local Areas</span>
            </div>
          </div>

        </div>
      </section>

      {/* 7. COMMUNITY IMPACT SECTION */}
      <section className="space-y-16 max-w-5xl mx-auto w-full">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">A collective effort</h2>
          <p className="text-3xl md:text-4xl font-sans font-extrabold text-white tracking-tight">Powered by your community.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#07070a]/60 border border-[#161621] space-y-4 shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Users size={18} className="text-indigo-400" />
              Verified Volunteer System
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Our campus and neighborhood networks are powered by students, residential managers, and civic volunteers who monitor local reports, verify found belongings, and facilitate safe transfers.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold font-mono">✓</div>
                <span className="text-slate-300 font-medium">Coordinate with college deans and society offices.</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold font-mono">✓</div>
                <span className="text-slate-300 font-medium">Organize search groups for high-value items.</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold font-mono">✓</div>
                <span className="text-slate-300 font-medium">Establish physical drop-off kiosks in local lobbies.</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#07070a]/60 border border-[#161621] space-y-4 shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Award size={18} className="text-indigo-400" />
              Honorary Badges &amp; Leaderboard
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Earn community points and unlock achievements for facilitating successful recoveries, helping lost owners, and verifying security checks.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#030304] border border-[#161621] text-center space-y-1">
                <span className="text-lg">🥇</span>
                <span className="text-[10px] font-bold text-slate-200 block">First Recovery</span>
                <span className="text-[9px] text-slate-500 font-mono font-medium">Verify your first found report</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#030304] border border-[#161621] text-center space-y-1">
                <span className="text-lg">🦸</span>
                <span className="text-[10px] font-bold text-slate-200 block">Community Hero</span>
                <span className="text-[9px] text-slate-500 font-mono font-medium">Successfully match 5 items</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#030304] border border-[#161621] text-center space-y-1">
                <span className="text-lg">🚀</span>
                <span className="text-[10px] font-bold text-slate-200 block">AI Explorer</span>
                <span className="text-[9px] text-slate-500 font-mono font-medium">Use Timeline trace tool</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PERSONA TESTIMONIALS */}
      <section className="space-y-16 w-full max-w-5xl mx-auto">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Real experiences</h2>
          <p className="text-3xl md:text-4xl font-sans font-extrabold text-white tracking-tight">Stories from our community</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Persona 1: Rahul */}
          <div className="p-6 rounded-2xl bg-[#07070a]/60 border border-[#161621] flex flex-col justify-between shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
            <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
              "I lost my ROG gaming laptop at the cafeteria. I was panicked because it contains all my computer engineering semester projects. Within minutes of mapping my timeline on LINCO, the AI predicted library Level 2 desk as the highest loss spot. Sure enough, a student found it there and returned it. Absolute lifesaver!"
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-[#161621] mt-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-300 font-bold text-xs">
                RS
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Rahul Sharma</span>
                <span className="text-[9px] text-slate-500 font-mono font-medium">Symbiosis Engineering Student</span>
              </div>
            </div>
          </div>

          {/* Persona 2: Ramesh */}
          <div className="p-6 rounded-2xl bg-[#07070a]/60 border border-[#161621] flex flex-col justify-between shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
            <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
              "As security staff, my register used to be filled with scribbled notes of lost keys and wallets. Now, when a resident drops an item off, I take a photo, let the AI scanner identify it, and publish it instantly. No paperwork, and the owners recover their items in less than 24 hours."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-[#161621] mt-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-300 font-bold text-xs">
                RP
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Ramesh Patil</span>
                <span className="text-[9px] text-slate-500 font-mono font-medium">Tech Park Security Lead</span>
              </div>
            </div>
          </div>

          {/* Persona 3: Priya */}
          <div className="p-6 rounded-2xl bg-[#07070a]/60 border border-[#161621] flex flex-col justify-between shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
            <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
              "Our housing society WhatsApp groups were flooded with spam messages about lost items. Integrating LINCO gave us a centralized, secure directory. Our residents love the client-side PIN encryption because they know their contact numbers are never exposed to random spammers. It has improved resident trust immensely."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-[#161621] mt-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-300 font-bold text-xs">
                PD
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Priya Deshmukh</span>
                <span className="text-[9px] text-slate-500 font-mono font-medium">Society Manager, Pune Block</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION SECTION */}
      <section className="space-y-12 max-w-3xl mx-auto">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Have questions?</h2>
          <p className="text-3xl md:text-4xl font-sans font-extrabold text-white tracking-tight">Common questions</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-[#161621] rounded-2xl bg-[#07070a]/60 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-[#222230] transition duration-300">
              <button
                onClick={() => setOpenFAQ(openFaq === i ? null : i)}
                className="w-full p-5 text-left flex justify-between items-center text-slate-200 hover:text-white transition cursor-pointer"
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
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-[#030304]/40"
                  >
                    <div className="p-5 pt-0 text-xs text-slate-400 leading-relaxed border-t border-[#161621]">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 10. PREMIUM FOOTER */}
      <footer className="pt-24 pb-8 border-t border-[#161621] mt-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white font-mono">LINCO</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#12121a] border border-[#1c1c26] text-indigo-400 font-bold uppercase tracking-wider">
                V2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm font-medium">
              A private, simple, and community-driven path mapping and item recovery network.
            </p>
            <div className="text-[10px] text-slate-500 font-mono font-medium">
              "Your identity stays private. Your item doesn't."
            </div>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                Product
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={onNavigateToFeed} className="text-slate-500 hover:text-slate-300 font-medium transition text-left cursor-pointer">
                    Recover Feed
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigateToReport()} className="text-slate-500 hover:text-slate-300 font-medium transition text-left cursor-pointer">
                    Report Lost / Found
                  </button>
                </li>
                <li>
                  <span className="text-slate-600 font-medium select-none">
                    Timeline Reconstructor
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                Resources
              </span>
              <ul className="space-y-2 text-xs font-medium">
                <li><span className="text-slate-500">Community Guidelines</span></li>
                <li><span className="text-slate-500">Privacy Standards</span></li>
                <li><span className="text-slate-500">Support Center</span></li>
              </ul>
            </div>

            <div className="space-y-4 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                Network Status
              </span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-400">All systems operational</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#161621] flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500 font-medium">
          <div>
            &copy; {new Date().getFullYear()} LINCO. Built for safe, swift community returns.
          </div>
          <div className="flex gap-6">
            <span className="hover:text-slate-300 cursor-pointer transition">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer transition">Privacy Policy</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
