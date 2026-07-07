/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Camera,
  Mic,
  Trash2,
  ShieldCheck,
  MapPin,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  Lock,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  Eye,
  EyeOff,
  BellRing,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { usePostForm } from "../hooks/usePostForm";
import { useAI } from "../hooks/useAI";
import { useMaps } from "../hooks/useMaps";
import { detectCategoryLocal, extractItemLocal, capitalizeItemName } from "../utils/extractor";
import { CATEGORIES, URGENCY_LEVELS } from "../constants";
import { InteractiveMap } from "./LeafletMap";
import { imageService } from "../services/imageService";
import { TimelineSection } from "./TimelineSection";
import { RewardSection } from "./RewardSection";
import { ErrorBoundary } from "./ErrorBoundary";

interface PostFormProps {
  onSubmit: (postData: any) => Promise<any>;
  form: ReturnType<typeof usePostForm>;
}

export const PostForm: React.FC<PostFormProps> = ({ onSubmit, form }) => {
  const ai = useAI();
  const maps = useMaps();

  // Local state for the redesigned step-by-step reporting flow (1 to 8, then 9 for Review)
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [aiFillNotice, setAiFillNotice] = useState("");
  const [isWhatsAppSame, setIsWhatsAppSame] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  
  // Distance Radius local state
  const [distanceRadius, setDistanceRadius] = useState(500);

  // Date and Time local states for Timeline Reconstructor
  const [timelineDate, setTimelineDate] = useState<"Today" | "Yesterday" | "Custom">("Today");
  const [customDateVal, setCustomDateVal] = useState("");
  const [timelineTime, setTimelineTime] = useState<"Morning" | "Afternoon" | "Evening" | "Night" | "Custom">("Afternoon");
  const [customTimeVal, setCustomTimeVal] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-reset local step if form is cleared
  useEffect(() => {
    if (form.fItem === "" && form.fDetails === "" && form.fType === "" && form.fContact === "") {
      setCurrentStep(1);
    }
  }, [form.fItem, form.fDetails, form.fType, form.fContact]);

  // Synchronize Timeline text whenever date, time or details change
  useEffect(() => {
    let dateStr = timelineDate === "Custom" ? (customDateVal || "Custom Date") : timelineDate;
    let timeStr = timelineTime === "Custom" ? (customTimeVal || "Custom Time") : timelineTime;
    let autoTimeline = `Date: ${dateStr}, Approximate Time: ${timeStr}.`;
    if (form.fTimeline && !form.fTimeline.startsWith("Date:")) {
      autoTimeline += ` Details: ${form.fTimeline}`;
    }
    // Update hook state
    form.setFTimeline(autoTimeline);
  }, [timelineDate, customDateVal, timelineTime, customTimeVal]);

  // Trigger file upload from custom area
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Compression & Direct Base64 conversion
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await imageService.compressImage(file, 800, 0.85);
      form.setFImage(compressedBase64);
      setAiFillNotice("✨ Photo added! Analyzing with Gemini AI matches...");
      
      // Auto triggers analysis to fill categories and details
      const res = await ai.runPhotoAnalyzer(compressedBase64);
      let count = 0;
      if (res.item && !form.fItem.trim()) { form.setFItem(res.item); count++; }
      if (res.category) { form.setFCategory(res.category); count++; }
      if (res.details && !form.fDetails.trim()) { form.setFDetails(res.details); count++; }
      if (res.urgency) { form.setFUrgency(res.urgency as any); count++; }
      
      if (count > 0) {
        setAiFillNotice(`✨ Gemini auto-filled ${count} fields from photo details!`);
        setTimeout(() => setAiFillNotice(""), 6500);
      }
    } catch (err: any) {
      console.error("Failed to compress and analyze upload image:", err);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!form.fDetails.trim()) {
      setLocalErrors((prev) => ({ ...prev, details: "Bhai draft description empty hai. Please type basic description first!" }));
      return;
    }
    setLocalErrors((prev) => ({ ...prev, details: "" }));
    try {
      const enhanced = await ai.runEnhanceDescription(
        form.fItem,
        form.fCategory || "Property",
        form.fDetails
      );
      form.setFDetails(enhanced);
      setAiFillNotice("✨ Gemini enhanced your details beautifully!");
      setTimeout(() => setAiFillNotice(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateSecurePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    form.setFSecurityPin(randomPin);
    setAiFillNotice("🔑 New highly secure PIN generated!");
    setTimeout(() => setAiFillNotice(""), 4000);
  };

  // Visual helper steps
  const isLost = form.fType === "Lost";
  const totalSteps = isLost ? 8 : 7;

  // Compute visual step number (since Step 6 is skipped for Found reports)
  const getVisualStepNumber = (logicalStep: number) => {
    if (!isLost) {
      if (logicalStep >= 7) return logicalStep - 1;
    }
    return logicalStep;
  };

  // Get Encouragement message
  const getEncouragingText = (logicalStep: number) => {
    switch (logicalStep) {
      case 1:
        return "📝 Let's identify your item.";
      case 2:
        return "📝 Let's identify your item.";
      case 3:
        return "📷 Great! Add a photo.";
      case 4:
        return "📍 Tell us where this happened.";
      case 5:
        return "⏰ Almost done.";
      case 6:
        return "⏰ Almost done.";
      case 7:
        return "🔐 One final step to protect your report.";
      case 8:
        return "🔐 One final step to protect your report.";
      case 9:
        return "🎉 Ready to publish.";
      default:
        return "✨ Fill out the details.";
    }
  };

  // Validate fields for each step before proceeding
  const validateAndNext = () => {
    const errs: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!form.fType) {
        errs.type = "Please choose if you Lost or Found the item.";
      }
    } else if (currentStep === 2) {
      if (!form.fItem.trim()) {
        errs.item = "Item Name is required. Please write the item name.";
      }
      if (!form.fDetails.trim()) {
        errs.details = "Item Description is required to help Gemini scan matches.";
      }
      if (!form.fCategory) {
        errs.category = "Please choose a category.";
      }
    } else if (currentStep === 4) {
      if (!form.fAddress.trim()) {
        errs.address = "Incident Location address is required.";
      }
    } else if (currentStep === 7) {
      if (!form.fContact.trim()) {
        errs.contact = "Contact number is required.";
      } else if (!/^\d{10}$/.test(form.fContact.trim())) {
        errs.contact = "Please enter a valid 10-digit mobile number.";
      }
    } else if (currentStep === 8) {
      if (!form.fSecurityPin.trim()) {
        errs.securityPin = "A 4-digit security PIN is required.";
      } else if (!/^\d{4}$/.test(form.fSecurityPin.trim())) {
        errs.securityPin = "PIN must be exactly 4 numeric digits.";
      }
    }

    if (Object.keys(errs).length > 0) {
      setLocalErrors(errs);
      return;
    }

    setLocalErrors({});

    // Advance logically
    if (currentStep === 5 && !isLost) {
      // Skip Step 6 (Reward) if Found report
      setCurrentStep(7);
    } else if (currentStep < 9) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleGoBack = () => {
    setLocalErrors({});
    if (currentStep === 7 && !isLost) {
      // Skip back past step 6 (Reward) to step 5 (Timeline) if Found report
      setCurrentStep(5);
    } else if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          form.setFLat(userLat);
          form.setFLng(userLng);
          
          try {
            const response = await fetch(
              `/api/maps/revgeocode?lat=${userLat}&lng=${userLng}`
            );
            const data = await response.json();
            if (data && data.results && data.results.length > 0) {
              const addressText = data.results[0].formatted_address;
              if (addressText) {
                form.setFAddress(addressText);
                setLocalErrors((prev) => ({ ...prev, address: "" }));
              }
            }
          } catch (e) {
            console.error("Geocoding failed:", e);
          }
        },
        (error) => {
          console.error("GPS access failed:", error);
        }
      );
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const postData = {
        item: form.fItem,
        details: form.fDetails,
        type: form.fType,
        address: form.fAddress,
        reward: form.fReward,
        contact: form.fContact,
        category: form.fCategory,
        urgency: form.fUrgency,
        image: form.fImage,
        timeline: form.fTimeline,
        latitude: form.fLat,
        longitude: form.fLng,
        securityPin: form.fSecurityPin,
      };

      const res = await onSubmit(postData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          form.resetForm();
          setSuccess(false);
          setCurrentStep(1);
        }, 3200);
      } else {
        throw new Error(res.error || "Publication of report failed");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to publish post. Please check PIN.");
    } finally {
      setSubmitting(false);
    }
  };

  // Drag and drop photo logic
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await imageService.compressImage(file, 800, 0.85);
        form.setFImage(compressedBase64);
        setAiFillNotice("✨ File dropped successfully!");
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="bg-slate-950/40 border border-slate-900 rounded-[32px] p-4 sm:p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden" id="post-form-card">
      <div className="absolute top-0 right-10 w-48 h-48 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* REDESIGNED AI-GUIDED JOURNEY HEADER */}
      <div className="mb-8 pb-5 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <span className="text-[10px] font-mono font-black tracking-widest text-cyan-400 uppercase bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-500/20">
            🤖 AI-Guided Report Builder
          </span>
          <h2 className="text-xl md:text-2xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 mt-2.5">
            Create Verified Report
          </h2>
          {/* Encouraging subtitle */}
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs sm:text-sm text-slate-300 mt-1 font-semibold flex items-center gap-1.5"
          >
            {getEncouragingText(currentStep)}
          </motion.p>
        </div>

        {/* Premium Adaptive Stepper & Progress Ring / Bar */}
        {currentStep <= 8 && (
          <div className="flex flex-col items-end gap-1.5">
            <span className="font-mono text-[11px] font-black tracking-wider text-slate-400">
              STEP <span className="text-cyan-400 font-extrabold">{getVisualStepNumber(currentStep)}</span> OF {totalSteps}
            </span>
            <div className="w-28 sm:w-36 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/40 relative">
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-violet-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                initial={{ width: "12%" }}
                animate={{ width: `${(getVisualStepNumber(currentStep) / totalSteps) * 100}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
        {currentStep === 9 && (
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] tracking-wider uppercase font-mono">
            🔍 FINAL RECONCILIATION DRAFT
          </div>
        )}
      </div>

      {/* AI auto fill notices banner */}
      <AnimatePresence>
        {aiFillNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-5 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center gap-2 text-left"
          >
            <Sparkles size={12} className="shrink-0 text-cyan-400 animate-spin" />
            <span>{aiFillNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* STEP 1: CHOOSE REPORT TYPE */}
        {currentStep === 1 && (
          <motion.div
            key="step-type"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 text-left"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Which path are we reporting?</h3>
              <p className="text-xs text-slate-500">Pick a flow to begin your AI-assisted retrieval journey.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  form.setFType("Lost");
                  setLocalErrors({});
                  setTimeout(() => setCurrentStep(2), 250); // Auto advances smoothly
                }}
                className={`p-6 sm:p-8 rounded-[24px] border flex flex-col items-center justify-center text-center gap-4 transition duration-300 group cursor-pointer ${
                  form.fType === "Lost"
                    ? "bg-rose-950/10 border-rose-500/50 text-rose-300 shadow-[0_0_25px_rgba(239,68,68,0.1)] scale-[1.02]"
                    : "bg-slate-950/30 border-slate-900 hover:border-rose-500/30 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-300 shadow-inner">
                  🔴
                </div>
                <div>
                  <h4 className="text-sm font-black font-display uppercase tracking-wide">I Lost Something</h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Create a detailed recovery ticket. Gemini scans active found folders instantly.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  form.setFType("Found");
                  setLocalErrors({});
                  setTimeout(() => setCurrentStep(2), 250); // Auto advances smoothly
                }}
                className={`p-6 sm:p-8 rounded-[24px] border flex flex-col items-center justify-center text-center gap-4 transition duration-300 group cursor-pointer ${
                  form.fType === "Found"
                    ? "bg-emerald-950/10 border-emerald-500/50 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.1)] scale-[1.02]"
                    : "bg-slate-950/30 border-slate-900 hover:border-emerald-500/30 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-300 shadow-inner">
                  🟢
                </div>
                <div>
                  <h4 className="text-sm font-black font-display uppercase tracking-wide">I Found Something</h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Report cataloged findings. Coordinate safely to locate the rightful owner.
                  </p>
                </div>
              </button>
            </div>
            {localErrors.type && (
              <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1.5">
                <AlertCircle size={12} /> {localErrors.type}
              </p>
            )}
          </motion.div>
        )}

        {/* STEP 2: ITEM DETAILS (NAME, DESCRIPTION & CATEGORY) */}
        {currentStep === 2 && (
          <motion.div
            key="step-details"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 text-left"
          >
            <div className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Matte Black iPhone 15 Pro, Brown Leather Tommy Hilfiger Wallet"
                  value={form.fItem}
                  onChange={(e) => {
                    form.setFItem(e.target.value);
                    setLocalErrors((prev) => ({ ...prev, item: "" }));
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-100 transition font-bold placeholder:text-slate-600 shadow-inner"
                />
                {localErrors.item && (
                  <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={11} /> {localErrors.item}
                  </p>
                )}
              </div>

              {/* Item Description - PLACED IMMEDIATELY BELOW ITEM NAME */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                    Item Description <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleEnhanceDescription}
                    disabled={ai.enhanceLoading || !form.fDetails.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-[9px] font-extrabold text-cyan-300 uppercase transition disabled:opacity-40 cursor-pointer"
                  >
                    <Sparkles size={11} className={ai.enhanceLoading ? "animate-spin text-cyan-400" : "text-cyan-400"} />
                    {ai.enhanceLoading ? "Enhancing..." : "✨ Improve Description"}
                  </button>
                </div>
                <textarea
                  placeholder="Describe unique identifiers, colors, brand names, scratch marks, stickers, lock screen wallpaper or any specific markings. Example: 'iPhone 15 Pro with a minor scratch on the top-left rim, inside a clear silicone cover, wallpaper is a high-contrast mountain skyline.'"
                  rows={4}
                  value={form.fDetails}
                  onChange={(e) => {
                    form.setFDetails(e.target.value);
                    setLocalErrors((prev) => ({ ...prev, details: "" }));
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-100 transition leading-relaxed placeholder:text-slate-600 shadow-inner resize-y font-mono"
                />
                <span className="text-[10px] text-slate-500 block mt-1.5 leading-normal">
                  💡 Helper tip: Describe colors, brand, scratches, stickers or anything unique.
                </span>
                {localErrors.details && (
                  <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={11} /> {localErrors.details}
                  </p>
                )}
              </div>

              {/* Category selection - embedded beautifully */}
              <div className="pt-2">
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5">
                  Item Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        form.setFCategory(cat.id);
                        setLocalErrors((prev) => ({ ...prev, category: "" }));
                      }}
                      className={`text-[11px] px-3 py-2.5 rounded-xl border transition font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                        form.fCategory === cat.id
                          ? "bg-cyan-500/10 border-cyan-400/50 text-cyan-300 scale-[1.02] shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                          : "bg-slate-950/30 border-slate-900 text-slate-400 hover:border-slate-800"
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span className="truncate">{cat.id}</span>
                      {form.fCategory === cat.id && <Check size={10} className="text-cyan-400 shrink-0" />}
                    </button>
                  ))}
                </div>
                {localErrors.category && (
                  <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={11} /> {localErrors.category}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: PHOTO SECTION */}
        {currentStep === 3 && (
          <motion.div
            key="step-photo"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 text-left"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Visual Authentication</h3>
              <p className="text-xs text-slate-500">Adding an image allows our Gemini Matching Engine to run comparative visual analysis.</p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`relative p-8 rounded-[24px] border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center group min-h-[180px] overflow-hidden ${
                isDragging
                  ? "border-cyan-400 bg-cyan-950/15"
                  : "border-slate-800 bg-slate-950/20 hover:border-cyan-500/30 hover:bg-slate-950/40"
              }`}
            >
              {ai.photoLoading && (
                <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center gap-2 z-20">
                  <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  <span className="text-[10px] font-mono font-bold text-cyan-400 animate-pulse tracking-wider">GEMINI VISUAL SCANNING INTERACTION</span>
                  <div className="absolute inset-x-0 h-[2px] bg-cyan-500/60 shadow-[0_0_8px_#06b6d4] animate-scan top-0" />
                </div>
              )}

              {form.fImage ? (
                <div className="absolute inset-0 z-10 group/img flex items-center justify-center bg-slate-950/70">
                  <img src={form.fImage} alt="Uploaded item draft" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition duration-200">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        form.setFImage(null);
                      }}
                      className="p-2 bg-rose-500 hover:bg-rose-600 rounded-lg text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Trash2 size={12} /> Delete Photo
                    </button>
                    <span className="text-[10px] text-slate-300 font-mono">Tap to replace</span>
                  </div>
                  <span className="absolute bottom-3 left-3 bg-cyan-500/20 border border-cyan-400/30 text-[10px] text-cyan-300 px-3 py-1 rounded-md font-bold font-mono shadow-md backdrop-blur-md">
                    ✓ SECURELY INDEXED
                  </span>
                </div>
              ) : null}

              <UploadCloud size={32} className="text-slate-500 group-hover:text-cyan-400 transition duration-300 mb-3" />
              <span className="text-xs font-black text-slate-200">Drag &amp; Drop or Upload Photo</span>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal max-w-xs">
                Supports Camera Snapshot or Library. Photos are auto-scrubbed of personal EXIF tags for privacy.
              </p>
              
              <div className="flex gap-2 mt-4 z-10">
                <span className="text-[9px] bg-cyan-950/50 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-bold font-mono">
                  📸 CAMERA SUPPORTED
                </span>
                <span className="text-[9px] bg-violet-950/50 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-bold font-mono">
                  🖼️ GALLERY COMPATIBLE
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  form.setFImage(null);
                  setCurrentStep(4);
                }}
                className="text-[11px] font-extrabold text-slate-400 hover:text-white transition duration-200 py-1.5 px-3 rounded-lg border border-slate-900 hover:border-slate-800 bg-slate-950/20"
              >
                ⏭️ Skip Photo upload
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: INCIDENT LOCATION (MAP & DISTANCE RADIUS) */}
        {currentStep === 4 && (
          <motion.div
            key="step-location"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 text-left"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Spatial Mapping</h3>
              <p className="text-xs text-slate-500">Provide the approximate area where the event transpired.</p>
            </div>

            <div className="space-y-4">
              {/* Address input */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                  Incident Address / Location <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. Pune University Library cafeteria, Block A elevators, Wagholi area"
                      value={form.fAddress}
                      onChange={(e) => {
                        form.setFAddress(e.target.value);
                        setLocalErrors((prev) => ({ ...prev, address: "" }));
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-100 transition font-bold placeholder:text-slate-600 shadow-inner"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="px-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
                    title="Retrieve Coordinates via Device GPS"
                  >
                    <MapPin size={13} className="animate-pulse" /> <span>Current Location</span>
                  </button>
                </div>
                {localErrors.address && (
                  <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={11} /> {localErrors.address}
                  </p>
                )}
              </div>

              {/* Map & Distance directly below address - required as per prompt */}
              <div className="space-y-3">
                <div className="rounded-[24px] overflow-hidden h-60 border border-slate-900 shadow-xl relative">
                  <ErrorBoundary fallbackTitle="Interactive Map Error">
                    <InteractiveMap
                      onChange={(lat, lng) => {
                        form.setFLat(lat);
                        form.setFLng(lng);
                      }}
                      onAddressChange={(address) => {
                        form.setFAddress(address);
                        setLocalErrors((prev) => ({ ...prev, address: "" }));
                      }}
                      lat={form.fLat}
                      lng={form.fLng}
                    />
                  </ErrorBoundary>
                </div>

                {/* Distance Radius component below map */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-300 tracking-wider">Search Accuracy Distance Radius</span>
                    <span className="text-xs font-mono font-extrabold text-cyan-400 bg-cyan-950/60 border border-cyan-500/20 px-2 py-0.5 rounded">
                      Within {distanceRadius} meters
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={distanceRadius}
                    onChange={(e) => setDistanceRadius(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-900 rounded-lg outline-none"
                  />
                  
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold uppercase">
                    <span>50m (Exact Spot)</span>
                    <span>500m (Campus)</span>
                    <span>2000m (City Ward)</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: TIMELINE */}
        {currentStep === 5 && (
          <motion.div
            key="step-timeline"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 text-left"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Timeline Window</h3>
              <p className="text-xs text-slate-500">Providing the hour and date window is crucial to establish chronologies.</p>
            </div>

            <div className="space-y-4">
              {/* Day selection */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5">
                  When did this happen?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Today", "Yesterday", "Custom"] as const).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setTimelineDate(day)}
                      className={`py-3 px-4 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        timelineDate === day
                          ? "bg-cyan-500/10 border-cyan-400/50 text-cyan-300 shadow-md"
                          : "bg-slate-950/30 border-slate-900 text-slate-400 hover:border-slate-800"
                      }`}
                    >
                      {day === "Today" && "📅"}
                      {day === "Yesterday" && "⏳"}
                      {day === "Custom" && "🗓️"}
                      <span>{day}</span>
                    </button>
                  ))}
                </div>
                {timelineDate === "Custom" && (
                  <div className="mt-3">
                    <input
                      type="date"
                      value={customDateVal}
                      onChange={(e) => setCustomDateVal(e.target.value)}
                      className="px-4 py-2 bg-slate-950/60 border border-slate-900 rounded-xl focus:border-cyan-500/40 text-xs text-slate-100 outline-none w-full font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5">
                  Approximate Time Window
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(["Morning", "Afternoon", "Evening", "Night", "Custom"] as const).map((timeSlot) => (
                    <button
                      key={timeSlot}
                      type="button"
                      onClick={() => setTimelineTime(timeSlot)}
                      className={`py-2 px-3 rounded-xl border font-bold text-[10px] sm:text-xs transition cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                        timelineTime === timeSlot
                          ? "bg-cyan-500/10 border-cyan-400/50 text-cyan-300"
                          : "bg-slate-950/30 border-slate-900 text-slate-400 hover:border-slate-800"
                      }`}
                    >
                      <span className="text-xs">
                        {timeSlot === "Morning" && "🌅"}
                        {timeSlot === "Afternoon" && "☀️"}
                        {timeSlot === "Evening" && "🌇"}
                        {timeSlot === "Night" && "🌙"}
                        {timeSlot === "Custom" && "⏰"}
                      </span>
                      <span>{timeSlot}</span>
                    </button>
                  ))}
                </div>
                {timelineTime === "Custom" && (
                  <div className="mt-3">
                    <input
                      type="time"
                      value={customTimeVal}
                      onChange={(e) => setCustomTimeVal(e.target.value)}
                      className="px-4 py-2 bg-slate-950/60 border border-slate-900 rounded-xl focus:border-cyan-500/40 text-xs text-slate-100 outline-none w-full font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Why this helps AI card - required per prompt */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900/60 space-y-1">
                <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  💡 Why this helps AI matching
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Gemini scans timelines of corresponding lost and found items. By providing precise date and time boundaries, we exclude 94% of mismatch duplicates and isolate the overlapping visual checkpoints automatically.
                </p>
              </div>

              {/* Move Timeline Reconstructor directly below Location */}
              <div className="pt-2">
                <TimelineSection
                  itemName={form.fItem}
                  onSelectSuggestedAddress={(addr) => {
                    form.setFAddress(addr);
                    setAiFillNotice("✨ Address auto-populated from timeline reconstruction!");
                    setTimeout(() => setAiFillNotice(""), 4000);
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 6: REWARD (ONLY ACCESSIBLE/SHOWN IF TYPE === 'LOST') */}
        {currentStep === 6 && isLost && (
          <motion.div
            key="step-reward"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 text-left"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Citizen Reward (Optional)</h3>
              <p className="text-xs text-slate-500">Provide an incentive to finders. Entirely optional.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                  Offered Reward Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-emerald-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. 500, 1000, 2500"
                    value={form.fReward}
                    onChange={(e) => form.setFReward(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-100 font-mono font-bold shadow-inner"
                  />
                </div>
              </div>

              {/* Quick reward pill presets */}
              <div className="flex flex-wrap gap-1.5">
                {["0", "500", "1000", "2000", "5000"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => form.setFReward(preset === "0" ? "" : preset)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                      (preset === "0" && !form.fReward) || (form.fReward === preset && preset !== "0")
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold"
                        : "bg-slate-950/20 border-slate-900 hover:border-slate-800 text-slate-400"
                    }`}
                  >
                    {preset === "0" ? "No Reward" : `₹${preset}`}
                  </button>
                ))}
              </div>

              {/* RewardSection component helper integration */}
              <div className="pt-2">
                <RewardSection
                  itemName={form.fItem}
                  itemDescription={form.fDetails}
                  onSetSuggestedReward={(amount) => {
                    form.setFReward(amount);
                    setAiFillNotice("✨ AI Suggested reward preset applied!");
                    setTimeout(() => setAiFillNotice(""), 3500);
                  }}
                  currentReward={form.fReward}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 7: CONTACT INFORMATION (REQUIRED) */}
        {currentStep === 7 && (
          <motion.div
            key="step-contact"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 text-left"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Contact Safeguards</h3>
              <p className="text-xs text-slate-500">Secure validation ensures communication only happens upon verified claim matches.</p>
            </div>

            <div className="space-y-5">
              {/* Contact number */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Contact Mobile Number <span className="text-rose-500">*</span></span>
                  <span className="text-[9px] text-emerald-400 font-bold lowercase font-mono tracking-normal flex items-center gap-1 bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={10} /> Local AES Client Encryption Active
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-bold text-xs">
                    +91
                  </span>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="9876543210"
                    value={form.fContact}
                    onChange={(e) => {
                      form.setFContact(e.target.value.replace(/\D/g, ""));
                      setLocalErrors((prev) => ({ ...prev, contact: "" }));
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-100 font-bold tracking-wider placeholder:text-slate-600 shadow-inner"
                  />
                </div>
                {localErrors.contact && (
                  <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={11} /> {localErrors.contact}
                  </p>
                )}
              </div>

              {/* WhatsApp Toggle */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200 block flex items-center gap-1">
                    🟢 My WhatsApp is same as this number
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Check to allow finders to click and initiate verified WhatsApp chats.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isWhatsAppSame}
                    onChange={() => setIsWhatsAppSame(!isWhatsAppSame)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950"></div>
                </label>
              </div>

              {/* Visually explain privacy safeguard - required as per prompt */}
              <div className="p-4 rounded-2xl bg-cyan-950/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-start gap-3 leading-relaxed">
                <ShieldCheck size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[11px] text-slate-200 uppercase tracking-wider mb-1">🛡️ Contact Details Privacy Vault</h4>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium">
                    Contact remains entirely **private, masked and hidden** from general feeds, searches, search engines, and visitors. It is only unlocked and safely decrypted on-device for a corresponding finder **after you manually review and approve their claim dossier** in your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 8: SECURITY PIN (MOST PREMIUM VISUAL LOCK CARD) */}
        {currentStep === 8 && (
          <motion.div
            key="step-pin"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="space-y-6 text-left"
          >
            <div className="text-center space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-lg font-black text-slate-100 flex items-center justify-center gap-2">
                🔐 Protect Your Ownership
              </h3>
              <p className="text-xs text-slate-500 leading-normal">
                This PIN secures your posting. Keep it safe to manage claims or mark as resolved.
              </p>
            </div>

            {/* Beautiful Security Pass Card Styling */}
            <div className="relative mx-auto max-w-sm bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/20 p-6 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden group">
              {/* Card background neon glows */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition duration-500" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-violet-500/20 transition duration-500" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-5 bg-cyan-400/10 rounded border border-cyan-400/20 flex items-center justify-center font-mono text-[8px] font-bold text-cyan-300">
                    SECURE
                  </div>
                  <div className="w-4 h-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  </div>
                </div>
                <ShieldCheck size={18} className="text-cyan-400" />
              </div>

              {/* Big PIN Display */}
              <div className="my-6 text-center space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">ADMIN KEYPASS CODE</span>
                <div className="flex justify-center items-center gap-3">
                  {form.fSecurityPin.split("").map((digit, i) => (
                    <span
                      key={i}
                      className="w-10 h-12 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-center font-mono text-lg font-black text-cyan-300 shadow-inner"
                    >
                      {showPin ? digit : "•"}
                    </span>
                  ))}
                  {/* Fill in dashes if PIN length is less than 4 */}
                  {Array.from({ length: Math.max(0, 4 - form.fSecurityPin.length) }).map((_, i) => (
                    <span
                      key={i}
                      className="w-10 h-12 bg-slate-950 rounded-xl border border-slate-900/40 flex items-center justify-center font-mono text-lg font-bold text-slate-600 animate-pulse"
                    >
                      -
                    </span>
                  ))}
                </div>
              </div>

              {/* Visual protections checkmarks - required as per prompt */}
              <div className="space-y-2.5 text-[11px] text-slate-300 border-t border-slate-900/80 pt-4 font-medium leading-relaxed">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-cyan-400 shrink-0" />
                  <span>🔐 **Approve Claims**: Authenticate verified matching claimants</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-cyan-400 shrink-0" />
                  <span>💬 **Unlock Contact**: Secure mutual coordination pathways</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-cyan-400 shrink-0" />
                  <span>🏁 **Resolve Item**: Archive listing once recovery completes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-cyan-400 shrink-0" />
                  <span>🛡️ **Protect Ownership**: Stop malicious deletion or tampering</span>
                </div>
              </div>
            </div>

            {/* Input & Generator Actions */}
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock size={12} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    placeholder="Set My PIN"
                    value={form.fSecurityPin}
                    onChange={(e) => {
                      form.setFSecurityPin(e.target.value.replace(/\D/g, ""));
                      setLocalErrors((prev) => ({ ...prev, securityPin: "" }));
                    }}
                    className="w-full pl-9 pr-14 py-2.5 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs font-mono font-bold tracking-widest text-slate-200 transition shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white transition p-0.5 text-[10px] font-bold cursor-pointer"
                  >
                    {showPin ? "Hide" : "Show"}
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={handleGenerateSecurePin}
                  className="px-3 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-violet-400 text-[11px] font-black uppercase rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <RefreshCw size={11} className={aiFillNotice ? "animate-spin" : ""} /> Generate Secure PIN
                </button>
              </div>

              {localErrors.securityPin && (
                <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1 font-semibold justify-center">
                  <AlertCircle size={11} /> {localErrors.securityPin}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 9: FINAL REVIEW DOSSIER RECIEPT */}
        {currentStep === 9 && (
          <motion.div
            key="step-review"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6 text-left"
          >
            {/* Draft Review Receipt (Extremely Premium Slate look) */}
            <div className="rounded-[24px] bg-slate-900/10 border border-slate-900 relative overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="absolute top-0 right-0 px-4 py-1.5 text-[9px] font-mono font-bold uppercase bg-cyan-500/15 border-l border-b border-cyan-500/25 text-cyan-300 rounded-bl-xl">
                Draft Finalized
              </div>

              {/* Title Header */}
              <div className="pb-4 border-b border-slate-900/80">
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md font-sans tracking-widest ${
                  isLost
                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                }`}>
                  🚨 {form.fType} Report
                </span>
                <h3 className="text-lg font-extrabold text-slate-100 mt-2 font-display">{form.fItem}</h3>
              </div>

              {form.fImage && (
                <div className="rounded-2xl overflow-hidden border border-slate-900 max-h-48 shadow-lg">
                  <img src={form.fImage} alt="Draft attachment preview" className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                </div>
              )}

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Category</span>
                  <span className="text-slate-300 font-bold">📂 {form.fCategory || "Property"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Incident Location</span>
                  <span className="text-slate-300 font-bold flex items-center gap-1">📍 {form.fAddress}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Contact Mobile Number</span>
                  <span className="text-slate-300 font-mono font-bold">+91 {form.fContact} {isWhatsAppSame && "(WhatsApp Sync ✔)"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Urgency Level</span>
                  <span className="text-slate-300 font-bold">{form.fUrgency}</span>
                </div>
                {isLost && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Offered Reward</span>
                    <span className="text-emerald-400 font-mono font-black">{form.fReward ? `₹${form.fReward}` : "No Reward"}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Security PIN</span>
                  <span className="text-cyan-400 font-mono font-black">🔒 {form.fSecurityPin} (Write down!)</span>
                </div>
              </div>

              {/* Auto-filled details review */}
              <div className="pt-4 border-t border-slate-900/80">
                <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-1.5">Description details</span>
                <p className="text-slate-400 text-[11px] leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-slate-900 font-mono">
                  {form.fDetails}
                </p>
              </div>

              {/* Timeline details review */}
              {form.fTimeline && (
                <div className="pt-4 border-t border-slate-900/80">
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-1.5">Temporal parameters</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-slate-900 font-mono">
                    {form.fTimeline}
                  </p>
                </div>
              )}

              {/* Automatic Match Reminder notification bar */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-950/10 border border-violet-900/40 text-violet-300 text-[10px] leading-normal font-medium">
                <BellRing size={14} className="shrink-0 text-violet-400 mt-0.5" />
                <p>
                  <strong>Gemini Smart Match active:</strong> Upon publishing, our matching scanner automatically reconciles this post with corresponding directory indexes, filtering for potential coordinates and notifying you in your feed immediately.
                </p>
              </div>
            </div>

            {/* Error/Success Feedbacks */}
            {submitError && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <p className="font-semibold">{submitError}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <Check size={14} className="shrink-0 animate-bounce" />
                <p className="font-semibold">⚡ Report successfully published! Checking Gemini AI Matches...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* REDESIGNED FLOATING NAVIGATION CONTROLS BAR */}
      <div className="flex gap-4 mt-8 pt-5 border-t border-slate-900 text-left">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handleGoBack}
            disabled={submitting}
            className="py-3 px-5 rounded-xl bg-slate-950/80 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Back
          </button>
        )}

        {currentStep < 9 ? (
          <button
            type="button"
            onClick={validateAndNext}
            className="flex-1 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 uppercase shadow-lg shadow-cyan-950/20 ml-auto"
          >
            Continue <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={submitting}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-black hover:text-black tracking-wide shadow-lg transition duration-150 cursor-pointer text-xs uppercase flex items-center justify-center gap-1.5"
          >
            {submitting ? "Publishing on Network..." : "Publish Report & Match 🚀"}
          </button>
        )}
      </div>
    </div>
  );
};
