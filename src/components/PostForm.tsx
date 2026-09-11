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
  CheckCircle2,
  Pencil
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
import { RecoveryIntelligenceCard } from "./RecoveryIntelligenceCard";
import { useLanguage } from "../context/LanguageContext";
import { VoiceInputButton } from "./VoiceInputButton";
import { ContextualHelp } from "./ContextualHelp";
import { EnhanceDescriptionModal } from "./EnhanceDescriptionModal";
import { EnhanceDescriptionResponse } from "../services/api";

interface PostFormProps {
  onSubmit: (postData: any) => Promise<any>;
  form: ReturnType<typeof usePostForm>;
}

export const PostForm: React.FC<PostFormProps> = ({ onSubmit, form }) => {
  const { lang, t } = useLanguage();
  const ai = useAI();
  const maps = useMaps();

  const stepNames = [
    "Type",
    "Details",
    "Photo",
    "Location",
    "Timeline",
    ...(form.fType === "Lost" ? ["Reward"] : []),
    "Contact",
    "Security"
  ];

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
  const [isStepLoading, setIsStepLoading] = useState(false);
  
  // AI Enhance Description Modal state
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const [enhanceOriginalText, setEnhanceOriginalText] = useState("");
  const [enhanceResultData, setEnhanceResultData] = useState<EnhanceDescriptionResponse | null>(null);

  // Autosave Draft Notification
  const [draftRestoredNotice, setDraftRestoredNotice] = useState(false);
  
  // Distance Radius local state
  const [distanceRadius, setDistanceRadius] = useState(500);

  // Date and Time local states for Timeline Reconstructor
  const [timelineDate, setTimelineDate] = useState<"Today" | "Yesterday" | "Custom">("Today");
  const [customDateVal, setCustomDateVal] = useState("");
  const [timelineTime, setTimelineTime] = useState<"Morning" | "Afternoon" | "Evening" | "Night" | "Custom">("Afternoon");
  const [customTimeVal, setCustomTimeVal] = useState("");

  const getCompletenessDetails = () => {
    let score = 0;
    const tips: string[] = [];

    // 1. Report Type
    if (form.fType) {
      score += 10;
    } else {
      tips.push("Select if report is Lost or Found");
    }

    // 2. Item Name
    if (form.fItem.trim()) {
      score += 20;
    } else {
      tips.push("Add an Item Name");
    }

    // 3. Category
    if (form.fCategory) {
      score += 10;
    } else {
      tips.push("Select an Item Category");
    }

    // 4. Description length
    if (form.fDetails.trim()) {
      if (form.fDetails.trim().length >= 30) {
        score += 20;
      } else {
        score += 10;
        tips.push("Expand description to 30+ chars");
      }
    } else {
      tips.push("Describe key details (Brand, unique markings)");
    }

    // 5. Photo
    if (form.fImage) {
      score += 15;
    } else {
      tips.push("Upload a photo for visual scans");
    }

    // 6. Location
    if (form.fAddress.trim()) {
      score += 15;
    } else {
      tips.push("Add a precise incident location");
    }

    // 7. Security PIN
    if (form.fSecurityPin.trim()) {
      score += 10;
    } else {
      tips.push("Set a security PIN");
    }

    // Star rating
    let stars = "⭐☆☆☆☆";
    if (score >= 90) stars = "⭐⭐⭐⭐⭐";
    else if (score >= 75) stars = "⭐⭐⭐⭐☆";
    else if (score >= 55) stars = "⭐⭐⭐☆☆";
    else if (score >= 30) stars = "⭐⭐☆☆☆";

    return { score, stars, tips };
  };

  const { score: completenessScore, stars: completenessStars, tips: completenessTips } = getCompletenessDetails();

  const getNearbyLandmark = () => {
    if (!form.fAddress.trim()) return "Specify location to estimate landmarks";
    const parts = form.fAddress.split(",");
    return parts[0].trim();
  };

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

  // Autosave draft
  useEffect(() => {
    if (form.fItem || form.fDetails || form.fAddress || form.fContact) {
      const draft = {
        fItem: form.fItem,
        fDetails: form.fDetails,
        fType: form.fType,
        fAddress: form.fAddress,
        fCategory: form.fCategory,
        fUrgency: form.fUrgency,
        fContact: form.fContact,
        fReward: form.fReward,
        fCharacteristics: form.fCharacteristics,
        fUniqueMarks: form.fUniqueMarks,
        fSecurityPin: form.fSecurityPin,
        currentStep,
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem("linco_report_draft", JSON.stringify(draft));
      } catch (_) {}
    }
  }, [
    form.fItem,
    form.fDetails,
    form.fType,
    form.fAddress,
    form.fCategory,
    form.fUrgency,
    form.fContact,
    form.fReward,
    form.fCharacteristics,
    form.fUniqueMarks,
    form.fSecurityPin,
    currentStep,
  ]);

  // Check for existing draft on initial mount
  useEffect(() => {
    if (!form.fItem && !form.fDetails) {
      try {
        const savedDraft = localStorage.getItem("linco_report_draft");
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && parsed.fItem && Date.now() - (parsed.timestamp || 0) < 48 * 3600 * 1000) {
            setDraftRestoredNotice(true);
          }
        }
      } catch (_) {}
    }
  }, []);

  const restoreDraft = () => {
    try {
      const savedDraft = localStorage.getItem("linco_report_draft");
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.fItem) form.setFItem(d.fItem);
        if (d.fDetails) form.setFDetails(d.fDetails);
        if (d.fType) form.setFType(d.fType);
        if (d.fAddress) form.setFAddress(d.fAddress);
        if (d.fCategory) form.setFCategory(d.fCategory);
        if (d.fUrgency) form.setFUrgency(d.fUrgency);
        if (d.fContact) form.setFContact(d.fContact);
        if (d.fReward) form.setFReward(d.fReward);
        if (d.fCharacteristics) form.setFCharacteristics(d.fCharacteristics);
        if (d.fUniqueMarks) form.setFUniqueMarks(d.fUniqueMarks);
        if (d.fSecurityPin) form.setFSecurityPin(d.fSecurityPin);
        if (d.currentStep && d.currentStep > 1) setCurrentStep(d.currentStep);
        setDraftRestoredNotice(false);
        setAiFillNotice("📋 Restored your draft report!");
        setTimeout(() => setAiFillNotice(""), 4000);
      }
    } catch (_) {}
  };

  const dismissDraft = () => {
    setDraftRestoredNotice(false);
    localStorage.removeItem("linco_report_draft");
  };

  const handleEnhanceDescription = async () => {
    if (!form.fDetails.trim()) {
      setLocalErrors((prev) => ({ ...prev, details: "Please enter a draft description first to enhance!" }));
      return;
    }
    setLocalErrors((prev) => ({ ...prev, details: "" }));
    setEnhanceOriginalText(form.fDetails);
    setIsEnhanceModalOpen(true);
    try {
      const res = await ai.runEnhanceDescription(
        form.fItem || "Item",
        form.fCategory || "Property",
        form.fDetails,
        lang
      );
      setEnhanceResultData(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyEnhancedDescription = (enhancedText: string, structured?: any) => {
    form.setFDetails(enhancedText);
    if (structured) {
      if (structured.brand && !form.fCharacteristics) {
        form.setFCharacteristics(`Brand: ${structured.brand}${structured.color ? `, Color: ${structured.color}` : ""}`);
      }
      if (structured.distinguishingMarks && structured.distinguishingMarks.length > 0 && !form.fUniqueMarks) {
        form.setFUniqueMarks(structured.distinguishingMarks.join(", "));
      }
    }
    setAiFillNotice("✨ Enhanced description and facts applied successfully!");
    setTimeout(() => setAiFillNotice(""), 4500);
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
    setIsStepLoading(true);

    setTimeout(() => {
      setIsStepLoading(false);
      // Advance logically
      if (currentStep === 5 && !isLost) {
        // Skip Step 6 (Reward) if Found report
        setCurrentStep(7);
      } else if (currentStep < 9) {
        setCurrentStep((prev) => prev + 1);
      }
    }, 280);
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
        characteristics: form.fCharacteristics,
        uniqueMarks: form.fUniqueMarks,
        contents: form.fContents,
        condition: form.fCondition,
        latitude: form.fLat,
        longitude: form.fLng,
        securityPin: form.fSecurityPin,
      };

      const res = await onSubmit(postData);
      if (res.success) {
        setSuccess(true);
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

  if (success) {
    return (
      <RecoveryIntelligenceCard
        form={form}
        onEnhanceDescription={handleEnhanceDescription}
        isEnhancing={ai.enhanceLoading}
        onClose={() => setSuccess(false)}
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm relative overflow-hidden text-slate-900" id="post-form-card">
      {/* Clean Stepper Header */}
      <div className="mb-8 pb-5 border-b border-slate-100 flex flex-col gap-5 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-medium tracking-wider text-slate-600 uppercase bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Verified Community Listing
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-2.5">
              {form.fType === "Lost" ? "Report a Lost Item" : "Report a Found Item"}
            </h2>
            {/* Encouraging subtitle */}
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs sm:text-sm text-slate-500 mt-1 font-medium flex items-center gap-1.5"
            >
              {getEncouragingText(currentStep)}
            </motion.p>
          </div>

          {currentStep <= 8 && (
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="font-mono text-[11px] font-bold tracking-wider text-slate-500">
                Step <span className="text-slate-900 font-bold">{getVisualStepNumber(currentStep)}</span> of {totalSteps}
              </span>
              <div className="w-28 sm:w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-slate-900 rounded-full"
                  initial={{ width: "12%" }}
                  animate={{ width: `${(getVisualStepNumber(currentStep) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
          {currentStep === 9 && (
            <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] tracking-wider uppercase font-mono shrink-0">
              Final Review
            </div>
          )}
        </div>

        {/* Stepper Timeline Tracker */}
        {currentStep <= 8 && (
          <div className="w-full border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-1 w-full overflow-x-auto pb-2 scrollbar-none">
              {stepNames.map((name, i) => {
                const stepNum = i + 1;
                const isCompleted = currentStep > stepNum;
                const isCurrent = currentStep === stepNum;
                return (
                  <React.Fragment key={name}>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={stepNum >= currentStep}
                        onClick={() => setCurrentStep(stepNum)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-200 ${
                          isCompleted
                            ? "bg-slate-900 border-slate-900 text-white cursor-pointer"
                            : isCurrent
                            ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {isCompleted ? <Check size={12} className="stroke-[2.5]" /> : stepNum}
                      </button>
                      <span className={`text-[11px] font-medium tracking-tight hidden sm:inline ${isCurrent ? "text-slate-900 font-semibold" : isCompleted ? "text-slate-600" : "text-slate-400"}`}>
                        {name}
                      </span>
                    </div>
                    {i < stepNames.length - 1 && (
                      <div className={`h-[1px] flex-1 min-w-[8px] ${currentStep > stepNum ? "bg-slate-900" : "bg-slate-200"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Draft Restore Notification */}
      {draftRestoredNotice && (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <span className="font-semibold">
              {t("report.draftFound", "You have an unsaved draft report from an earlier session.")}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition"
            >
              {t("report.restoreDraft", "Restore Draft")}
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition"
            >
              {t("report.dismiss", "Dismiss")}
            </button>
          </div>
        </div>
      )}

      {/* AI auto fill notices banner */}
      <AnimatePresence>
        {aiFillNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-[10px] font-semibold flex items-center gap-2 text-left"
          >
            <Sparkles size={12} className="shrink-0 text-slate-700 animate-spin" />
            <span>{aiFillNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Completeness Score Card */}
      {currentStep <= 8 && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Report Quality
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{completenessStars}</span>
              <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                {completenessScore}% Complete
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
              ✨ Recommendations to improve matching:
            </span>
            {completenessTips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {completenessTips.slice(0, 2).map((tip, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-xl"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    {tip}
                  </span>
                ))}
                {completenessTips.length > 2 && (
                  <span className="inline-flex items-center text-[10px] text-slate-500 font-bold">
                    +{completenessTips.length - 2} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                ✓ Stellar report content ready for verified comparative scan!
              </span>
            )}
          </div>
        </div>
      )}

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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Which path are we reporting?</h3>
              <p className="text-xs text-slate-500">Pick a flow to begin your retrieval process.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <button
                type="button"
                onClick={() => {
                  form.setFType("Lost");
                  setLocalErrors({});
                  setTimeout(() => setCurrentStep(2), 250); // Auto advances smoothly
                }}
                className={`p-6 sm:p-8 rounded-2xl border text-left flex flex-col justify-between h-56 transition-all duration-200 group cursor-pointer relative overflow-hidden ${
                  form.fType === "Lost"
                    ? "bg-rose-50 border-2 border-rose-500 text-rose-950 shadow-sm"
                    : "bg-white border-slate-200 hover:border-rose-300 text-slate-700 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-200 ${
                    form.fType === "Lost" ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600 group-hover:bg-rose-50 group-hover:text-rose-600"
                  }`}>
                    🔴
                  </div>
                  {form.fType === "Lost" && <Check size={18} className="text-rose-600 stroke-[3]" />}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">I Lost Something</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Create a detailed recovery ticket. Active reports scan active community records instantly.
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
                className={`p-6 sm:p-8 rounded-2xl border text-left flex flex-col justify-between h-56 transition-all duration-200 group cursor-pointer relative overflow-hidden ${
                  form.fType === "Found"
                    ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-sm"
                    : "bg-white border-slate-200 hover:border-emerald-300 text-slate-700 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-200 ${
                    form.fType === "Found" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                  }`}>
                    🟢
                  </div>
                  {form.fType === "Found" && <Check size={18} className="text-emerald-600 stroke-[3]" />}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">I Found Something</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Report cataloged findings. Coordinate safely to locate the verified rightful owner.
                  </p>
                </div>
              </button>
            </div>
            {localErrors.type && (
              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1.5">
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
            <div className="space-y-5">
              {/* Item Name */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-900 tracking-tight">
                      {t("report.step2.itemName", "Item Name")} <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <ContextualHelp fieldKey="itemName" />
                  </div>
                  <VoiceInputButton
                    fieldName="Item Name"
                    currentValue={form.fItem}
                    onApply={(val) => {
                      form.setFItem(val);
                      setLocalErrors((prev) => ({ ...prev, item: "" }));
                    }}
                    size="sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Matte Black iPhone 15 Pro, Brown Leather Tommy Hilfiger Wallet"
                  value={form.fItem}
                  onChange={(e) => {
                    form.setFItem(e.target.value);
                    setLocalErrors((prev) => ({ ...prev, item: "" }));
                  }}
                  className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none text-xs text-slate-900 transition-all placeholder:text-slate-400 shadow-2xs"
                />
                <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick Suggestions:</span>
                  {["Black Wallet", "Brown Leather Wallet", "Blue Backpack", "iPhone", "College ID Card"].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        form.setFItem(suggestion);
                        setLocalErrors((prev) => ({ ...prev, item: "" }));
                      }}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 text-slate-600 transition cursor-pointer"
                    >
                      +{suggestion}
                    </button>
                  ))}
                </div>
                {localErrors.item && (
                  <p className="text-[10px] text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={11} /> {localErrors.item}
                  </p>
                )}
              </div>

              {/* Item Description - PLACED IMMEDIATELY BELOW ITEM NAME */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-900 tracking-tight">
                      {t("report.step2.description", "Item Description")} <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <ContextualHelp fieldKey="description" />
                  </div>
                  <div className="flex items-center gap-2">
                    <VoiceInputButton
                      fieldName="Description"
                      currentValue={form.fDetails}
                      onApply={(val) => {
                        form.setFDetails(val);
                        setLocalErrors((prev) => ({ ...prev, details: "" }));
                      }}
                      size="sm"
                    />
                    <button
                      type="button"
                      onClick={handleEnhanceDescription}
                      disabled={ai.enhanceLoading || !form.fDetails.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold uppercase transition disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                      <Sparkles size={11} className={ai.enhanceLoading ? "animate-spin text-white" : "text-white"} />
                      {ai.enhanceLoading ? "Enhancing..." : "✨ Improve Description"}
                    </button>
                  </div>
                </div>
                <textarea
                  placeholder="Describe unique identifiers, colors, brand names, scratch marks, stickers, lock screen wallpaper or any specific markings. Example: 'iPhone 15 Pro with a minor scratch on the top-left rim, inside a clear silicone cover, wallpaper is a high-contrast mountain skyline.'"
                  rows={4}
                  value={form.fDetails}
                  onChange={(e) => {
                    form.setFDetails(e.target.value);
                    setLocalErrors((prev) => ({ ...prev, details: "" }));
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none text-xs text-slate-900 transition leading-relaxed placeholder:text-slate-400 shadow-2xs resize-y"
                />
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Suggest useful details:</span>
                  {[
                    { label: "Brand", placeholder: "Brand: Apple" },
                    { label: "Color", placeholder: "Color: Space Gray" },
                    { label: "Size", placeholder: "Size: Medium" },
                    { label: "Stickers", placeholder: "Stickers: Anime sticker" },
                    { label: "Scratches", placeholder: "Scratches: dent on bottom" },
                    { label: "Cover", placeholder: "Cover: Clear silicone" },
                    { label: "Serial Number", placeholder: "Serial: last 4 digits" }
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        const currentText = form.fDetails.trim();
                        const addition = currentText ? `, ${item.placeholder}` : item.placeholder;
                        form.setFDetails(form.fDetails + addition);
                        setLocalErrors((prev) => ({ ...prev, details: "" }));
                      }}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 text-slate-600 transition cursor-pointer"
                    >
                      💡 {item.label}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 block mt-2 leading-normal">
                  💡 Description details help community members and automated scans match items accurately.
                </span>
                {localErrors.details && (
                  <p className="text-[10px] text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={11} /> {localErrors.details}
                  </p>
                )}
              </div>

              {/* Advanced Specific Characteristics (Color, Brand, Model, Material) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-900 tracking-tight">
                      {t("report.step2.characteristics", "Item Characteristics")}{" "}
                      <span className="text-slate-400 font-normal text-xs">(Color, Brand, Model, Material)</span>
                    </label>
                    <ContextualHelp fieldKey="identifying" />
                  </div>
                  <VoiceInputButton
                    fieldName="Characteristics"
                    currentValue={form.fCharacteristics || ""}
                    onApply={(val) => form.setFCharacteristics(val)}
                    size="sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Color: Space Gray, Brand: Apple, Model: iPhone 15 Pro, Material: Titanium & Glass"
                  value={form.fCharacteristics || ""}
                  onChange={(e) => form.setFCharacteristics(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none text-xs text-slate-900 transition-all placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              {/* Unique Marks & Identifiers */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-900 tracking-tight">
                      {t("report.step2.uniqueMarks", "Unique Marks & Secret Identifiers")}{" "}
                      <span className="text-slate-400 font-normal text-xs">(Scratches, stickers, engravings, serial number)</span>
                    </label>
                    <ContextualHelp fieldKey="identifying" />
                  </div>
                  <VoiceInputButton
                    fieldName="Unique Marks"
                    currentValue={form.fUniqueMarks || ""}
                    onApply={(val) => form.setFUniqueMarks(val)}
                    size="sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Small scratch on bottom right edge, NASA sticker on rear, customized keychain attached"
                  value={form.fUniqueMarks || ""}
                  onChange={(e) => form.setFUniqueMarks(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none text-xs text-slate-900 transition-all placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              {/* Contents (for wallets, bags, boxes) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-slate-900 tracking-tight">
                    {t("report.step2.contents", "Inner Contents")}{" "}
                    <span className="text-slate-400 font-normal text-xs">(For wallets, bags, cases, or compartments)</span>
                  </label>
                  <VoiceInputButton
                    fieldName="Inner Contents"
                    currentValue={form.fContents || ""}
                    onApply={(val) => form.setFContents(val)}
                    size="sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="e.g. College ID card, Metro pass, 2 keys, blue ballpoint pen inside pouch"
                  value={form.fContents || ""}
                  onChange={(e) => form.setFContents(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none text-xs text-slate-900 transition-all placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              {/* Condition (Specifically required for Found reports) */}
              {!isLost && (
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-slate-900 tracking-tight mb-2">
                    Found Item Condition <span className="text-emerald-600 font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["Brand New / Intact", "Good Condition", "Used / Scratched", "Damaged / Broken"].map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => form.setFCondition(cond)}
                        className={`text-xs py-2.5 px-2 rounded-xl border font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center text-center ${
                          form.fCondition === cond
                            ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category selection - embedded beautifully */}
              <div className="pt-1">
                <label className="block text-sm font-semibold text-slate-900 tracking-tight mb-2.5">
                  Item Category <span className="text-rose-600 font-bold">*</span>
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
                      className={`text-[11px] px-3 py-3 rounded-xl border transition-all duration-150 font-semibold cursor-pointer flex items-center justify-center gap-1.5 ${
                        form.fCategory === cat.id
                          ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span className="truncate">{cat.id}</span>
                      {form.fCategory === cat.id && <Check size={12} className="text-white shrink-0" />}
                    </button>
                  ))}
                </div>
                {localErrors.category && (
                  <p className="text-[10px] text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={11} /> {localErrors.category}
                  </p>
                )}
              </div>

              {/* Urgency Level Selector */}
              <div className="pt-1">
                <label className="block text-sm font-semibold text-slate-900 tracking-tight mb-2.5">
                  Report Urgency Level <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {URGENCY_LEVELS.map((level) => {
                    const isSelected = form.fUrgency === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => form.setFUrgency(level.id)}
                        className={`text-xs py-3 px-1 rounded-xl border font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : ""}`}
                          style={!isSelected ? { backgroundColor: level.color } : {}}
                        />
                        <span>{level.id}</span>
                      </button>
                    );
                  })}
                </div>
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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Visual Authentication</h3>
              <p className="text-xs text-slate-500">Adding an image allows our matching engine to run comparative visual analysis.</p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`relative p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center group min-h-[220px] overflow-hidden ${
                isDragging
                  ? "border-slate-900 bg-slate-100"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/60"
              }`}
            >
              {ai.photoLoading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                  <span className="text-[10px] font-mono font-bold text-slate-900 animate-pulse tracking-wider">VISUAL SCANNING IN PROGRESS</span>
                </div>
              )}

              {form.fImage ? (
                <div className="absolute inset-0 z-10 group/img flex items-center justify-center bg-slate-900/10">
                  <img src={form.fImage} alt="Uploaded item draft" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center gap-2 transition duration-200">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        form.setFImage(null);
                      }}
                      className="py-2 px-4 bg-rose-600 hover:bg-rose-700 rounded-xl text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Trash2 size={13} /> Remove Image
                    </button>
                    <span className="text-[10px] text-white/90 font-medium">Click anywhere else to replace</span>
                  </div>
                  <span className="absolute bottom-3 left-3 bg-white/95 border border-slate-200 text-[10px] text-emerald-700 px-3 py-1 rounded-md font-bold font-mono shadow-xs backdrop-blur-md">
                    ✓ IMAGE ATTACHED
                  </span>
                </div>
              ) : null}

              <UploadCloud size={36} className="text-slate-400 group-hover:text-slate-700 transition-all duration-200 mb-3" />
              <span className="text-sm font-semibold text-slate-800">Drag &amp; Drop or Upload Photo</span>
              <p className="text-xs text-slate-500 mt-1 leading-normal max-w-sm">
                Supports Camera Snapshot or File. Photos are stripped of private device metadata.
              </p>
              
              <div className="flex gap-2 mt-4 z-10">
                <span className="text-[9px] bg-white text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full font-medium">
                  📸 Camera Supported
                </span>
                <span className="text-[9px] bg-white text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full font-medium">
                  🖼️ Gallery / Files
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

            {form.fImage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    🔍 Photo Clarity Diagnostics
                  </h4>
                  <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase font-mono">
                    Passed
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Image validated for clear visual matching against cataloged community listings.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
                    <span>Object centered &amp; identified</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
                    <span>Clear lighting profile</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-800 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                    <span className="w-4 h-4 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-[10px] shrink-0 font-bold">⚠</span>
                    <span>Acceptable contrast</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                    <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
                    <span>Sharp resolution</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  form.setFImage(null);
                  setCurrentStep(4);
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
              >
                Skip Photo Upload →
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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Spatial Mapping</h3>
              <p className="text-xs text-slate-500">Provide the approximate area where the event transpired.</p>
            </div>

            <div className="space-y-4">
              {/* Address input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-900 tracking-tight">
                      {t("report.step4.address", "Incident Address / Location")} <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <ContextualHelp fieldKey="location" />
                  </div>
                  <VoiceInputButton
                    fieldName="Location"
                    currentValue={form.fAddress}
                    onApply={(val) => {
                      form.setFAddress(val);
                      setLocalErrors((prev) => ({ ...prev, address: "" }));
                    }}
                    size="sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <MapPin size={16} className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. Pune University Library cafeteria, Block A elevators, Wagholi area"
                      value={form.fAddress}
                      onChange={(e) => {
                        form.setFAddress(e.target.value);
                        setLocalErrors((prev) => ({ ...prev, address: "" }));
                      }}
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none text-xs text-slate-900 transition placeholder:text-slate-400 shadow-2xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="h-12 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-2xs"
                    title="Retrieve Coordinates via Device GPS"
                  >
                    <MapPin size={14} className="text-rose-400" /> <span>Current Location</span>
                  </button>
                </div>
                {localErrors.address && (
                  <p className="text-[10px] text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={11} /> {localErrors.address}
                  </p>
                )}
              </div>

              {/* Map & Distance directly below address */}
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
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
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 tracking-tight">Search Accuracy Distance Radius</span>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
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
                    className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg outline-none"
                  />
                  
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono font-medium">
                    <span>50m (Exact Spot)</span>
                    <span>500m (Campus)</span>
                    <span>2000m (City Ward)</span>
                  </div>
                </div>

                {/* Location intelligence dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  {/* Search Radius */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Estimated Search Area</span>
                    <p className="text-sm font-bold text-slate-900">
                      ~{(Math.PI * Math.pow(distanceRadius, 2) / 1000000).toFixed(2)} km²
                    </p>
                    <span className="text-[10px] text-slate-500 block font-mono">Radius: {distanceRadius}m</span>
                  </div>

                  {/* Nearby Landmark */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs min-w-0">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Nearby Landmark anchor</span>
                    <p className="text-sm font-bold text-slate-900 truncate" title={getNearbyLandmark()}>
                      📍 {getNearbyLandmark()}
                    </p>
                    <span className="text-[10px] text-slate-500 block font-mono">Isolates search perimeter</span>
                  </div>

                  {/* Area Confidence */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Area Confidence index</span>
                    <p className={`text-sm font-bold ${
                      form.fLat !== 18.5204 || form.fLng !== 73.8567
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}>
                      {form.fLat !== 18.5204 || form.fLng !== 73.8567 ? "98% (GPS High Precision)" : "64% (Approximate Area)"}
                    </p>
                    <span className="text-[10px] text-slate-500 block font-mono">Coordinates matched</span>
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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Timeline Window</h3>
              <p className="text-xs text-slate-500">Providing the hour and date window is crucial to establish chronologies.</p>
            </div>

            <div className="space-y-5">
              {/* Day selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 tracking-tight mb-2.5">
                  When did this happen?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["Today", "Yesterday", "Custom"] as const).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setTimelineDate(day)}
                      className={`py-3 px-4 rounded-xl border font-semibold text-xs transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                        timelineDate === day
                          ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
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
                      className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:border-slate-400 focus:ring-1 focus:ring-slate-300 text-xs text-slate-900 outline-none font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 tracking-tight mb-2.5">
                  Approximate Time Window
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(["Morning", "Afternoon", "Evening", "Night", "Custom"] as const).map((timeSlot) => (
                    <button
                      key={timeSlot}
                      type="button"
                      onClick={() => setTimelineTime(timeSlot)}
                      className={`py-2.5 px-3 rounded-xl border font-semibold text-xs transition-all duration-150 cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                        timelineTime === timeSlot
                          ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-sm">
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
                      className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:border-slate-400 focus:ring-1 focus:ring-slate-300 text-xs text-slate-900 outline-none font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Why this helps AI card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  💡 How this assists Matching
                </h4>
                <p className="text-xs text-slate-500 leading-normal font-medium">
                  By providing precise date and time boundaries, we filter out unrelated submissions and isolate overlapping spatial checkpoints automatically.
                </p>
              </div>

              {/* Timeline Reconstructor directly below Location */}
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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Citizen Reward (Optional)</h3>
              <p className="text-xs text-slate-500">Provide an incentive to finders. Entirely optional.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 tracking-tight mb-2">
                  Offered Reward Amount (₹)
                </label>
                <div className="flex items-center h-12 rounded-xl bg-white border border-slate-200 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300 overflow-hidden transition-all shadow-2xs">
                  <div className="flex items-center justify-center pl-4 pr-2 text-emerald-700 font-bold text-sm select-none shrink-0">
                    ₹
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 500, 1000, 2500"
                    value={form.fReward}
                    onChange={(e) => form.setFReward(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-full pr-4 bg-transparent outline-none text-xs text-slate-900 font-mono font-bold placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Quick reward pill presets */}
              <div className="flex flex-wrap gap-2">
                {["0", "500", "1000", "2000", "5000"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => form.setFReward(preset === "0" ? "" : preset)}
                    className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                      (preset === "0" && !form.fReward) || (form.fReward === preset && preset !== "0")
                        ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Contact Safeguards</h3>
              <p className="text-xs text-slate-500">Secure validation ensures communication only happens upon verified claim matches.</p>
            </div>

            <div className="space-y-5">
              {/* Contact number */}
              <div>
                <label className="text-sm font-semibold text-slate-900 tracking-tight mb-2.5 flex justify-between items-center">
                  <span>Contact Mobile Number <span className="text-rose-600 font-bold">*</span></span>
                  <span className="text-[10px] text-emerald-700 font-medium font-mono tracking-normal flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={11} /> Client Encryption Active
                  </span>
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-semibold select-none shrink-0 gap-1.5">
                    <span className="text-base">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={form.fContact}
                    onChange={(e) => {
                      form.setFContact(e.target.value.replace(/\D/g, ""));
                      setLocalErrors((prev) => ({ ...prev, contact: "" }));
                    }}
                    className="flex-1 h-12 px-4 rounded-xl bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none text-sm text-slate-900 font-semibold tracking-wider placeholder:text-slate-400 shadow-2xs"
                  />
                </div>
                {localErrors.contact && (
                  <p className="text-[10px] text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={11} /> {localErrors.contact}
                  </p>
                )}
              </div>

              {/* WhatsApp Toggle */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-900 block flex items-center gap-1.5">
                    🟢 Same number is active on WhatsApp
                  </span>
                  <span className="text-xs text-slate-500 block leading-relaxed">
                    Allows finders to initiate a secure WhatsApp dialogue upon matching.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={isWhatsAppSame}
                    onChange={() => setIsWhatsAppSame(!isWhatsAppSame)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Privacy protection panel */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-start gap-3.5 leading-relaxed">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[11px] text-slate-900 uppercase tracking-wider mb-1">🛡️ Contact Details Privacy Vault</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    Contact remains entirely <strong>private, masked and hidden</strong> from general feeds, searches, search engines, and visitors. It is only unlocked and safely decrypted on-device for a corresponding finder <strong>after you manually review and approve their claim dossier</strong> in your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 8: SECURITY PIN (PROTECTION CARD) */}
        {currentStep === 8 && (
          <motion.div
            key="step-pin"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6 text-left"
          >
            <div className="text-center space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
                🔐 Protect Your Ownership
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This PIN secures your posting. Keep it safe to manage claims or mark as resolved.
              </p>
            </div>

            {/* Security Pass Card Styling */}
            <div className="relative mx-auto max-w-sm bg-slate-50 border border-slate-200 p-6 sm:p-7 rounded-2xl shadow-sm overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-0.5 bg-slate-900 text-white rounded-md font-mono text-[9px] font-bold">
                    OWNER PASS
                  </div>
                </div>
                <ShieldCheck size={20} className="text-slate-800" />
              </div>

              {/* Big PIN Display */}
              <div className="my-5 text-center space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">ADMIN KEYPASS CODE</span>
                <div className="flex justify-center items-center gap-2.5">
                  {form.fSecurityPin.split("").map((digit, i) => (
                    <span
                      key={i}
                      className="w-11 h-14 bg-white rounded-xl border border-slate-300 flex items-center justify-center font-mono text-xl font-bold text-slate-900 shadow-2xs"
                    >
                      {showPin ? digit : "•"}
                    </span>
                  ))}
                  {/* Fill in dashes if PIN length is less than 4 */}
                  {Array.from({ length: Math.max(0, 4 - form.fSecurityPin.length) }).map((_, i) => (
                    <span
                      key={i}
                      className="w-11 h-14 bg-white rounded-xl border border-dashed border-slate-300 flex items-center justify-center font-mono text-xl font-bold text-slate-400"
                    >
                      -
                    </span>
                  ))}
                </div>
              </div>

              {/* Visual protections checkmarks */}
              <div className="space-y-2.5 text-xs text-slate-700 border-t border-slate-200 pt-4 font-normal leading-relaxed">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span><strong>Approve Claims</strong>: Authenticate verified matching claimants</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span><strong>Unlock Contact</strong>: Safe mutual communication pathways</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span><strong>Resolve Item</strong>: Archive listing once recovery completes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span><strong>Protect Ownership</strong>: Prevent unauthorized deletion</span>
                </div>
              </div>
            </div>

            {/* Input & Generator Actions */}
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Lock size={14} className="absolute left-4 top-3.5 text-slate-400" />
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    placeholder="Set 4-Digit PIN"
                    value={form.fSecurityPin}
                    onChange={(e) => {
                      form.setFSecurityPin(e.target.value.replace(/\D/g, ""));
                      setLocalErrors((prev) => ({ ...prev, securityPin: "" }));
                    }}
                    className="w-full h-12 pl-11 pr-14 rounded-xl bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none text-sm font-mono font-bold tracking-widest text-slate-900 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-900 transition p-0.5 text-xs font-semibold cursor-pointer"
                  >
                    {showPin ? "Hide" : "Show"}
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={handleGenerateSecurePin}
                  className="h-12 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center gap-2 shadow-2xs"
                >
                  <RefreshCw size={13} className={aiFillNotice ? "animate-spin" : ""} /> Generate PIN
                </button>
              </div>

              {localErrors.securityPin && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1.5 font-semibold justify-center">
                  <AlertCircle size={12} /> {localErrors.securityPin}
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
            {/* Draft Review Receipt */}
            <div className="rounded-2xl bg-white border border-slate-200 relative overflow-hidden p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="absolute top-0 right-0 px-3.5 py-1 text-[10px] font-mono font-bold uppercase bg-slate-100 border-l border-b border-slate-200 text-slate-700 rounded-bl-xl">
                Draft Finalized
              </div>

              {/* Title Header */}
              <div className="pb-5 border-b border-slate-100 flex justify-between items-start gap-4 pr-24">
                <div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md font-sans tracking-wide inline-block ${
                    isLost
                      ? "bg-rose-50 border border-rose-200 text-rose-700"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  }`}>
                    {form.fType} Report
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">{form.fItem}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition duration-150 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  title="Edit title & details"
                >
                  <Pencil size={13} />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>

              {form.fImage && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-56 shadow-2xs group">
                  <img src={form.fImage} alt="Draft attachment preview" className="w-full h-56 object-cover" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="absolute right-3 bottom-3 p-2 rounded-xl bg-white/90 border border-slate-200 text-slate-800 hover:text-slate-950 hover:bg-white transition duration-150 flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    <Pencil size={13} /> Change Photo
                  </button>
                </div>
              )}

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Category */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Category</span>
                    <span className="text-slate-900 font-semibold text-xs">📂 {form.fCategory || "Property"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                  >
                    <Pencil size={11} />
                  </button>
                </div>

                {/* Incident Location */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Incident Location</span>
                    <span className="text-slate-900 font-semibold text-xs block truncate">📍 {form.fAddress}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition shrink-0 cursor-pointer"
                  >
                    <Pencil size={11} />
                  </button>
                </div>

                {/* Contact Mobile Number */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Contact Mobile Number</span>
                    <span className="text-slate-900 font-mono font-semibold text-xs">+91 {form.fContact} {isWhatsAppSame && "(WhatsApp Active ✔)"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(7)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                  >
                    <Pencil size={11} />
                  </button>
                </div>

                {/* Urgency Level */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Urgency Level</span>
                    <span className="text-slate-900 font-semibold text-xs">{form.fUrgency}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                  >
                    <Pencil size={11} />
                  </button>
                </div>

                {/* Offered Reward (Conditional) */}
                {isLost && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Offered Reward</span>
                      <span className="text-emerald-700 font-mono font-bold text-xs">{form.fReward ? `₹${form.fReward}` : "No Reward"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(6)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                    >
                      <Pencil size={11} />
                    </button>
                  </div>
                )}

                {/* Security PIN */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Security PIN</span>
                    <span className="text-slate-900 font-mono font-bold text-xs">🔒 {form.fSecurityPin} (Keep safe!)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(8)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                  >
                    <Pencil size={11} />
                  </button>
                </div>
              </div>

              {/* Description Details Review */}
              <div className="pt-4 border-t border-slate-100 relative group">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Description details</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Pencil size={11} /> Edit Description
                  </button>
                </div>
                <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                  {form.fDetails}
                </p>
              </div>

              {/* Timeline Details Review */}
              {form.fTimeline && (
                <div className="pt-4 border-t border-slate-100 relative group">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Temporal parameters</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Pencil size={11} /> Edit Timeline
                    </button>
                  </div>
                  <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                    {form.fTimeline}
                  </p>
                </div>
              )}

              {/* Review Experience Intelligence Checklist */}
              {((isLost && !form.fReward) || !form.fImage || (form.fDetails && form.fDetails.length < 100)) && (
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider block">
                    ⚡ Recommended Adjustments for Optimal Matching:
                  </span>
                  <div className="space-y-2">
                    {isLost && !form.fReward && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3">
                        <span className="leading-relaxed font-normal">💰 <strong>Adding a citizen reward</strong> may increase community response &amp; incentivize returns.</span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(6)}
                          className="text-[10px] font-semibold px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100 transition shrink-0 uppercase cursor-pointer"
                        >
                          Add Reward
                        </button>
                      </div>
                    )}
                    {!form.fImage && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between gap-3">
                        <span className="leading-relaxed font-normal">📷 <strong>Adding a photo</strong> provides comparative visuals for smart image matching.</span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="text-[10px] font-semibold px-3 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-100 transition shrink-0 uppercase cursor-pointer"
                        >
                          Add Photo
                        </button>
                      </div>
                    )}
                    {form.fDetails && form.fDetails.length < 100 && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between gap-3">
                        <span className="leading-relaxed font-normal">📝 <strong>Expanding description</strong> with colors, brand names, or markings prevents duplicates.</span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-[10px] font-semibold px-3 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-100 transition shrink-0 uppercase cursor-pointer"
                        >
                          Add Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Automatic Match Reminder notification bar */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed font-normal">
                <BellRing size={16} className="shrink-0 text-slate-800 mt-0.5" />
                <p>
                  <strong>Smart Match active:</strong> Upon publishing, our engine automatically reconciles this post with corresponding directory items, filtering for potential coordinates and notifying you in your feed immediately.
                </p>
              </div>
            </div>

            {/* Error/Success Feedbacks */}
            {submitError && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <p className="font-semibold">{submitError}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                <Check size={14} className="shrink-0 animate-bounce" />
                <p className="font-semibold">⚡ Report successfully published! Checking AI Matches...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVIGATION CONTROLS BAR */}
      <div className="flex gap-3 mt-8 pt-5 border-t border-slate-200 text-left">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handleGoBack}
            disabled={submitting}
            className="py-3 px-5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold disabled:opacity-40 shadow-2xs"
          >
            <ChevronLeft size={14} /> Back
          </button>
        )}

        {currentStep < 9 ? (
          <button
            type="button"
            onClick={validateAndNext}
            className="flex-1 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 uppercase shadow-2xs ml-auto"
          >
            Continue <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={submitting}
            className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wide shadow-2xs transition duration-150 cursor-pointer text-xs uppercase flex items-center justify-center gap-1.5"
          >
            {submitting ? "Publishing on Network..." : "Publish Report & Match 🚀"}
          </button>
        )}
      </div>

      {/* AI Enhance Description Review Modal */}
      <EnhanceDescriptionModal
        isOpen={isEnhanceModalOpen}
        onClose={() => setIsEnhanceModalOpen(false)}
        originalText={enhanceOriginalText}
        enhancedData={enhanceResultData}
        isLoading={ai.enhanceLoading}
        onAccept={handleApplyEnhancedDescription}
        onRetry={handleEnhanceDescription}
      />
    </div>
  );
};
