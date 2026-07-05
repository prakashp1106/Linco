/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShieldCheck, X, RefreshCw, AlertTriangle, Check, Ban, ExternalLink, MessageSquare, Key, Phone, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Post, Claim } from "../types";
import { apiService } from "../services/api";
import { decryptContact } from "../services/encryptionService";

interface OwnerClaimsDashboardProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onPostUpdated?: (updatedPost: Post) => void;
}

export const OwnerClaimsDashboard: React.FC<OwnerClaimsDashboardProps> = ({
  isOpen,
  post,
  onClose,
  onPostUpdated,
}) => {
  const [pin, setPin] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningClaimId, setActioningClaimId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !post) return null;

  const handleVerifyPinAndLoadClaims = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 4) {
      setErrorMsg("Please enter a valid 4-digit Security PIN");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await apiService.listClaims(post.id, pin);
      if (res.success) {
        setClaims(res.claims || []);
        setIsPinVerified(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Incorrect Security PIN. Access denied.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClaim = async (claim: Claim) => {
    setErrorMsg("");
    setActioningClaimId(claim.id);

    try {
      // 1. Locally decrypt owner contact details using the PIN already provided
      const decryptedContact = await decryptContact(post.contact, pin);
      if (!decryptedContact) {
        throw new Error("Failed to decrypt contact details");
      }

      // 2. Submit server-mediated approval
      const res = await apiService.approveClaim(claim.id, pin, decryptedContact);
      if (res.success) {
        // Update local claims state
        setClaims((prev) =>
          prev.map((c) => (c.id === claim.id ? res.claim : c))
        );
        // Callback to refresh main feed posts state
        if (onPostUpdated && res.post) {
          onPostUpdated(res.post);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Approval failed");
    } finally {
      setActioningClaimId(null);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    setErrorMsg("");
    setActioningClaimId(claimId);

    try {
      const res = await apiService.rejectClaim(claimId, pin);
      if (res.success) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? res.claim : c))
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Rejection failed");
    } finally {
      setActioningClaimId(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
        id="owner-claims-overlay"
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-start pb-3 border-b border-slate-800 shrink-0">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">
                <ShieldCheck size={14} /> Claims Control Board
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                Manage Claims: {post.item}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-950 text-slate-500 hover:text-slate-300 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-[300px]">
            {!isPinVerified ? (
              /* PIN Verification Form */
              <form
                onSubmit={handleVerifyPinAndLoadClaims}
                className="max-w-sm mx-auto py-8 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
                  <Key size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Enter Security PIN</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    Please provide the 4-digit Security PIN you specified when creating this post to manage submitted claims.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-32 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 outline-none text-center text-base font-bold tracking-widest text-slate-200 transition mx-auto block"
                  />

                  {errorMsg && (
                    <div className="text-[10px] text-red-400 flex items-center gap-1 justify-center bg-red-950/10 p-2 rounded-xl border border-red-900/10 max-w-xs mx-auto">
                      <AlertTriangle size={12} className="shrink-0" /> {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full max-w-xs py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-extrabold transition cursor-pointer text-xs flex items-center justify-center gap-1.5 mx-auto"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} /> Verifying PIN...
                      </>
                    ) : (
                      "Unlock Dashboard"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Claims List View */
              <div className="space-y-4">
                {claims.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <Calendar className="mx-auto text-slate-600 animate-pulse" size={28} />
                    <p className="text-xs font-medium">No claims submitted yet.</p>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                      Whenever someone claims this item, their verification report and answers will appear here for your review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {claims.map((claim) => (
                      <div
                        key={claim.id}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700/50 transition space-y-4"
                      >
                        {/* Claimant Info Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              Claimant: {claim.claimantName}
                            </h4>
                            <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                              Submitted: {claim.timestamp}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {claim.status === "Approved" ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Approved
                              </span>
                            ) : claim.status === "Rejected" ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Rejected
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                Pending Review
                              </span>
                            )}
                          </div>
                        </div>

                        {/* AI Confidence Meter */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/60 space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            <span>Gemini Verification Score</span>
                            <span className="text-cyan-400 font-mono text-xs">{claim.aiScore}% Match</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${claim.aiScore >= 80 ? "bg-emerald-500" : claim.aiScore >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                              style={{ width: `${claim.aiScore}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal italic">
                            "{claim.aiReason}"
                          </p>
                        </div>

                        {/* Questions & Answers Grid */}
                        <div className="space-y-2.5 pl-2.5 border-l-2 border-slate-800">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            Verification Answers
                          </div>
                          {claim.questions.map((q, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <p className="text-[10px] text-slate-400 font-medium">
                                Q: {q}
                              </p>
                              <p className="text-[10px] text-slate-200 bg-slate-900/40 p-2 rounded-lg border border-slate-900 font-normal">
                                A: {claim.answers[idx] || "Not answered"}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Actions or Contact Reveal */}
                        <div className="pt-2 border-t border-slate-900 flex flex-wrap gap-2 items-center justify-between">
                          {claim.status === "Pending" ? (
                            <>
                              <p className="text-[9px] text-slate-500 italic">
                                Approving reveals contact details to each other.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRejectClaim(claim.id)}
                                  disabled={actioningClaimId !== null}
                                  className="px-3.5 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-bold transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Ban size={12} /> Decline
                                </button>
                                <button
                                  onClick={() => handleApproveClaim(claim)}
                                  disabled={actioningClaimId !== null}
                                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold transition cursor-pointer text-xs flex items-center gap-1 disabled:opacity-50"
                                >
                                  {actioningClaimId === claim.id ? (
                                    <>
                                      <RefreshCw className="animate-spin" size={12} /> Approving...
                                    </>
                                  ) : (
                                    <>
                                      <Check size={14} /> Approve Claim
                                    </>
                                  )}
                                </button>
                              </div>
                            </>
                          ) : claim.status === "Approved" ? (
                            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-950/10 p-3 rounded-xl border border-emerald-500/10">
                              <div className="space-y-1">
                                <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                  Your Unlocked Contact Details
                                </span>
                                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                                  <Phone size={10} /> {claim.revealedOwnerContact || "Revealed successfully"}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                  Claimant Contact Details
                                </span>
                                <a
                                  href={`https://wa.me/91${claim.claimantContact}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-mono font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                                >
                                  <MessageSquare size={12} /> +91 {claim.claimantContact} <ExternalLink size={10} />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 italic">
                              Claim declined. No contact details were shared.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Error / Global Close */}
          {errorMsg && isPinVerified && (
            <div className="text-[10px] text-red-400 flex items-center gap-1 bg-red-950/20 p-2.5 rounded-xl border border-red-900/30 mb-2 shrink-0">
              <AlertTriangle size={12} className="shrink-0" /> {errorMsg}
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition text-xs font-bold cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
