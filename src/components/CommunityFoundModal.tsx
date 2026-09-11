/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ShieldCheck,
  X,
  Sparkles,
  MapPin,
  Calendar,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  ArrowRight,
  Shield,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Post, PotentialMatch } from "../types";
import { apiService } from "../services/api";

interface CommunityFoundModalProps {
  isOpen: boolean;
  lostPost: Post | null;
  onClose: () => void;
  addToast?: (message: string, type?: "error" | "warn" | "info" | "success") => void;
  onMatchCreated?: (match: PotentialMatch) => void;
  onFoundReportCreated?: (foundPost: Post, match?: PotentialMatch) => void;
  onNavigateToMatches?: (matchId: string) => void;
}

export const CommunityFoundModal: React.FC<CommunityFoundModalProps> = ({
  isOpen,
  lostPost,
  onClose,
  addToast,
  onMatchCreated,
  onFoundReportCreated,
  onNavigateToMatches
}) => {
  const [finderName, setFinderName] = useState("");
  const [finderContact, setFinderContact] = useState("");
  const [whereFound, setWhereFound] = useState("");
  const [whenFound, setWhenFound] = useState("");
  const [foundDetails, setFoundDetails] = useState("");
  const [uniqueCharacteristics, setUniqueCharacteristics] = useState("");
  const [insideContents, setInsideContents] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdMatch, setCreatedMatch] = useState<PotentialMatch | null>(null);

  const resetForm = () => {
    setFinderName("");
    setFinderContact("");
    setWhereFound("");
    setWhenFound("");
    setFoundDetails("");
    setUniqueCharacteristics("");
    setInsideContents("");
    setSecurityPin("");
    setImageUrl("");
    setErrorMsg("");
    setCreatedMatch(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setErrorMsg("Image file size should be less than 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostPost) return;

    if (!finderName.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!finderContact.trim()) {
      setErrorMsg("Please enter your WhatsApp contact number.");
      return;
    }
    if (!whereFound.trim() || !whenFound.trim() || !foundDetails.trim() || !uniqueCharacteristics.trim()) {
      setErrorMsg("Please fill out all verification questions to establish authenticity.");
      return;
    }
    if (!securityPin.trim() || securityPin.length < 4) {
      setErrorMsg("Please set a 4-6 digit Security PIN to protect your submission.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      const detailsArray = [
        foundDetails.trim(),
        uniqueCharacteristics.trim() ? `Unique marks: ${uniqueCharacteristics.trim()}` : "",
        whenFound.trim() ? `Found at: ${whenFound.trim()}` : "",
        insideContents.trim() ? `Contents: ${insideContents.trim()}` : ""
      ].filter(Boolean);

      const res = await apiService.submitCommunityFound({
        lostPostId: lostPost.id,
        finderName: finderName.trim(),
        finderContact: finderContact.trim(),
        finderSecurityPin: securityPin.trim(),
        foundLocation: whereFound.trim(),
        foundDetails: detailsArray.join(" | "),
        foundImage: imageUrl || undefined,
        answers: [
          whereFound.trim(),
          whenFound.trim(),
          foundDetails.trim(),
          uniqueCharacteristics.trim(),
          insideContents.trim()
        ],
        questions: [
          "Where did you find the item?",
          "When did you find it?",
          "Describe the item details",
          "What unique marks or characteristics does it have?",
          "What are the contents or specific traits?"
        ]
      });

      if (res.success && res.match) {
        setCreatedMatch(res.match);
        if (onMatchCreated) {
          onMatchCreated(res.match);
        }
        if (onFoundReportCreated && res.post) {
          onFoundReportCreated(res.post, res.match);
        }
        if (addToast) {
          addToast("🎉 Found report created and sent to owner for verification!", "success");
        }
      } else {
        throw new Error("Failed to process your verification report.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !lostPost) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          className="bg-[#0c0e16] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl my-8 text-left"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <span>I Found This Item</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Report found details for <span className="text-slate-200 font-medium">{lostPost.item}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#121520] transition cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
            {!createdMatch ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Lost Item Summary Preview */}
                <div className="p-3.5 rounded-xl bg-[#121520] border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-rose-400 font-medium uppercase tracking-wider block">Lost Item</span>
                    <span className="text-slate-200 font-semibold">{lostPost.item} ({lostPost.category})</span>
                    <span className="text-slate-400 text-xs block">📍 {lostPost.address}</span>
                  </div>
                  {lostPost.reward && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Reward</span>
                      <span className="text-emerald-400 font-bold">₹{lostPost.reward}</span>
                    </div>
                  )}
                </div>

                {/* Privacy Guarantee Banner */}
                <div className="p-3.5 rounded-xl bg-[#121520] border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
                    <Shield size={14} className="text-indigo-400 shrink-0" />
                    <span>Privacy protection</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Personal contact details remain protected until both you and the owner review information and mutually approve a safe handover.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Finder Identity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Your Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Kumar"
                      value={finderName}
                      onChange={(e) => setFinderName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#121520] border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Your WhatsApp Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={finderContact}
                      onChange={(e) => setFinderContact(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#121520] border border-slate-800 text-xs text-slate-100 font-mono outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Verification Questions */}
                <div className="space-y-4 pt-1">
                  <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-400" />
                    <span>Item Verification Details</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Where did you find it? <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Near Cafeteria Bench, 2nd Floor"
                        value={whereFound}
                        onChange={(e) => setWhereFound(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#121520] border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Approximate Date &amp; Time <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Today around 3:30 PM"
                        value={whenFound}
                        onChange={(e) => setWhenFound(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#121520] border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Brief Description <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Black leather cardholder wallet with metallic zipper..."
                      value={foundDetails}
                      onChange={(e) => setFoundDetails(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#121520] border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500 leading-relaxed"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Unique Marks or Characteristics <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Small star sticker on corner, slight scratch on back..."
                      value={uniqueCharacteristics}
                      onChange={(e) => setUniqueCharacteristics(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#121520] border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500 leading-relaxed"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Inside Contents / Items (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Metro card, student pass..."
                      value={insideContents}
                      onChange={(e) => setInsideContents(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#121520] border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-medium text-slate-300 block">
                    Photo of Found Item (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-3.5 py-2 rounded-xl bg-[#121520] hover:bg-[#1a1f2e] border border-slate-800 text-xs text-slate-300 font-medium flex items-center gap-2 cursor-pointer transition">
                      <Camera size={14} className="text-indigo-400" />
                      <span>{imageUrl ? "Change photo" : "Upload photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imageUrl && (
                      <span className="text-xs text-emerald-400 font-medium">Photo attached ✓</span>
                    )}
                  </div>
                  {imageUrl && (
                    <div className="mt-2 w-28 h-20 rounded-xl overflow-hidden border border-slate-800">
                      <img src={imageUrl} alt="Uploaded item" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Security PIN */}
                <div className="p-4 rounded-xl bg-[#121520] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound size={15} className="text-indigo-400" />
                      <span className="text-xs font-semibold text-slate-200">
                        Create a 4-Digit PIN
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">4-6 digits</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    You will use this PIN to authenticate chats and confirm item return.
                  </p>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="e.g. 1234"
                    value={securityPin}
                    onChange={(e) => setSecurityPin(e.target.value)}
                    className="w-36 px-3.5 py-2 rounded-xl bg-[#0c0e16] border border-slate-800 text-xs text-slate-100 font-mono text-center outline-none focus:border-indigo-500 tracking-widest"
                    required
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Sparkles size={14} className="animate-spin" />
                        <span>Submitting report...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Submit Found Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success / Result View */
              <div className="space-y-5 text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 size={28} />
                </div>

                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base font-semibold text-slate-100">
                    Report Sent to Owner
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your details for <strong className="text-slate-200">{lostPost.item}</strong> have been recorded. The owner has been notified to review your submission.
                  </p>
                </div>

                {/* Match Score Card */}
                <div className="p-4 rounded-xl bg-[#121520] border border-slate-800 max-w-md mx-auto space-y-2.5 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-xs font-medium text-slate-400">Similarity Match</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {createdMatch.matchScore ?? createdMatch.similarityScore ?? 85}% match
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "{createdMatch.reason}"
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2 max-w-md mx-auto">
                  <button
                    onClick={() => {
                      handleClose();
                      if (onNavigateToMatches) {
                        onNavigateToMatches(createdMatch.matchId);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>View Match</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    onClick={handleClose}
                    className="px-5 py-2.5 rounded-xl bg-[#121520] hover:bg-[#1a1f2e] text-slate-300 text-xs font-medium transition cursor-pointer border border-slate-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
