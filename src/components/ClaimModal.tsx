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

  if (!isOpen || !claimingPost) return null;

  return (
    <AnimatePresence>
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
          className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1 rounded-lg hover:bg-slate-950 text-slate-500 hover:text-slate-300 transition cursor-pointer"
          >
            <X size={16} />
          </button>

          {!createdClaim ? (
            <>
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">
                <ShieldCheck size={14} /> Submit Ownership Claim
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">
                Prove ownership of {claimingPost.item}
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                Enter your details and answer the AI-generated verification questions. The owner will review your claim and decide whether to reveal contact info.
              </p>

              {/* Loader */}
              {loading && (
                <div className="py-12 text-center text-xs text-slate-400 font-medium space-y-2">
                  <RefreshCw className="animate-spin inline-block text-cyan-400" size={20} />
                  <p>Formulating customized questions via Gemini AI...</p>
                </div>
              )}

              {/* Form Area */}
              {!loading && claimQuestions.length > 0 && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {/* Claimant Name & Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <User size={10} /> Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="E.g., John Doe"
                        value={claimantName}
                        onChange={(e) => setClaimantName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 outline-none text-xs text-slate-200 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <Phone size={10} /> WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        placeholder="10-digit number"
                        value={claimantContact}
                        onChange={(e) => setClaimantContact(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 outline-none text-xs text-slate-200 transition"
                      />
                    </div>
                  </div>

                  {/* AI Questions */}
                  <div className="space-y-3.5">
                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      AI Verification Questions:
                    </div>
                    {claimQuestions.map((q, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <label className="block text-[10px] font-medium text-slate-300 leading-relaxed">
                          Q{idx + 1}: {q}
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Be as specific and honest as possible..."
                          value={claimAnswers[idx] || ""}
                          onChange={(e) => {
                            const updated = [...claimAnswers];
                            updated[idx] = e.target.value;
                            setClaimAnswers(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 outline-none text-xs text-slate-200 transition resize-none"
                        />
                      </div>
                    ))}
                  </div>

                  {errorMsg && (
                    <div className="text-[10px] text-red-400 flex items-center gap-1 bg-red-950/20 p-2.5 rounded-xl border border-red-900/30">
                      <AlertTriangle size={12} className="shrink-0" /> {errorMsg}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={onClose}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitClaim}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-extrabold transition cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="animate-spin" size={14} /> Submitting...
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
                <div className="w-16 h-16 rounded-full bg-emerald-950/30 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <CheckCircle size={36} />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">Claim Submitted!</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  Your claim has been successfully submitted and analyzed by Gemini AI. Keep your tracking details safe!
                </p>
              </div>

              {/* Tracking Details Box */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-left space-y-3.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Claim ID
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {createdClaim.id}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Tracking PIN Code
                  </span>
                  <span className="text-base font-mono font-extrabold text-cyan-400 tracking-wider">
                    {createdClaim.trackingCode}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    AI Pre-Verification Score
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${createdClaim.aiScore >= 80 ? "bg-emerald-500" : createdClaim.aiScore >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${createdClaim.aiScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-300 whitespace-nowrap">
                      {createdClaim.aiScore}% Match
                    </span>
                  </div>
                  <p className="text-[8px] text-slate-500 leading-normal italic">
                    "{createdClaim.aiReason}"
                  </p>
                </div>
              </div>

              {/* Magic Link Area */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Magic Link (Track across devices)
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    readOnly
                    value={getMagicLink()}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 outline-none truncate"
                  />
                  <button
                    onClick={handleCopyMagicLink}
                    className="px-3 py-2 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap border border-cyan-500/20"
                  >
                    <Copy size={12} /> {copiedLink ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition text-xs font-bold cursor-pointer"
                >
                  Close &amp; Check Back Later
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
