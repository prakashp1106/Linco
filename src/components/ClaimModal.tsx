/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ShieldCheck, X, RefreshCw, AlertTriangle, CheckCircle, Copy, ExternalLink, Phone, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Post, Claim } from "../types";
import { useAI } from "../hooks/useAI";
import { apiService } from "../services/api";

interface ClaimModalProps {
  isOpen: boolean;
  claimingPost: Post | null;
  matchedPostId?: string;
  onClose: () => void;
  onClaimSubmitted?: (claim: Claim) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  claimingPost,
  matchedPostId,
  onClose,
  onClaimSubmitted,
}) => {
  const { runVerificationQuestions } = useAI();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Claim fields
  const [claimantName, setClaimantName] = useState("");
  const [claimantContact, setClaimantContact] = useState("");
  const [claimQuestions, setClaimQuestions] = useState<string[]>([]);
  const [claimAnswers, setClaimAnswers] = useState<string[]>([]);

  // Success state
  const [createdClaim, setCreatedClaim] = useState<Claim | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load questions when claimingPost is selected
  useEffect(() => {
    if (isOpen && claimingPost) {
      setClaimQuestions([]);
      setClaimAnswers([]);
      setClaimantName("");
      setClaimantContact("");
      setCreatedClaim(null);
      setCopiedLink(false);
      setErrorMsg("");
      setLoading(true);

      runVerificationQuestions(claimingPost.item, claimingPost.details, claimingPost.id)
        .then((questions) => {
          setClaimQuestions(questions);
          setClaimAnswers(questions.map(() => ""));
        })
        .catch(() => {
          const fallbackQuestions = [
            "Can you describe any unique scratches, contents, or branding?",
            "Where and around what time did you lose this item?",
          ];
          setClaimQuestions(fallbackQuestions);
          setClaimAnswers(fallbackQuestions.map(() => ""));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, claimingPost, runVerificationQuestions]);

  const handleSubmitClaim = async () => {
    if (!claimingPost) return;
    if (!claimantName.trim()) {
      setErrorMsg("Please enter your name");
      return;
    }
    if (!claimantContact.trim()) {
      setErrorMsg("Please enter your WhatsApp contact number");
      return;
    }
    if (claimAnswers.some((a) => !a.trim())) {
      setErrorMsg("Please answer all verification questions");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await apiService.submitClaim(claimingPost.id, {
        claimantName,
        claimantContact,
        questions: claimQuestions,
        answers: claimAnswers,
        matchedPostId,
      });

      if (res.success && res.claim) {
        setCreatedClaim(res.claim);
        if (onClaimSubmitted) {
          onClaimSubmitted(res.claim);
        }
      } else {
        throw new Error("Failed to register claim on server");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process claim submission");
    } finally {
      setSubmitting(false);
    }
  };

  const getMagicLink = () => {
    if (!createdClaim) return "";
    return `${window.location.origin}?claimId=${createdClaim.id}&code=${createdClaim.trackingCode}`;
  };

  const handleCopyMagicLink = () => {
    navigator.clipboard.writeText(getMagicLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && claimingPost && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          id="claim-modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-[#0a0a0d] border border-[#1c1c26] rounded-3xl p-6.5 w-full max-w-md shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-violet-500 opacity-60" />
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-[#12121a] text-slate-500 hover:text-slate-300 transition cursor-pointer"
            >
              <X size={15} />
            </button>

            {!createdClaim ? (
              <>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-indigo-400 uppercase tracking-widest mb-2 bg-indigo-950/30 px-3 py-1 rounded-full border border-indigo-500/10 w-fit">
                  <ShieldCheck size={12} className="text-indigo-400 animate-pulse" /> Submit Verified Ownership Claim
                </div>
                <h3 className="text-base font-display font-extrabold text-slate-100 mb-1">
                  Prove ownership of {claimingPost.item}
                </h3>
                <p className="text-[12px] text-slate-400 leading-relaxed mb-5">
                  Enter your contact coordinates and solve the Gemini-generated verification query below. The verified creator will evaluate your inputs to coordinate recovery.
                </p>

                {/* Loader */}
                {loading && (
                  <div className="py-14 text-center text-[12px] text-slate-400 font-medium space-y-3.5 bg-[#030304] rounded-2xl border border-[#161621] p-6">
                    <RefreshCw className="animate-spin inline-block text-indigo-400" size={24} />
                    <p className="font-mono tracking-wider text-[10px] uppercase text-slate-500">Formulating custom verification query with Gemini AI...</p>
                  </div>
                )}

                {/* Form Area */}
                {!loading && claimQuestions.length > 0 && (
                  <div className="space-y-4.5 max-h-[55vh] overflow-y-auto pr-1">
                    {/* Claimant Name & Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-[#030304]/80 p-3.5 rounded-2xl border border-[#161621]">
                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          <User size={11} className="text-slate-500" /> Your Name
                        </label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={claimantName}
                          onChange={(e) => setClaimantName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090c] border border-[#1a1a24] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-200 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          <Phone size={11} className="text-slate-500" /> WhatsApp Number
                        </label>
                        <input
                          type="tel"
                          placeholder="10-digit number"
                          value={claimantContact}
                          onChange={(e) => setClaimantContact(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090c] border border-[#1a1a24] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-200 transition"
                        />
                      </div>
                    </div>

                    {/* AI Questions */}
                    <div className="space-y-4">
                      <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest border-b border-[#161621] pb-1.5 flex items-center gap-1">
                        🔑 Gemini-Generated Verification Queries:
                      </div>
                      {claimQuestions.map((q, idx) => (
                        <div key={idx} className="space-y-2 bg-[#030304]/40 border border-[#161621] p-3.5 rounded-2xl">
                          <label className="block text-[11px] font-semibold text-slate-200 leading-relaxed">
                            Q{idx + 1}: {q}
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Please detail physical details, color, scratches, contents or tags..."
                            value={claimAnswers[idx] || ""}
                            onChange={(e) => {
                              const updated = [...claimAnswers];
                              updated[idx] = e.target.value;
                              setClaimAnswers(updated);
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090c] border border-[#1a1a24] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-200 transition resize-none leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>

                    {errorMsg && (
                      <div className="text-[11px] text-rose-300 flex items-center gap-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                        <AlertTriangle size={14} className="shrink-0 text-rose-400" /> {errorMsg}
                      </div>
                    )}

                    <div className="flex gap-2.5 pt-2">
                      <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-3 rounded-xl bg-[#030304] border border-[#1c1c26] text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-50 hover:bg-[#12121a]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitClaim}
                        disabled={submitting}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold transition cursor-pointer text-xs flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-950/20 active:scale-[0.98]"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="animate-spin text-white" size={13} /> Submitting...
                          </>
                        ) : (
                          "Submit Claim"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Success State */
              <div className="text-center py-4 space-y-5 animate-fade-in">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <CheckCircle size={32} />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-display font-extrabold text-slate-100">Claim Registered Successfully!</h3>
                  <p className="text-[12px] text-slate-400 leading-relaxed mt-1">
                    Your claim details have been recorded and vetted by Gemini AI. Safe custody tracking information is generated below.
                  </p>
                </div>

                {/* Tracking Details Box */}
                <div className="bg-[#030304] border border-[#161621] p-4.5 rounded-2xl text-left space-y-3.5 shadow-inner">
                  <div className="flex justify-between items-center pb-2 border-b border-[#14141d]">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      Claim Identifier
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {createdClaim.id}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-[#14141d]">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      Security Verification Code
                    </span>
                    <span className="text-base font-mono font-extrabold text-indigo-400 tracking-wider">
                      {createdClaim.trackingCode}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      AI Similarity Score
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-[#121217] h-1.5 rounded-full overflow-hidden border border-[#1a1a24]">
                        <div 
                          className={`h-full ${createdClaim.aiScore >= 80 ? "bg-emerald-500" : createdClaim.aiScore >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${createdClaim.aiScore}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-black text-indigo-400 whitespace-nowrap">
                        {createdClaim.aiScore}% Match
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic bg-[#09090c] p-2 rounded-lg border border-[#1a1a24]/40">
                      "{createdClaim.aiReason}"
                    </p>
                  </div>
                </div>

                {/* Magic Link Area */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Magic Direct link (Track across browsers)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={getMagicLink()}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-[#030304] border border-[#1c1c26] text-[10px] font-mono text-slate-400 outline-none truncate"
                    />
                    <button
                      onClick={handleCopyMagicLink}
                      className="px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border border-indigo-500/25 active:scale-[0.97]"
                    >
                      <Copy size={12} /> {copiedLink ? "Copied" : "Copy Link"}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-[#030304] border border-[#1c1c26] text-slate-300 hover:text-white transition text-xs font-bold cursor-pointer hover:bg-[#12121a] active:scale-[0.97]"
                  >
                    Close &amp; Check Back Later
                  </button>
                </div>
              </div>
            )}
          </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
