/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
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
  BellRing
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

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [aiFillNotice, setAiFillNotice] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch (err: any) {
      console.error("Failed to compress upload image:", err);
    }
  };

  const handlePhotoAIAnalysis = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    if ("dataTransfer" in e) {
      file = e.dataTransfer.files?.[0];
    } else if (e.target) {
      file = (e.target as HTMLInputElement).files?.[0];
    }
    if (!file) return;

    try {
      const compressedBase64 = await imageService.compressImage(file, 800, 0.85);
      form.setFImage(compressedBase64);
      
      const res = await ai.runPhotoAnalyzer(compressedBase64);

      let count = 0;
      if (res.item && !form.fItem.trim()) { form.setFItem(res.item); count++; }
      if (res.category) { form.setFCategory(res.category); count++; }
      if (res.details) { form.setFDetails(res.details); count++; }
      if (res.urgency) { form.setFUrgency(res.urgency as any); count++; }
      
      if (count > 0) {
        setAiFillNotice(`✨ Gemini successfully auto-filled ${count} fields from photo!`);
        setTimeout(() => setAiFillNotice(""), 6000);
      }
    } catch (err: any) {
      console.error("AI Photo analyzer failed:", err);
    }
  };

  // Drag and drop handlers
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
    handlePhotoAIAnalysis(e);
  };

  // Speak / Voice logic
  const handleVoiceInput = async () => {
    if (ai.voiceActive) {
      ai.setVoiceActive(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please type manually!");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-IN"; // Tailored for Indian accented English & Hindi mixed words
    rec.interimResults = false;

    rec.onstart = () => {
      ai.setVoiceActive(true);
    };

    rec.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      ai.setVoiceActive(false);
      try {
        const res = await ai.runVoiceAnalyzer(transcript);
        let count = 0;
        if (res.item && !form.fItem.trim()) { form.setFItem(res.item); count++; }
        if (res.category) { form.setFCategory(res.category); count++; }
        if (res.details) { form.setFDetails(res.details); count++; }
        if (res.urgency) { form.setFUrgency(res.urgency as any); count++; }
        
        if (count > 0) {
          setAiFillNotice(`✨ Gemini auto-filled ${count} fields from your voice report!`);
          setTimeout(() => setAiFillNotice(""), 6000);
        }
      } catch (err: any) {
        console.error("AI Voice recognition failed:", err);
      }
    };

    rec.onerror = () => {
      ai.setVoiceActive(false);
    };

    rec.onend = () => {
      ai.setVoiceActive(false);
    };

    rec.start();
  };

  // Premium Micro-interaction: Try simulated template to let users understand in 5s!
  const handleSimulatedVoiceTemplate = async (text: string) => {
    try {
      const res = await ai.runVoiceAnalyzer(text);
      let count = 0;
      if (res.item && !form.fItem.trim()) { form.setFItem(res.item); count++; }
      if (res.category) { form.setFCategory(res.category); count++; }
      if (res.details) { form.setFDetails(res.details); count++; }
      if (res.urgency) { form.setFUrgency(res.urgency as any); count++; }
      
      if (count > 0) {
        setAiFillNotice(`✨ Gemini auto-filled ${count} fields using simulated quick-test template!`);
        setTimeout(() => setAiFillNotice(""), 6000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!form.fDetails.trim()) {
      alert("Please write a draft description first!");
      return;
    }
    try {
      const enhanced = await ai.runEnhanceDescription(
        form.fItem,
        form.fCategory || "Property",
        form.fDetails
      );
      form.setFDetails(enhanced);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinalSubmit = async () => {
    if (form.step === 1 && !form.validateStep1()) return;

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
        }, 3000);
      } else {
        throw new Error(res.error || "Post publication rejected");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to publish post. Please check PIN.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-950/40 border border-slate-900 rounded-[32px] p-4 sm:p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden" id="post-form-card">
      <div className="absolute top-0 right-10 w-48 h-48 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header section */}
      <div className="mb-6 pb-4 border-b border-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
            Publish a New Report
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Report instantly with AI Auto-Fill in seconds or enter details manually.
          </p>
        </div>

        {/* Premium Compact Stepper */}
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-950/60 p-1.5 rounded-2xl border border-slate-900">
          <span className={`px-3 py-1.5 rounded-xl transition ${form.step === 1 ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-600"}`}>
            1. Report Details
          </span>
          <ChevronRight size={10} className="text-slate-700" />
          <span className={`px-3 py-1.5 rounded-xl transition ${form.step === 2 ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "text-slate-600"}`}>
            2. Review &amp; Post
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {form.step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* 1. INSTANT AI AUTO-FILL PANEL (FIRST NOTICEABLE ELEMENT) */}
            <div className="space-y-3">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-cyan-400 block text-left">
                ⚡ Instant AI Auto-Fill (Fastest)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Recognition Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`relative p-5 rounded-2xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center group min-h-[140px] overflow-hidden ${
                    isDragging
                      ? "border-cyan-400 bg-cyan-950/10"
                      : "border-slate-800 bg-slate-950/20 hover:border-cyan-500/30 hover:bg-slate-950/40"
                  }`}
                >
                  {ai.photoLoading && (
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 z-20">
                      <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                      <span className="text-[10px] font-mono font-bold text-cyan-400 animate-pulse tracking-wider">AI IMAGE ANALYSIS IN PROGRESS</span>
                      <div className="absolute inset-x-0 h-[2px] bg-cyan-500/60 shadow-[0_0_8px_#06b6d4] animate-scan top-0" />
                    </div>
                  )}

                  {form.fImage ? (
                    <div className="absolute inset-0 z-10 group/img flex items-center justify-center bg-slate-950/60">
                      <img src={form.fImage} alt="Uploaded Item" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition duration-200">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            form.setFImage(null);
                          }}
                          className="p-2 bg-rose-500 hover:bg-rose-600 rounded-lg text-white font-bold text-xs flex items-center gap-1.5"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                        <span className="text-[10px] text-slate-300 font-mono">Click to replace</span>
                      </div>
                      <span className="absolute bottom-2 left-2 bg-cyan-500/20 border border-cyan-400/30 text-[9px] text-cyan-300 px-2 py-0.5 rounded-md font-bold font-mono">
                        ✓ ATTACHED
                      </span>
                    </div>
                  ) : null}

                  <UploadCloud size={24} className="text-slate-500 group-hover:text-cyan-400 transition duration-200 mb-2" />
                  <span className="text-xs font-extrabold text-slate-200">AI Image Recognition</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-1">
                    Drag &amp; drop or click to upload a photo
                  </span>
                  <span className="text-[9px] text-cyan-400/70 font-mono font-bold mt-1.5 uppercase tracking-wider bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/40">
                    Auto-populates categories &amp; names
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Voice Reporting Panel */}
                <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 flex flex-col justify-between text-left min-h-[140px] relative overflow-hidden">
                  {ai.voiceLoading && (
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 z-20">
                      <div className="w-10 h-10 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                      <span className="text-[10px] font-mono font-bold text-violet-400 animate-pulse tracking-wider">AI EXTRACTING FROM VOICE</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                        <Mic size={14} className="text-violet-400" /> Voice Reporter
                      </span>
                      {ai.voiceActive && (
                        <span className="text-[9px] font-bold text-rose-400 animate-pulse font-mono flex items-center gap-1">
                          ● LISTENING
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal font-medium">
                      Press microphone &amp; speak naturally (Hindi/English). We'll map the report!
                    </p>
                  </div>

                  {/* Pulsing Voice Trigger */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 cursor-pointer ${
                        ai.voiceActive
                          ? "bg-rose-500 text-white animate-pulse shadow-[0_0_15px_#f43f5e]"
                          : "bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20"
                      }`}
                    >
                      <Mic size={18} className={ai.voiceActive ? "animate-pulse" : ""} />
                    </button>

                    {/* Quick Simulated Voice Templates (Reduce testing efforts to 5s) */}
                    <div className="space-y-1 text-[9px] text-slate-400">
                      <span className="text-slate-500 block font-bold font-mono">QUICK TEST TEMPLATES:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSimulatedVoiceTemplate("I lost a shiny red iPhone 15 near Symbiosis library")}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-violet-500/30 hover:text-violet-300 transition text-[9px] font-bold text-left"
                        >
                          "Lost red iPhone 15 near library"
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulatedVoiceTemplate("Found a leather keyring with gold keys at the cafeteria")}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-violet-500/30 hover:text-violet-300 transition text-[9px] font-bold text-left"
                        >
                          "Found gold keys in cafeteria"
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Auto-Fill Feedback banner */}
              <AnimatePresence>
                {aiFillNotice && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center gap-2 text-left"
                  >
                    <Sparkles size={12} className="shrink-0 text-cyan-400 animate-spin" />
                    <span>{aiFillNotice}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. ESSENTIAL FIELDS FORM (MINIMIZES OVERWHELMING INPUT) */}
            <div className="space-y-5 border-t border-slate-900/60 pt-5 text-left">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-slate-500 block">
                📝 Essential Details
              </span>

              {/* Lost or Found selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
                  Report Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      form.setFType("Lost");
                      form.setErrors((prev) => ({ ...prev, type: undefined }));
                    }}
                    className={`py-4 rounded-2xl border flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
                      form.fType === "Lost"
                        ? "bg-rose-950/20 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-950/10"
                        : "bg-slate-950/30 border-slate-900/60 text-slate-500 hover:border-slate-800 hover:text-slate-400"
                    }`}
                  >
                    <span className="text-xl">🚨</span>
                    <span className="text-xs font-black font-display uppercase tracking-wide">I Lost Something</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      form.setFType("Found");
                      form.setErrors((prev) => ({ ...prev, type: undefined }));
                    }}
                    className={`py-4 rounded-2xl border flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
                      form.fType === "Found"
                        ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/10"
                        : "bg-slate-950/30 border-slate-900/60 text-slate-500 hover:border-slate-800 hover:text-slate-400"
                    }`}
                  >
                    <span className="text-xl">🤝</span>
                    <span className="text-xs font-black font-display uppercase tracking-wide">I Found Something</span>
                  </button>
                </div>
                {form.errors.type && (
                  <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={10} /> {form.errors.type}
                  </p>
                )}
              </div>

              {/* Item category */}
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
                  Item Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        form.setFCategory(cat.id);
                        form.setErrors((prev) => ({ ...prev, category: undefined }));
                      }}
                      className={`text-[11px] px-3 py-2 rounded-xl border transition font-bold cursor-pointer flex items-center gap-1.5 ${
                        form.fCategory === cat.id
                          ? "bg-cyan-500/10 border-cyan-400/50 text-cyan-300 scale-105"
                          : "bg-slate-950/30 border-slate-900 text-slate-400 hover:border-slate-800"
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.id}</span>
                      {form.fCategory === cat.id && <Check size={10} className="text-cyan-400 ml-0.5" />}
                    </button>
                  ))}
                </div>
                {form.errors.category && (
                  <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={10} /> {form.errors.category}
                  </p>
                )}
              </div>

              {/* Two Column details for layout spacing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Leather Wallet, Golden Ring, Keychain"
                    value={form.fItem}
                    onChange={(e) => {
                      form.setFItem(e.target.value);
                      form.setErrors((prev) => ({ ...prev, item: undefined }));
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-100 transition font-bold placeholder:text-slate-600 shadow-inner"
                  />
                  {form.errors.item && (
                    <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1 font-semibold">
                      <AlertCircle size={10} /> {form.errors.item}
                    </p>
                  )}
                </div>

                {/* Where did it happen / Location */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Incident Location
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. Symbiosis Cafe, Pune"
                      value={form.fAddress}
                      onChange={(e) => {
                        form.setFAddress(e.target.value);
                        form.setErrors((prev) => ({ ...prev, address: undefined }));
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-100 transition font-bold placeholder:text-slate-600 shadow-inner"
                    />
                  </div>
                  {form.errors.address && (
                    <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1 font-semibold">
                      <AlertCircle size={10} /> {form.errors.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Mobile Contact Number */}
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Contact Mobile Number</span>
                  <span className="text-[9px] text-emerald-400 font-bold lowercase font-mono tracking-normal flex items-center gap-1">
                    <ShieldCheck size={10} /> End-to-End Encrypted
                  </span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-500 font-bold text-xs">
                    +91
                  </span>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="9876543210"
                    value={form.fContact}
                    onChange={(e) => {
                      form.setFContact(e.target.value.replace(/\D/g, ""));
                      form.setErrors((prev) => ({ ...prev, contact: undefined }));
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-100 font-bold tracking-wider placeholder:text-slate-600 shadow-inner"
                  />
                </div>
                {form.errors.contact && (
                  <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle size={10} /> {form.errors.contact}
                  </p>
                )}
              </div>
            </div>

            {/* 3. PROGRESSIVE DISCLOSURE FOR ADVANCED TOOLS (KEEPS BEGINNERS UNBURDENED) */}
            <div className="border-t border-slate-900/60 pt-4 text-left">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950/80 border border-slate-900 hover:border-slate-800 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <div>
                    <span className="text-xs font-extrabold text-slate-200 block">
                      Advanced Custom Recovery Tools (Optional)
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      Add Description Polish, Cash Rewards, Interactive Map, Timelines &amp; Custom PINs
                    </span>
                  </div>
                </div>
                {showAdvanced ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400 group-hover:text-cyan-400 transition" />
                )}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="py-5 space-y-6 space-x-0.5">
                      {/* Detailed Description */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                            Detailed Description
                          </label>
                          <button
                            type="button"
                            onClick={handleEnhanceDescription}
                            disabled={ai.enhanceLoading || !form.fDetails.trim()}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[9px] font-extrabold text-emerald-400 uppercase transition disabled:opacity-40 cursor-pointer"
                          >
                            <Sparkles size={10} className={ai.enhanceLoading ? "animate-spin" : ""} />
                            {ai.enhanceLoading ? "Polishing..." : "Polish with AI"}
                          </button>
                        </div>
                        <textarea
                          placeholder="Describe colors, engravings, scratches, lock-screen layout, model numbers..."
                          rows={3}
                          value={form.fDetails}
                          onChange={(e) => {
                            form.setFDetails(e.target.value);
                            form.setErrors((prev) => ({ ...prev, details: undefined }));
                          }}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-100 transition leading-relaxed placeholder:text-slate-600 shadow-inner resize-y font-mono"
                        />
                      </div>

                      {/* Map Location pin */}
                      <div className="space-y-2">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                          Pin Accurate Geo Coordinates on Map
                        </label>
                        <div className="rounded-2xl overflow-hidden h-52 border border-slate-900">
                          <ErrorBoundary fallbackTitle="Interactive Map Error">
                            <InteractiveMap
                              onChange={(lat, lng) => {
                                form.setFLat(lat);
                                form.setFLng(lng);
                              }}
                              onAddressChange={(address) => {
                                form.setFAddress(address);
                              }}
                              lat={form.fLat}
                              lng={form.fLng}
                            />
                          </ErrorBoundary>
                        </div>
                      </div>

                      {/* Cash Rewards */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                            Cash Reward Offered (Optional ₹)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 500, 1000, 2000"
                            value={form.fReward}
                            onChange={(e) => form.setFReward(e.target.value.replace(/\D/g, ""))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-100 transition font-mono placeholder:text-slate-600 shadow-inner"
                          />
                        </div>

                        <RewardSection
                          itemName={form.fItem}
                          itemDescription={form.fDetails}
                          onSetSuggestedReward={(amount) => form.setFReward(amount)}
                          currentReward={form.fReward}
                        />
                      </div>

                      {/* Timeline Tracer (Lost items advanced helper) */}
                      {form.fType === "Lost" && (
                        <div className="space-y-2 pt-2 border-t border-slate-900/40">
                          <TimelineSection
                            itemName={form.fItem}
                            onSelectSuggestedAddress={(addr) => form.setFAddress(addr)}
                          />
                        </div>
                      )}

                      {/* Automated Security PIN */}
                      <div className="space-y-2 pt-4 border-t border-slate-900/40 bg-slate-950/20 p-4 rounded-2xl border border-slate-900/60">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                            4-Digit Security PIN
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="text-slate-400 hover:text-white transition p-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {showPin ? <EyeOff size={12} /> : <Eye size={12} />}
                            {showPin ? "Hide" : "Reveal PIN"}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          We generated a random PIN for you below. Use it to edit, resolve or delete this listing later without typing a password.
                        </p>
                        <div className="relative max-w-xs">
                          <Lock size={12} className="absolute left-3.5 top-3.5 text-slate-500" />
                          <input
                            type={showPin ? "text" : "password"}
                            maxLength={4}
                            placeholder="••••"
                            value={form.fSecurityPin}
                            onChange={(e) => {
                              form.setFSecurityPin(e.target.value.replace(/\D/g, ""));
                              form.setErrors((prev) => ({ ...prev, securityPin: undefined }));
                            }}
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs font-mono font-bold tracking-widest text-slate-200 transition shadow-inner"
                          />
                        </div>
                        {form.errors.securityPin && (
                          <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-semibold">
                            <AlertCircle size={10} /> {form.errors.securityPin}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step navigation and trigger */}
            <button
              type="button"
              onClick={form.nextStep}
              className="w-full py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 uppercase shadow-lg shadow-cyan-950/20"
            >
              Continue to Review <ChevronRight size={14} />
            </button>
          </motion.div>
        )}

        {form.step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6 text-left"
          >
            {/* Draft Review Receipt (Extremely Premium Slate look) */}
            <div className="rounded-[24px] bg-slate-900/10 border border-slate-900 relative overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="absolute top-0 right-0 px-4 py-1.5 text-[9px] font-mono font-bold uppercase bg-cyan-500/15 border-l border-b border-cyan-500/25 text-cyan-300 rounded-bl-xl">
                Ready to Publish
              </div>

              {/* Title Header */}
              <div className="pb-4 border-b border-slate-900/80">
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md font-sans tracking-widest ${
                  form.fType === "Lost"
                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                }`}>
                  🚨 {form.fType} Listing
                </span>
                <h3 className="text-lg font-extrabold text-slate-100 mt-2 font-display">{form.fItem}</h3>
              </div>

              {form.fImage && (
                <div className="rounded-2xl overflow-hidden border border-slate-900 max-h-48 shadow-lg">
                  <img src={form.fImage} alt="Attachment" className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                </div>
              )}

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Category</span>
                  <span className="text-slate-300 font-bold">📂 {form.fCategory}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Location</span>
                  <span className="text-slate-300 font-bold flex items-center gap-1">📍 {form.fAddress}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Contact mobile</span>
                  <span className="text-slate-300 font-mono font-bold">+91 {form.fContact}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Urgency Level</span>
                  <span className="text-slate-300 font-bold">{form.fUrgency}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block mb-0.5">Offered Reward</span>
                  <span className="text-emerald-400 font-mono font-black">{form.fReward ? `₹${form.fReward}` : "No Reward"}</span>
                </div>
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

              {/* Automatic Match Reminder notification bar */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-950/10 border border-violet-900/40 text-violet-300 text-[10px] leading-normal font-medium">
                <BellRing size={14} className="shrink-0 text-violet-400 mt-0.5" />
                <p>
                  <strong>Gemini Smart Match active:</strong> Upon publishing, the AI model will automatically analyze this listing against our real-time India directory and notify you immediately of any potential duplicates or owner candidates.
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

            {/* Navigation action buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={form.prevStep}
                className="py-3.5 px-5 rounded-2xl bg-slate-950/80 border border-slate-900 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
              >
                <ChevronLeft size={14} /> Back
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-black hover:text-black tracking-wide shadow-lg transition duration-150 cursor-pointer text-xs uppercase"
              >
                {submitting ? "Publishing on Network..." : "Publish Report & Match 🚀"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
