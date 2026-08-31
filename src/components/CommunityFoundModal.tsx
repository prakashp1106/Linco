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
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#07070d] border border-[#161626] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 text-left"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#141420] bg-gradient-to-r from-emerald-950/20 via-[#0a0a14] to-indigo-950/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  <span>I Have This Item</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 uppercase">
                    Zero-Trust Protocol
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Verify finding <strong className="text-slate-200">{lostPost.item}</strong> without leaking private data
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-[#12121a] hover:bg-[#1a1a24] text-slate-400 hover:text-white transition cursor-pointer border border-[#1a1a26]"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
            {!createdMatch ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Lost Item Summary Preview */}
                <div className="p-3.5 rounded-2xl bg-[#040408] border border-[#141422] flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider block">Lost Item Reported</span>
                    <span className="text-slate-200 font-bold">{lostPost.item} ({lostPost.category})</span>
                    <span className="text-slate-400 text-[10px] block">📍 {lostPost.address}</span>
                  </div>
                  {lostPost.reward && (
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 uppercase block">Reward</span>
                      <span className="text-emerald-400 font-black">₹{lostPost.reward}</span>
                    </div>
                  )}
                </div>

                {/* Privacy Guarantee Banner */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold font-mono">
                    <Shield size={13} className="text-indigo-400" />
                    <span>Private &amp; Authenticated Matching</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    The owner's direct WhatsApp and phone number will remain hidden until your answers are verified and both parties mutually approve trust.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Finder Identity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Your Name / Identifier <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Alex Kumar"
                      value={finderName}
                      onChange={(e) => setFinderName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090912] border border-[#1c1c2e] text-xs text-white outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Your WhatsApp Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={finderContact}
                      onChange={(e) => setFinderContact(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090912] border border-[#1c1c2e] text-xs text-white font-mono outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Verification Questions */}
                <div className="space-y-4 pt-1">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-emerald-400" />
                    <span>Item Verification Questions</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Where did you find it? <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Near Cafeteria Bench 4, 2nd Floor"
                        value={whereFound}
                        onChange={(e) => setWhereFound(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090912] border border-[#1c1c2e] text-xs text-white outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Approximate Date &amp; Time Found <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Today around 3:30 PM"
                        value={whenFound}
                        onChange={(e) => setWhenFound(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090912] border border-[#1c1c2e] text-xs text-white outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      What exactly did you find? (Brief Description) <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Found a black leather cardholder wallet with a metallic zipper..."
                      value={foundDetails}
                      onChange={(e) => setFoundDetails(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090912] border border-[#1c1c2e] text-xs text-white outline-none focus:border-emerald-500 leading-relaxed"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Unique Characteristics / Secret Details <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Has a small star sticker on corner, worn leather on back side..."
                      value={uniqueCharacteristics}
                      onChange={(e) => setUniqueCharacteristics(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090912] border border-[#1c1c2e] text-xs text-white outline-none focus:border-emerald-500 leading-relaxed"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Inside Contents / Specific Items (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Contains a metro card, loyalty pass, student ID..."
                      value={insideContents}
                      onChange={(e) => setInsideContents(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090912] border border-[#1c1c2e] text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                    Attach Item Photo (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2.5 rounded-xl bg-[#0c0c16] hover:bg-[#141424] border border-[#1c1c2e] text-xs text-slate-300 font-bold flex items-center gap-2 cursor-pointer transition">
                      <Camera size={14} className="text-emerald-400" />
                      <span>{imageUrl ? "Replace Photo" : "Upload Found Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imageUrl && (
                      <span className="text-xs text-emerald-400 font-mono">Photo attached ✓</span>
                    )}
                  </div>
                  {imageUrl && (
                    <div className="mt-2 w-28 h-20 rounded-xl overflow-hidden border border-[#1c1c2e]">
                      <img src={imageUrl} alt="Uploaded item" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Security PIN */}
                <div className="p-4 rounded-2xl bg-[#040408] border border-[#141422] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound size={15} className="text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                        Create Your Security PIN
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">4-6 digits</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    You will need this PIN to confirm trust, send coordination chat, and approve handover.
                  </p>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Enter 4-digit PIN"
                    value={securityPin}
                    onChange={(e) => setSecurityPin(e.target.value)}
                    className="w-40 px-3.5 py-2.5 rounded-xl bg-[#090912] border border-[#1c1c2e] text-xs text-white font-mono text-center outline-none focus:border-emerald-500 tracking-widest"
                    required
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Sparkles size={14} className="animate-spin" />
                        <span>AI Generating Forensic Match Score...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Submit Verification Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success / Result View */
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
                  <CheckCircle2 size={32} />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg font-extrabold text-slate-100">
                    Verification Submitted &amp; Owner Alerted!
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    Your report for <strong className="text-slate-200">{lostPost.item}</strong> has been registered. The owner has been notified to review your answers.
                  </p>
                </div>

                {/* Match Score Card */}
                <div className="p-4 rounded-2xl bg-[#040408] border border-[#141422] max-w-md mx-auto space-y-3 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-[#10101c]">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">AI Similarity Assessment</span>
                    <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-500/20">
                      {createdMatch.matchScore ?? createdMatch.similarityScore ?? 85}% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono italic">
                    "{createdMatch.reason}"
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Status: OWNER_REVIEW_PENDING</span>
                    <span>PIN Saved Securely</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
                  <button
                    onClick={() => {
                      handleClose();
                      if (onNavigateToMatches) {
                        onNavigateToMatches(createdMatch.matchId);
                      }
                    }}
                    className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/40"
                  >
                    <span>View Match in Hub</span>
                    <ArrowRight size={13} />
                  </button>

                  <button
                    onClick={handleClose}
                    className="px-6 py-3 rounded-2xl bg-[#12121a] hover:bg-[#1a1a24] text-slate-300 text-xs font-bold uppercase tracking-wider transition cursor-pointer border border-[#1a1a26]"
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
