/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ShieldCheck, X, RefreshCw, AlertTriangle, CheckCircle, Copy, ExternalLink, Phone, MessageSquare, Search, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Claim } from "../types";
import { apiService } from "../services/api";

interface ClaimTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  initialClaimId?: string;
  initialCode?: string;
}

export const ClaimTracker: React.FC<ClaimTrackerProps> = ({
  isOpen,
  onClose,
  initialClaimId = "",
  initialCode = "",
}) => {
  const [claimId, setClaimId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-fill and auto-search if initial values are provided (e.g. from Magic Link query parameters)
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setClaim(null);
      
      if (initialClaimId && initialCode) {
        setClaimId(initialClaimId);
        setCode(initialCode);
        handleTrack(initialClaimId, initialCode);
      } else {
        setClaimId("");
        setCode("");
      }
    }
  }, [isOpen, initialClaimId, initialCode]);

  const handleTrack = async (targetId: string, targetCode: string) => {
    if (!targetId.trim()) {
      setErrorMsg("Please enter a valid Claim ID");
      return;
    }
    if (!targetCode.trim()) {
      setErrorMsg("Please enter your 6-digit Tracking PIN");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await apiService.trackClaim(targetId, targetCode);
      if (res.success && res.claim) {
        setClaim(res.claim);
      } else {
        throw new Error("Unable to track claim");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Incorrect Claim ID or Tracking PIN. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack(claimId, code);
  };

  const getMagicLink = () => {
    if (!claim) return "";
    return `${window.location.origin}?claimId=${claim.id}&code=${claim.trackingCode}`;
  };

  const handleCopyMagicLink = () => {
    navigator.clipboard.writeText(getMagicLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          id="claim-tracker-overlay"
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

          {!claim ? (
            /* Track Entry Form */
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">
                <Search size={14} /> Track Claim Status
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">
                Check your claim's status
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                Enter the Claim ID and Tracking PIN you received after submitting your claim answers to check if the owner has approved you.
              </p>

              <form onSubmit={handleManualTrackSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Claim ID
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., claim_1690000000"
                    value={claimId}
                    onChange={(e) => setClaimId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 outline-none text-xs text-slate-200 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Tracking PIN Code (6 Characters)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., X9YZR2"
                    value={code}
                    maxLength={6}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 outline-none text-xs text-slate-200 transition font-mono tracking-wider"
                  />
                </div>

                {errorMsg && (
                  <div className="text-[10px] text-red-400 flex items-center gap-1 bg-red-950/20 p-2.5 rounded-xl border border-red-900/30">
                    <AlertTriangle size={12} className="shrink-0" /> {errorMsg}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-extrabold transition cursor-pointer text-xs flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} /> Retrieving...
                      </>
                    ) : (
                      "Track Claim"
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Results Screen */
            <div className="space-y-5 animate-fade-in text-center">
              {/* Status Header Badge */}
              <div className="flex flex-col items-center gap-3">
                {claim.status === "Approved" ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        🎉 Claim Approved
                      </span>
                      <h3 className="text-sm font-bold text-slate-100 mt-2">
                        Claim for: {claim.postTitle}
                      </h3>
                    </div>
                  </>
                ) : claim.status === "Rejected" ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-rose-950/20 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <AlertTriangle size={32} />
                    </div>
                    <div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        ❌ Claim Declined
                      </span>
                      <h3 className="text-sm font-bold text-slate-100 mt-2">
                        Claim for: {claim.postTitle}
                      </h3>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-amber-950/20 border border-amber-500/20 flex items-center justify-center text-amber-400 animate-pulse">
                      <RefreshCw size={24} className="animate-spin text-amber-400" />
                    </div>
                    <div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        ⏳ Under Review
                      </span>
                      <h3 className="text-sm font-bold text-slate-100 mt-2">
                        Claim for: {claim.postTitle}
                      </h3>
                    </div>
                  </>
                )}
              </div>

              {/* Status Description Info Card */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-left space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={12} /> Verification summary
                </div>

                {claim.status === "Approved" ? (
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-300 leading-normal">
                      Excellent news! The item's owner has verified your details, approved your ownership claim, and shared their decrypted contact coordinates below.
                    </p>

                    {/* Contact details revealed */}
                    <div className="bg-emerald-950/10 border border-emerald-500/15 p-3 rounded-xl space-y-2 text-center">
                      <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                        Owner Unlocked Contact Detail
                      </span>
                      <p className="text-sm font-mono font-extrabold text-emerald-400 tracking-wide">
                        +91 {claim.revealedOwnerContact || "Pending handover"}
                      </p>
                      
                      {claim.revealedOwnerContact && (
                        <a
                          href={`https://wa.me/91${claim.revealedOwnerContact}?text=Hi! My claim (ID: ${claim.id}) for your lost item '${claim.postTitle}' was approved! Let's arrange a handover.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold hover:text-black transition flex items-center justify-center gap-1.5 text-[10px]"
                        >
                          <MessageSquare size={10} /> Chat on WhatsApp <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ) : claim.status === "Rejected" ? (
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    The owner evaluated your verification answers and declined this claim. Please contact support or submit a new claim if you believe this was an error.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Your answers were analysed by Gemini AI with a **{claim.aiScore}% confidence score** ({claim.aiReason}).
                    </p>
                    <p className="text-[10px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-900">
                      Status: **Waiting for Owner Approval**. The owner will look over your report on their control panel. We'll automatically unlock and reveal their WhatsApp details right here when they approve!
                    </p>
                  </div>
                )}
              </div>

              {/* Bookmark / Magic Link */}
              <div className="space-y-1 text-left">
                <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                  Bookmark Link to Check Status
                </span>
                <div className="flex gap-1">
                  <input
                    type="text"
                    readOnly
                    value={getMagicLink()}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 outline-none truncate"
                  />
                  <button
                    onClick={handleCopyMagicLink}
                    className="px-2.5 py-1.5 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 text-xs font-bold transition flex items-center gap-1 border border-cyan-500/20 cursor-pointer whitespace-nowrap"
                  >
                    <Copy size={10} /> {copiedLink ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setClaim(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition text-xs font-bold cursor-pointer"
                >
                  Track Another
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 transition text-xs font-bold cursor-pointer"
                >
                  Close
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
