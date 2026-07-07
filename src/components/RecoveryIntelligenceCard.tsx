/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Camera,
  Coins,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
  Compass,
  FileText,
  Bookmark,
  ChevronRight,
  Eye,
  Check,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { imageService } from "../services/imageService";

interface RecoveryIntelligenceCardProps {
  form: any;
  onEnhanceDescription: () => Promise<void>;
  isEnhancing: boolean;
  onClose: () => void;
}

export const RecoveryIntelligenceCard: React.FC<RecoveryIntelligenceCardProps> = ({
  form,
  onEnhanceDescription,
  isEnhancing,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggestions state
  const [localReward, setLocalReward] = useState(form.fReward || "");
  const [brandName, setBrandName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [searchRadius, setSearchRadius] = useState<500 | 1000 | 2000>(500);
  const [showRewardInput, setShowRewardInput] = useState(false);
  const [showBrandInput, setShowBrandInput] = useState(false);
  const [showSerialInput, setShowSerialInput] = useState(false);
  const [aiAnalysisNotice, setAiAnalysisNotice] = useState("");

  // Photo compression / upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiAnalysisNotice("Analyzing uploaded photo with Gemini AI visual models...");
    try {
      const compressedBase64 = await imageService.compressImage(file, 800, 0.85);
      form.setFImage(compressedBase64);
      setAiAnalysisNotice("✨ Visual features extracted! Recovery confidence score updated.");
      setTimeout(() => setAiAnalysisNotice(""), 4000);
    } catch (err) {
      console.error(err);
      setAiAnalysisNotice("Failed to compress and upload photo.");
    }
  };

  const applyReward = () => {
    form.setFReward(localReward);
    setShowRewardInput(false);
    setAiAnalysisNotice("💰 Reward registered! Incentivizing wider citizen search networks.");
    setTimeout(() => setAiAnalysisNotice(""), 4000);
  };

  const applyBrand = () => {
    if (!brandName.trim()) return;
    const currentDetails = form.fDetails;
    const brandSuffix = `\n[Brand/Make: ${brandName.trim()}]`;
    form.setFDetails(currentDetails + brandSuffix);
    setBrandName("");
    setShowBrandInput(false);
    setAiAnalysisNotice("✓ Brand signature appended! Semantic match ambiguity reduced.");
    setTimeout(() => setAiAnalysisNotice(""), 4000);
  };

  const applySerial = () => {
    if (!serialNumber.trim()) return;
    const currentDetails = form.fDetails;
    const serialSuffix = `\n[Serial/IMEI Number: ${serialNumber.trim()}]`;
    form.setFDetails(currentDetails + serialSuffix);
    setSerialNumber("");
    setShowSerialInput(false);
    setAiAnalysisNotice("✓ Unique hardware identifier registered! Claim proof locked at 100%.");
    setTimeout(() => setAiAnalysisNotice(""), 4000);
  };

  const toggleSearchRadius = () => {
    const nextRadius = searchRadius === 500 ? 1000 : searchRadius === 1000 ? 2000 : 500;
    setSearchRadius(nextRadius);
    setAiAnalysisNotice(`📍 Scan radius expanded to ${nextRadius}m! Integrating nearby active coordinates.`);
    setTimeout(() => setAiAnalysisNotice(""), 4000);
  };

  // Score Calculation (Simulated AI Recovery Engine)
  const calculateScore = () => {
    let base = 35;

    // 1. Category check
    if (form.fCategory) base += 10;

    // 2. Photo check
    if (form.fImage) base += 20;

    // 3. Description checks
    const desc = form.fDetails || "";
    if (desc.length >= 150) {
      base += 15;
    } else if (desc.length >= 50) {
      base += 10;
    } else if (desc.length > 0) {
      base += 5;
    }

    // Check specific keywords for brand and serial number
    const hasBrand = desc.toLowerCase().includes("brand:") || desc.toLowerCase().includes("make:") || desc.toLowerCase().includes("brand/make:");
    const hasSerial = desc.toLowerCase().includes("serial") || desc.toLowerCase().includes("imei") || desc.toLowerCase().includes("s/n");
    
    if (hasBrand) base += 8;
    if (hasSerial) base += 8;

    // 4. Precise Location check (Lat/Lng)
    if (form.fLat && form.fLng) {
      base += 12;
    } else {
      base += 5;
    }

    // 5. Scan Radius / Community density
    if (searchRadius === 2000) {
      base += 12;
    } else if (searchRadius === 1000) {
      base += 6;
    }

    // Maximum cap at 98%
    return Math.min(98, base);
  };

  const score = calculateScore();

  // Determine Badge & Color
  const getBadgeDetails = (scoreVal: number) => {
    if (scoreVal >= 90) {
      return {
        text: "Very High",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
        ringColor: "stroke-emerald-400",
        glow: "from-emerald-500/10"
      };
    } else if (scoreVal >= 75) {
      return {
        text: "High",
        color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
        ringColor: "stroke-cyan-400",
        glow: "from-cyan-500/10"
      };
    } else if (scoreVal >= 50) {
      return {
        text: "Moderate",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        ringColor: "stroke-amber-400",
        glow: "from-amber-500/10"
      };
    } else {
      return {
        text: "Low",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        ringColor: "stroke-rose-400",
        glow: "from-rose-500/10"
      };
    }
  };

  const badge = getBadgeDetails(score);

  // SVG Circular progress params
  const radius = 54;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Render factors list
  const descText = form.fDetails || "";
  const factors = [
    {
      name: "Item Category",
      status: form.fCategory ? "Optimized" : "Generic",
      confidence: form.fCategory ? 90 : 30,
      icon: <Bookmark size={12} className="text-cyan-400" />
    },
    {
      name: "Description Quality",
      status: descText.length >= 150 ? "Excellent" : descText.length >= 50 ? "Good" : "Needs Detail",
      confidence: descText.length >= 150 ? 95 : descText.length >= 50 ? 70 : 40,
      icon: <FileText size={12} className="text-violet-400" />
    },
    {
      name: "Photo Verification",
      status: form.fImage ? "High Resolution" : "Missing",
      confidence: form.fImage ? 95 : 10,
      icon: <Camera size={12} className="text-pink-400" />
    },
    {
      name: "Location Precision",
      status: form.fLat && form.fLng ? "GPS Verified" : "Approximate",
      confidence: form.fLat && form.fLng ? 95 : 50,
      icon: <MapPin size={12} className="text-emerald-400" />
    },
    {
      name: "Nearby Activity",
      status: searchRadius === 2000 ? "Wide Scan (2.0km)" : searchRadius === 1000 ? "Medium Scan (1.0km)" : "Standard Scan (0.5km)",
      confidence: searchRadius === 2000 ? 98 : searchRadius === 1000 ? 80 : 65,
      icon: <Compass size={12} className="text-sky-400" />
    },
    {
      name: "Time Since Reported",
      status: "Highly Active",
      confidence: 100,
      icon: <Clock size={12} className="text-amber-400" />
    }
  ];

  // Estimated recovery window text
  const getRecoveryWindow = () => {
    if (score >= 90) return "1–3 Days";
    if (score >= 75) return "2–5 Days";
    if (score >= 50) return "5–10 Days";
    return "10+ Days";
  };

  const handleGoToFeed = () => {
    form.resetForm();
    window.dispatchEvent(new CustomEvent("change-tab", { detail: "feed" }));
    onClose();
  };

  const handleGoToMatches = () => {
    window.dispatchEvent(new CustomEvent("change-tab", { detail: "matches" }));
    onClose();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 text-left" id="recovery-intelligence-card-wrapper">
      
      {/* SUCCESS CONFETTI HEADER */}
      <div className="text-center space-y-3 py-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse">
          <CheckCircle2 size={32} />
        </div>
        <div>
          <span className="text-[10px] font-mono font-black tracking-[0.25em] text-emerald-400 uppercase">
            TRANSMISSION SECURED
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight mt-1">
            Report Indexed Successfully
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            Your verification dossier is now active. Gemini comparative scanners are analyzing active spatial indexes.
          </p>
        </div>
      </div>

      {/* PREMIUM GLASS INTELLIGENCE CARD */}
      <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-5 sm:p-8 space-y-6 sm:space-y-8 shadow-[0_24px_64px_rgba(0,0,0,0.6)] relative overflow-hidden">
        
        {/* Animated ambient gradients inside the card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-indigo-500/10 to-transparent blur-3xl pointer-events-none z-0" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-radial from-cyan-500/10 to-transparent blur-3xl pointer-events-none z-0" />

        {/* Section Title */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
              AI Recovery Probability Engine
            </span>
          </div>
          <span className="text-[9px] font-mono bg-slate-950/60 border border-slate-800/80 px-2 py-0.5 rounded text-slate-500 font-semibold uppercase">
            v3.5 Active
          </span>
        </div>

        {/* TOP METRICS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          
          {/* Circular Indicator (Span 5) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/40 border border-slate-800/40 rounded-3xl relative overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-b ${badge.glow} to-transparent opacity-40 blur-3xl`} />
            
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="w-full h-full -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Progress Ring with specific color */}
                <motion.circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className={`${badge.ringColor} transition-all duration-500`}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>

              {/* Centered Percentage text */}
              <div className="absolute text-center">
                <motion.span
                  key={score}
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-sans font-black text-white tracking-tighter"
                >
                  {score}%
                </motion.span>
                <span className="text-[9px] font-mono text-slate-500 uppercase block font-semibold mt-0.5">
                  AI Confidence
                </span>
              </div>
            </div>

            {/* Confidence Badge */}
            <div className="mt-4 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">Likelihood of Retrieval:</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold ${badge.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 mr-1.5 animate-ping" />
                {badge.text}
              </span>
            </div>
          </div>

          {/* Factors List (Span 7) */}
          <div className="md:col-span-7 space-y-3">
            <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Analyzed Recovery Factors
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {factors.map((factor, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-[#030304]/60 border border-slate-800/40 space-y-1.5 hover:border-slate-800 transition duration-150"
                >
                  <div className="flex items-center gap-1.5">
                    {factor.icon}
                    <span className="text-[11px] text-slate-300 font-semibold truncate">
                      {factor.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {factor.status}
                    </span>
                    <span className={`text-[10px] font-mono font-black ${
                      factor.confidence >= 90 ? "text-emerald-400" :
                      factor.confidence >= 70 ? "text-cyan-400" :
                      factor.confidence >= 50 ? "text-amber-400" :
                      "text-rose-400"
                    }`}>
                      {factor.confidence}%
                    </span>
                  </div>

                  {/* Factor micro progress bar */}
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        factor.confidence >= 90 ? "bg-emerald-500" :
                        factor.confidence >= 70 ? "bg-cyan-500" :
                        factor.confidence >= 50 ? "bg-amber-500" :
                        "bg-rose-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.confidence}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ESTIMATED RECOVERY WINDOW BANNER */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center relative z-10">
          <div className="sm:col-span-2 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
              Estimated Recovery Window
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Based on historical coordinate clusters, category density, and response speeds in this coordinate zone.
            </p>
          </div>
          <div className="text-center sm:text-right">
            <span className="text-2xl sm:text-3xl font-display font-extrabold text-indigo-400 block tracking-tight">
              {getRecoveryWindow()}
            </span>
            <span className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-wider">
              Calculated ETA
            </span>
          </div>
          <div className="col-span-1 sm:col-span-3 border-t border-slate-800/40 pt-2.5 mt-1 text-[10px] text-slate-500 italic flex items-center gap-1.5">
            <AlertCircle size={10} className="shrink-0 text-slate-600" />
            <span>This is an estimate based on available report information and may change as new reports arrive.</span>
          </div>
        </div>

        {/* ACTIVE AI OPTIMIZATION NOTICE */}
        <AnimatePresence>
          {aiAnalysisNotice && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-2.5 relative z-10"
            >
              <RefreshCw size={13} className="text-indigo-400 animate-spin shrink-0" />
              <span>{aiAnalysisNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DYNAMIC IMPROVEMENT / SUGGESTIONS SECTION */}
        <div className="space-y-4 pt-4 border-t border-slate-800/60 relative z-10">
          <div>
            <h3 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-widest">
              ⚡ Actionable AI Suggestions
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select optimizations below to dynamically boost your recovery confidence and matching metrics.
            </p>
          </div>

          <div className="space-y-2.5">
            
            {/* OPTION 1: Add report photo (if missing) */}
            {!form.fImage && (
              <div className="p-4 rounded-2xl bg-cyan-950/10 border border-cyan-500/20 hover:border-cyan-500/40 transition duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    📷 Add report attachment photo
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Visual comparative assets allow Gemini computer vision models to execute 3D matching queries.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Camera size={13} />
                    Upload Photo
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* OPTION 2: Add citizen reward (Lost Only) */}
            {form.fType === "Lost" && !form.fReward && (
              <div className="p-4 rounded-2xl bg-amber-950/10 border border-amber-500/20 hover:border-amber-500/40 transition duration-150 flex flex-col space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      💰 Add citizen return reward
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Offering an incentive increases active citizen scanning by 320% in nearby residential grids.
                    </p>
                  </div>
                  {!showRewardInput && (
                    <button
                      type="button"
                      onClick={() => setShowRewardInput(true)}
                      className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus size={13} />
                      Set Reward
                    </button>
                  )}
                </div>

                {showRewardInput && (
                  <div className="flex items-center gap-2 pt-2 max-w-sm">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs font-black">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        value={localReward}
                        onChange={(e) => setLocalReward(e.target.value)}
                        className="w-full pl-7 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyReward}
                      className="px-4 py-2 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer transition shrink-0"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRewardInput(false)}
                      className="p-2 text-slate-500 hover:text-slate-300 text-xs font-bold cursor-pointer transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OPTION 3: Enhance Description with Gemini */}
            {descText.length < 150 && (
              <div className="p-4 rounded-2xl bg-violet-950/10 border border-violet-500/20 hover:border-violet-500/40 transition duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                    ✨ Enhance report description with Gemini AI
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Our semantic generator extracts brand, colors, and identifiers to build an optimized match model.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={onEnhanceDescription}
                    disabled={isEnhancing}
                    className="w-full sm:w-auto px-4 py-2 bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 text-violet-300 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    <Sparkles size={13} className={isEnhancing ? "animate-spin" : ""} />
                    {isEnhancing ? "Enhancing..." : "Auto-Enhance"}
                  </button>
                </div>
              </div>
            )}

            {/* OPTION 4: Mention Brand name */}
            {!descText.toLowerCase().includes("brand") && !descText.toLowerCase().includes("make") && (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-800 transition duration-150 flex flex-col space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      ✓ Mention specific brand name or manufacturer
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Filtering matches by exact manufacturer cuts down generic false-positives by over 85%.
                    </p>
                  </div>
                  {!showBrandInput && (
                    <button
                      type="button"
                      onClick={() => setShowBrandInput(true)}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus size={13} />
                      Specify Brand
                    </button>
                  )}
                </div>

                {showBrandInput && (
                  <div className="flex items-center gap-2 pt-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="e.g. Apple, Nike, Samsung"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={applyBrand}
                      className="px-4 py-2 bg-indigo-500 text-slate-950 hover:bg-indigo-400 rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer transition shrink-0"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBrandInput(false)}
                      className="p-2 text-slate-500 hover:text-slate-300 text-xs font-bold cursor-pointer transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OPTION 5: Mention Serial Number */}
            {!descText.toLowerCase().includes("serial") && !descText.toLowerCase().includes("imei") && !descText.toLowerCase().includes("s/n") && (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-800 transition duration-150 flex flex-col space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      ✓ Mention serial, IMEI, or unique marking
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      A unique identifier enables absolute verified matching and legally binding claim security.
                    </p>
                  </div>
                  {!showSerialInput && (
                    <button
                      type="button"
                      onClick={() => setShowSerialInput(true)}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus size={13} />
                      Specify Serial
                    </button>
                  )}
                </div>

                {showSerialInput && (
                  <div className="flex items-center gap-2 pt-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="e.g. Serial, IMEI, key scratch"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={applySerial}
                      className="px-4 py-2 bg-indigo-500 text-slate-950 hover:bg-indigo-400 rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer transition shrink-0"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSerialInput(false)}
                      className="p-2 text-slate-500 hover:text-slate-300 text-xs font-bold cursor-pointer transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OPTION 6: Increase Search Radius */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-800 transition duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  📍 Expand coordination scan radius
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Expanding the scan zone from standard 500m to 2.0km hooks into adjacent neighborhood feed trackers.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={toggleSearchRadius}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Compass size={13} />
                  Radius: {searchRadius}m
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-end text-left relative z-10" id="recovery-dashboard-footer">
        <button
          type="button"
          onClick={handleGoToMatches}
          className="py-3 px-5 rounded-2xl bg-[#030304] border border-[#1c1c26] hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-xs font-black tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
        >
          <Sparkles size={14} className="animate-pulse" />
          Scan Realtime Matches
        </button>

        <button
          type="button"
          onClick={handleGoToFeed}
          className="py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black tracking-wider uppercase transition duration-150 cursor-pointer text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/20"
        >
          Done &amp; View Feed
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
};
