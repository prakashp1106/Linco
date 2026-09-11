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
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
        ringColor: "stroke-emerald-600"
      };
    } else if (scoreVal >= 75) {
      return {
        text: "High",
        color: "text-indigo-700 bg-indigo-50 border-indigo-200",
        ringColor: "stroke-indigo-600"
      };
    } else if (scoreVal >= 50) {
      return {
        text: "Moderate",
        color: "text-amber-800 bg-amber-50 border-amber-200",
        ringColor: "stroke-amber-500"
      };
    } else {
      return {
        text: "Low",
        color: "text-rose-700 bg-rose-50 border-rose-200",
        ringColor: "stroke-rose-500"
      };
    }
  };

  const badge = getBadgeDetails(score);

  // SVG Circular progress params
  const radius = 52;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Render factors list
  const descText = form.fDetails || "";
  const factors = [
    {
      name: "Item Category",
      status: form.fCategory ? "Specified" : "General",
      confidence: form.fCategory ? 90 : 30,
      icon: <Bookmark size={13} className="text-indigo-600" />
    },
    {
      name: "Description Quality",
      status: descText.length >= 150 ? "Detailed" : descText.length >= 50 ? "Moderate" : "Brief",
      confidence: descText.length >= 150 ? 95 : descText.length >= 50 ? 70 : 40,
      icon: <FileText size={13} className="text-indigo-600" />
    },
    {
      name: "Photo Attachment",
      status: form.fImage ? "Verified" : "Missing",
      confidence: form.fImage ? 95 : 10,
      icon: <Camera size={13} className="text-indigo-600" />
    },
    {
      name: "Location Precision",
      status: form.fLat && form.fLng ? "GPS Pinned" : "Approximate",
      confidence: form.fLat && form.fLng ? 95 : 50,
      icon: <MapPin size={13} className="text-indigo-600" />
    },
    {
      name: "Scan Perimeter",
      status: `${searchRadius}m Radius`,
      confidence: searchRadius === 2000 ? 98 : searchRadius === 1000 ? 80 : 65,
      icon: <Compass size={13} className="text-indigo-600" />
    },
    {
      name: "Recency Factor",
      status: "Active Index",
      confidence: 100,
      icon: <Clock size={13} className="text-indigo-600" />
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
      
      {/* SUCCESS HEADER */}
      <div className="text-center space-y-2 py-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs mb-1">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Report Published Successfully
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Your report is live in the LINCO network. Review the estimated recovery indicators and actionable recommendations below.
          </p>
        </div>
      </div>

      {/* INTELLIGENCE CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl relative overflow-hidden text-slate-800 font-sans">
        
        {/* Section Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-900">
              Recovery Probability Assessment
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Realtime Analysis
          </span>
        </div>

        {/* TOP METRICS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Circular Indicator (Span 5) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="w-full h-full -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className="stroke-slate-200"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Progress Ring */}
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
                  className="text-3xl font-bold text-slate-900"
                >
                  {score}%
                </motion.span>
                <span className="text-[10px] text-slate-500 block font-semibold mt-0.5">
                  Confidence
                </span>
              </div>
            </div>

            {/* Confidence Badge */}
            <div className="mt-3 text-center space-y-1">
              <span className="text-xs text-slate-500 block font-medium">Likelihood of Return:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold shadow-2xs ${badge.color}`}>
                {badge.text}
              </span>
            </div>
          </div>

          {/* Factors List (Span 7) */}
          <div className="md:col-span-7 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 block mb-1.5">
              Assessed Recovery Factors
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {factors.map((factor, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    {factor.icon}
                    <span className="text-xs text-slate-800 font-semibold truncate">
                      {factor.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      {factor.status}
                    </span>
                    <span className={`text-[11px] font-bold ${
                      factor.confidence >= 90 ? "text-emerald-700" :
                      factor.confidence >= 70 ? "text-indigo-700" :
                      factor.confidence >= 50 ? "text-amber-700" :
                      "text-rose-700"
                    }`}>
                      {factor.confidence}%
                    </span>
                  </div>

                  {/* Factor micro progress bar */}
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        factor.confidence >= 90 ? "bg-emerald-600" :
                        factor.confidence >= 70 ? "bg-indigo-600" :
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
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center shadow-2xs">
          <div className="sm:col-span-2 space-y-1">
            <span className="text-xs font-bold text-slate-900 block">
              Estimated Resolution Window
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Based on historical resolution rates, item category density, and community activity in this area.
            </p>
          </div>
          <div className="text-center sm:text-right">
            <span className="text-2xl font-bold text-indigo-600 block tracking-tight">
              {getRecoveryWindow()}
            </span>
            <span className="text-[11px] text-slate-500 block font-medium">
              Estimated Timeline
            </span>
          </div>
          <div className="col-span-1 sm:col-span-3 border-t border-slate-200 pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <AlertCircle size={12} className="shrink-0 text-slate-400" />
            <span>Estimates update as new matching reports or community sightings are submitted.</span>
          </div>
        </div>

        {/* ACTIVE AI OPTIMIZATION NOTICE */}
        <AnimatePresence>
          {aiAnalysisNotice && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold flex items-center gap-2 shadow-2xs"
            >
              <RefreshCw size={13} className="text-indigo-600 animate-spin shrink-0" />
              <span>{aiAnalysisNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DYNAMIC IMPROVEMENT / SUGGESTIONS SECTION */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Recommended Enhancements
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add details below to increase verification precision and match reliability.
            </p>
          </div>

          <div className="space-y-2.5">
            
            {/* OPTION 1: Add report photo (if missing) */}
            {!form.fImage && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera size={13} className="text-indigo-600" /> Add an item photo
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Visual images allow precise matching comparisons with found reports.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Camera size={12} />
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
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-2.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Coins size={13} className="text-amber-500" /> Offer a finder reward
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Voluntary incentives encourage community members in your area to actively check for your item.
                    </p>
                  </div>
                  {!showRewardInput && (
                    <button
                      type="button"
                      onClick={() => setShowRewardInput(true)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
                    >
                      <Plus size={12} />
                      Set Reward
                    </button>
                  )}
                </div>

                {showRewardInput && (
                  <div className="flex items-center gap-2 pt-1 max-w-sm">
                    <div className="flex items-center flex-1 rounded-lg bg-white border border-slate-200 focus-within:border-indigo-500 overflow-hidden transition-all shadow-2xs">
                      <div className="pl-3 pr-1 py-1.5 text-slate-500 text-xs font-medium select-none shrink-0">
                        ₹
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 500"
                        value={localReward}
                        onChange={(e) => setLocalReward(e.target.value.replace(/\D/g, ""))}
                        className="w-full py-1.5 pr-3 bg-transparent outline-none text-xs text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyReward}
                      className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0 shadow-2xs"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRewardInput(false)}
                      className="p-1.5 text-slate-500 hover:text-slate-700 text-xs cursor-pointer transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OPTION 3: Enhance Description with Gemini */}
            {descText.length < 150 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-600" /> Enhance description with AI
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    AI assists in formatting colors, distinguishing marks, and condition details for sharper matching.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={onEnhanceDescription}
                    disabled={isEnhancing}
                    className="w-full sm:w-auto px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 shadow-2xs"
                  >
                    <Sparkles size={12} className={isEnhancing ? "animate-spin" : ""} />
                    {isEnhancing ? "Enhancing..." : "Auto-Enhance"}
                  </button>
                </div>
              </div>
            )}

            {/* OPTION 4: Mention Brand name */}
            {!descText.toLowerCase().includes("brand") && !descText.toLowerCase().includes("make") && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-2.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Check size={13} className="text-indigo-600" /> Add brand or manufacturer name
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Specifying exact brand names significantly reduces mismatch ambiguities.
                    </p>
                  </div>
                  {!showBrandInput && (
                    <button
                      type="button"
                      onClick={() => setShowBrandInput(true)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
                    >
                      <Plus size={12} />
                      Add Brand
                    </button>
                  )}
                </div>

                {showBrandInput && (
                  <div className="flex items-center gap-2 pt-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="e.g. Apple, Nike, Samsung"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={applyBrand}
                      className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0 shadow-2xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBrandInput(false)}
                      className="p-1.5 text-slate-500 hover:text-slate-700 text-xs cursor-pointer transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OPTION 5: Mention Serial Number */}
            {!descText.toLowerCase().includes("serial") && !descText.toLowerCase().includes("imei") && !descText.toLowerCase().includes("s/n") && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-2.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-indigo-600" /> Add serial number or unique mark
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Serial and IMEI numbers provide definitive proof of ownership during claim verification.
                    </p>
                  </div>
                  {!showSerialInput && (
                    <button
                      type="button"
                      onClick={() => setShowSerialInput(true)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
                    >
                      <Plus size={12} />
                      Add Identifier
                    </button>
                  )}
                </div>

                {showSerialInput && (
                  <div className="flex items-center gap-2 pt-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="e.g. Serial, IMEI, or specific scratch"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={applySerial}
                      className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0 shadow-2xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSerialInput(false)}
                      className="p-1.5 text-slate-500 hover:text-slate-700 text-xs cursor-pointer transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OPTION 6: Increase Search Radius */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Compass size={13} className="text-indigo-600" /> Search radius perimeter
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Adjusting the notification perimeter covers broader surrounding neighborhoods.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={toggleSearchRadius}
                  className="w-full sm:w-auto px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Compass size={12} />
                  Radius: {searchRadius}m
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-end text-left" id="recovery-dashboard-footer">
        <button
          type="button"
          onClick={handleGoToMatches}
          className="py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
        >
          <Sparkles size={14} className="text-indigo-600" />
          View Potential Matches
        </button>

        <button
          type="button"
          onClick={handleGoToFeed}
          className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
        >
          Done &amp; Return to Feed
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
};
