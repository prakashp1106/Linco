/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Camera, Mic, Trash2, ShieldCheck, MapPin, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { usePostForm } from "../hooks/usePostForm";
import { useAI } from "../hooks/useAI";
import { useMaps } from "../hooks/useMaps";
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

  // Handling Image uploads with client compression & thumbnail creation!
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress the image down to < 500KB
      const compressedBase64 = await imageService.compressImage(file, 800, 0.85);
      form.setFImage(compressedBase64);
    } catch (err: any) {
      console.error("Failed to compress upload image:", err);
    }
  };

  const handlePhotoAIAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await imageService.compressImage(file, 800, 0.85);
      const res = await ai.runPhotoAnalyzer(compressedBase64);

      if (res.item) form.setFItem(res.item);
      if (res.category) form.setFCategory(res.category);
      if (res.details) form.setFDetails(res.details);
      if (res.urgency) form.setFUrgency(res.urgency as any);
      form.setFImage(compressedBase64);
    } catch (err: any) {
      console.error("AI Photo analyzer failed:", err);
    }
  };

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
    rec.lang = "en-IN"; // English/Indian accent or Hindi
    rec.interimResults = false;

    rec.onstart = () => {
      ai.setVoiceActive(true);
    };

    rec.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      ai.setVoiceActive(false);
      try {
        const res = await ai.runVoiceAnalyzer(transcript);
        if (res.item) form.setFItem(res.item);
        if (res.category) form.setFCategory(res.category);
        if (res.details) form.setFDetails(res.details);
        if (res.urgency) form.setFUrgency(res.urgency as any);
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
    if (form.step === 2 && !form.validateStep2()) {
      form.setStep(2);
      return;
    }

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
    <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl relative" id="post-form-card">
      <div className="absolute top-0 right-10 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
      <h2 className="text-2xl md:text-3xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mb-6 pb-2 border-b border-slate-900">
        Publish a New Item Post
      </h2>

      {/* Progress Steps Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-8 text-[10px] md:text-xs font-mono font-bold tracking-widest text-slate-500 uppercase pb-4 border-b border-slate-900/40">
        <span className={form.step === 1 ? "text-cyan-400 border-b border-cyan-400 pb-1" : ""}>Step 1: Basic</span>
        <ChevronRight size={10} className="text-slate-700" />
        <span className={form.step === 2 ? "text-cyan-400 border-b border-cyan-400 pb-1" : ""}>Step 2: Additional</span>
        <ChevronRight size={10} className="text-slate-700" />
        <span className={form.step === 3 ? "text-cyan-400 border-b border-cyan-400 pb-1" : ""}>Step 3: AI Assist</span>
        <ChevronRight size={10} className="text-slate-700" />
        <span className={form.step === 4 ? "text-cyan-400 border-b border-cyan-400 pb-1" : ""}>Step 4: Review</span>
      </div>

      <AnimatePresence mode="wait">
        {form.step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            {/* Type selector */}
            <div>
              <label className="block text-sm md:text-base font-extrabold text-slate-200 uppercase tracking-wider mb-3">
                What happened?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    form.setFType("Lost");
                    form.setErrors((prev) => ({ ...prev, type: undefined }));
                  }}
                  className={`py-5 rounded-3xl border flex flex-col items-center justify-center gap-2 transition duration-200 cursor-pointer ${
                    form.fType === "Lost"
                      ? "bg-rose-950/20 border-rose-500/40 text-rose-300"
                      : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <span className="text-3xl">🚨</span>
                  <span className="text-base font-black font-display">I Lost Something</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    form.setFType("Found");
                    form.setErrors((prev) => ({ ...prev, type: undefined }));
                  }}
                  className={`py-5 rounded-3xl border flex flex-col items-center justify-center gap-2 transition duration-200 cursor-pointer ${
                    form.fType === "Found"
                      ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <span className="text-3xl">🤝</span>
                  <span className="text-base font-black font-display">I Found Something</span>
                </button>
              </div>
              {form.errors.type && (
                <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} /> {form.errors.type}
                </p>
              )}
            </div>

            {/* Form Category selection */}
            <div>
              <label className="block text-sm md:text-base font-extrabold text-slate-200 uppercase tracking-wider mb-3">
                Category
              </label>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      form.setFCategory(cat.id);
                      form.setErrors((prev) => ({ ...prev, category: undefined }));
                    }}
                    className={`text-xs md:text-sm px-4 py-3 rounded-2xl border transition duration-150 font-extrabold cursor-pointer ${
                      form.fCategory === cat.id
                        ? "bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-lg scale-105"
                        : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800"
                    }`}
                  >
                    {cat.emoji} {cat.id}
                  </button>
                ))}
              </div>
              {form.errors.category && (
                <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} /> {form.errors.category}
                </p>
              )}
            </div>

            {/* Item title */}
            <div>
              <label className="block text-sm md:text-base font-extrabold text-slate-200 uppercase tracking-wider mb-2.5">
                Item Name
              </label>
              <input
                type="text"
                placeholder="What item is it? (e.g. Leather Wallet, Red iPhone 14, Keychain)"
                value={form.fItem}
                onChange={(e) => {
                  form.setFItem(e.target.value);
                  form.setErrors((prev) => ({ ...prev, item: undefined }));
                }}
                className="w-full px-5 py-4 rounded-2xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-base md:text-lg text-slate-100 transition duration-150 font-extrabold placeholder:text-slate-600 shadow-inner"
              />
              {form.errors.item && (
                <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} /> {form.errors.item}
                </p>
              )}
            </div>

            {/* Description (Must stay immediately below Item Name) */}
            <div>
              <label className="block text-sm md:text-base font-extrabold text-slate-200 uppercase tracking-wider mb-2.5">
                Detailed Description
              </label>
              <textarea
                placeholder="Describe color, scratches, lock-screen layout, model names..."
                rows={4}
                value={form.fDetails}
                onChange={(e) => {
                  form.setFDetails(e.target.value);
                  form.setErrors((prev) => ({ ...prev, details: undefined }));
                }}
                className="w-full px-5 py-4 rounded-2xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-100 transition leading-relaxed placeholder:text-slate-600 shadow-inner resize-y font-mono"
              />
              {form.errors.details && (
                <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} /> {form.errors.details}
                </p>
              )}
            </div>

            {/* Location Address */}
            <div>
              <label className="block text-sm md:text-base font-extrabold text-slate-200 uppercase tracking-wider mb-2.5">
                Where did it happen? (Location)
              </label>
              <input
                type="text"
                placeholder="Building, Landmark, Cafe, City (e.g. Symbiosis Cafe, Pune)"
                value={form.fAddress}
                onChange={(e) => {
                  form.setFAddress(e.target.value);
                  form.setErrors((prev) => ({ ...prev, address: undefined }));
                }}
                className="w-full px-5 py-4 rounded-2xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-base md:text-lg text-slate-100 transition duration-150 font-extrabold placeholder:text-slate-600 shadow-inner"
              />
              {form.errors.address && (
                <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} /> {form.errors.address}
                </p>
              )}
            </div>

            {/* Interactive Map Selector */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-extrabold text-slate-200 uppercase tracking-wider">
                Pin Location on Map
              </label>
              <div className="rounded-3xl overflow-hidden h-64 border border-slate-900">
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

            {/* Mobile Contact Number */}
            <div>
              <label className="block text-sm md:text-base font-extrabold text-slate-200 uppercase tracking-wider mb-2.5">
                Contact Mobile Number (End-to-End Encrypted)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-5 text-slate-500 font-bold text-base md:text-lg">
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
                  className="w-full pl-16 pr-5 py-4 rounded-2xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-base md:text-lg text-slate-100 font-extrabold tracking-wider placeholder:text-slate-600 shadow-inner"
                />
              </div>
              {form.errors.contact && (
                <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} /> {form.errors.contact}
                </p>
              )}
            </div>

            {/* Step navigation */}
            <button
              type="button"
              onClick={form.nextStep}
              className="w-full py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-base tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
            >
              Continue to Step 2 <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {form.step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {/* Photo Attachment upload */}
            <div>
              <label className="block text-sm md:text-base font-extrabold text-slate-200 uppercase tracking-wider mb-3">
                Upload Photo (Optional)
              </label>
              {form.fImage ? (
                <div className="relative rounded-3xl overflow-hidden border border-slate-800 max-h-56 group">
                  <img src={form.fImage} alt="Attachment Preview" className="w-full h-56 object-cover referrer-policy-no-referrer" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => form.setFImage(null)}
                    className="absolute top-3.5 right-3.5 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-7 border border-dashed border-slate-800 hover:border-cyan-500/30 rounded-3xl cursor-pointer bg-slate-950/20 hover:bg-slate-950/40 transition text-center">
                  <span className="text-4xl mb-2">🖼️</span>
                  <span className="text-xs text-slate-300 font-extrabold">Upload Photo Attachment</span>
                  <span className="text-[10px] text-slate-500 mt-1 font-medium">Max file size: 5 MB</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm md:text-base font-extrabold text-slate-200 uppercase tracking-wider mb-3">
                Urgency Level
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {URGENCY_LEVELS.map((urg) => (
                  <button
                    key={urg.id}
                    type="button"
                    onClick={() => form.setFUrgency(urg.id)}
                    className={`text-[10px] font-extrabold py-3.5 rounded-2xl border text-center transition uppercase tracking-wider cursor-pointer ${
                      form.fUrgency === urg.id
                        ? `${urg.cls} border-opacity-100 scale-105`
                        : "bg-slate-950/40 border-slate-900 text-slate-500 hover:border-slate-800"
                    }`}
                  >
                    {urg.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Reward */}
            <div>
              <label className="block text-sm md:text-base font-extrabold text-slate-200 uppercase tracking-wider mb-2.5">
                Reward Offering amount (Optional ₹)
              </label>
              <input
                type="text"
                placeholder="e.g. 500, 1000, 5000"
                value={form.fReward}
                onChange={(e) => form.setFReward(e.target.value.replace(/\D/g, ""))}
                className="w-full px-5 py-4 rounded-2xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-base text-slate-100 transition font-mono placeholder:text-slate-600 shadow-inner"
              />
            </div>

            {/* Security PIN */}
            <div>
              <label className="block text-sm md:text-base font-extrabold text-slate-200 uppercase tracking-wider mb-2.5">
                Choose a 4-Digit Security PIN (Crucial for Resolve/Delete)
              </label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={form.fSecurityPin}
                onChange={(e) => {
                  form.setFSecurityPin(e.target.value.replace(/\D/g, ""));
                  form.setErrors((prev) => ({ ...prev, securityPin: undefined }));
                }}
                className="w-full text-center tracking-[1em] text-xl font-mono font-bold py-3 px-4 rounded-2xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-slate-100 transition shadow-inner"
              />
              {form.errors.securityPin && (
                <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} /> {form.errors.securityPin}
                </p>
              )}
            </div>

            {/* Step navigation row */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={form.prevStep}
                className="py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={form.nextStep}
                className="flex-1 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
              >
                Continue to Step 3 <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {form.step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {/* AI Assist Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-900 text-left">
                ✨ Optional AI Assistants
              </h3>

              {/* AI Quick Fill Photo & Voice Analyzer */}
              <div className="p-5 md:p-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/10 via-slate-950/40 to-cyan-950/10 relative overflow-hidden text-left">
                <span className="absolute top-0 right-0 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/20 border-b border-l border-violet-500/10 text-violet-300 rounded-bl-xl">
                  ⚡ Smart Assist
                </span>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-violet-400 uppercase tracking-wider mb-1">
                  <Sparkles size={14} /> Gemini AI Quick Fill
                </div>
                <p className="text-[11px] text-slate-400 mb-4 font-medium">
                  Extract and update listing parameters using voice or an uploaded photograph.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-xs font-extrabold text-violet-300 hover:text-violet-100 transition duration-200 cursor-pointer text-center">
                    <Camera size={14} className={ai.photoLoading ? "animate-spin" : ""} />
                    {ai.photoLoading ? "Reading photo..." : "AI Photo Analysis"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoAIAnalysis}
                      className="hidden"
                      disabled={ai.photoLoading}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    disabled={ai.voiceLoading}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-extrabold transition duration-200 text-center cursor-pointer ${
                      ai.voiceActive
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse"
                        : "bg-rose-600/10 hover:bg-rose-600/20 border-rose-500/20 text-rose-300 hover:text-rose-100"
                    }`}
                  >
                    {ai.voiceActive ? <Mic size={14} className="text-rose-400 animate-ping" /> : <Mic size={14} className={ai.voiceLoading ? "animate-spin" : ""} />}
                    {ai.voiceLoading ? "Deducing..." : ai.voiceActive ? "Stop Voice Input" : "Voice Input"}
                  </button>
                </div>
              </div>

              {/* Description Enhancer */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-900/80 backdrop-blur-md space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-400" />
                      AI Description Enhancement
                    </h4>
                    <p className="text-[10px] text-slate-500">Polish your description into a professional detailed report</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnhanceDescription}
                    disabled={ai.enhanceLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/20 text-[10px] font-extrabold text-emerald-400 uppercase transition duration-150 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles size={12} className={ai.enhanceLoading ? "animate-spin" : ""} />
                    {ai.enhanceLoading ? "Polishing..." : "Enhance"}
                  </button>
                </div>
              </div>

              {/* Timeline Tracer */}
              {form.fType === "Lost" ? (
                <TimelineSection
                  itemName={form.fItem}
                  onSelectSuggestedAddress={(addr) => form.setFAddress(addr)}
                />
              ) : (
                <p className="text-[10px] text-slate-500 text-left pl-1">
                  💡 Timeline tracing is optimized for Lost reports.
                </p>
              )}

              {/* Reward suggestions */}
              <RewardSection
                itemName={form.fItem}
                itemDescription={form.fDetails}
                onSetSuggestedReward={(amount) => form.setFReward(amount)}
                currentReward={form.fReward}
              />
            </div>

            {/* Step navigation row */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={form.prevStep}
                className="py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={form.nextStep}
                className="flex-1 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
              >
                Continue to Review <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {form.step === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {/* Draft Preview card */}
            <div className="p-6 rounded-3xl bg-slate-900/20 border border-slate-900/80 space-y-5 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">Listing Draft Preview</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                  form.fType === "Lost"
                    ? "bg-rose-500/10 border border-rose-500/25 text-rose-300"
                    : "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                }`}>
                  🚨 {form.fType} Report
                </span>
              </div>

              {form.fImage && (
                <div className="rounded-2xl overflow-hidden border border-slate-900 max-h-48">
                  <img src={form.fImage} alt="Preview Attachment" className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Item Name</span>
                  <span className="text-slate-200 font-bold">{form.fItem}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Category</span>
                  <span className="text-slate-200 font-bold">📂 {form.fCategory}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Contact Number</span>
                  <span className="text-slate-200 font-mono font-bold">+91 {form.fContact}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Location</span>
                  <span className="text-slate-200 font-bold">📍 {form.fAddress}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Urgency Level</span>
                  <span className="text-slate-200 font-bold">{form.fUrgency}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Reward Amount</span>
                  <span className="text-emerald-400 font-mono font-black">{form.fReward ? `₹${form.fReward}` : "No Reward"}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-900/60">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Detailed Description</span>
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap bg-slate-950/55 p-3 rounded-xl border border-slate-900 font-mono">
                  {form.fDetails}
                </p>
              </div>
            </div>

            {/* Error/Success Feedbacks */}
            {submitError && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left">
                <AlertCircle size={14} className="shrink-0" />
                <p>{submitError}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-left">
                <Check size={14} className="shrink-0 animate-bounce" />
                <p>⚡ Report successfully published! Checking Gemini AI Matches...</p>
              </div>
            )}

            {/* Step Navigation & Submission row */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={form.prevStep}
                className="py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-extrabold hover:text-black tracking-wide shadow-lg transition duration-150 cursor-pointer text-xs"
              >
                {submitting ? "Publishing..." : "Publish Lost / Found Post"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
