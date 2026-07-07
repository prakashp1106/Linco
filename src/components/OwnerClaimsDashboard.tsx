/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  X, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  Ban, 
  ExternalLink, 
  MessageSquare, 
  Key, 
  Phone, 
  Calendar,
  Lock,
  Delete,
  Send,
  LockOpen,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Post, Claim } from "../types";
import { apiService } from "../services/api";
import { decryptContact } from "../services/encryptionService";
import { formatKolkataTimestamp } from "../utils/date";

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
  const [pinDigits, setPinDigits] = useState<string[]>(Array(4).fill(""));
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningClaimId, setActioningClaimId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [shaking, setShaking] = useState(false);

  // Recovery Room states
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [sendingMsg, setSendingMsg] = useState<Record<string, boolean>>({});

  const inputRefs = useRef<HTMLInputElement[]>([]);
  const pin = pinDigits.join("").trim();

  // Sync active Recovery Room status and messages in background
  const refreshClaims = async () => {
    if (!post || !pin || !isPinVerified) return;
    try {
      const res = await apiService.listClaims(post.id, pin);
      if (res.success && res.claims) {
        setClaims(res.claims);
      }
    } catch (err) {}
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen && isPinVerified && post) {
      interval = setInterval(() => {
        refreshClaims();
      }, 5000); // Polling every 5s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isPinVerified, post?.id]);

  // Clear claim and PIN state whenever another post is opened or modal is closed
  useEffect(() => {
    setPinDigits(Array(4).fill(""));
    setIsPinVerified(false);
    setClaims([]);
    setErrorMsg("");
    setShaking(false);
    if (isOpen && !isPinVerified) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 250);
    }
  }, [post?.id, isOpen]);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleVerifyPinAndLoadClaims = async (e?: React.FormEvent, finalPin?: string) => {
    if (e) e.preventDefault();
    const pinToSubmit = finalPin || pin;
    if (pinToSubmit.length !== 4) {
      setErrorMsg("Please enter a valid 4-digit Security PIN");
      triggerShake();
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await apiService.listClaims(post!.id, pinToSubmit);
      if (res.success) {
        setClaims(res.claims || []);
        setIsPinVerified(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Incorrect Security PIN. Access denied.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const numericVal = val.replace(/\D/g, "").slice(-1);
    const updated = [...pinDigits];
    updated[index] = numericVal;
    setPinDigits(updated);

    // Auto focus next input
    if (numericVal && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullPin = updated.join("");
    if (fullPin.length === 4) {
      setTimeout(() => {
        handleVerifyPinAndLoadClaims(undefined, fullPin);
      }, 200);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!pinDigits[index] && index > 0) {
        const updated = [...pinDigits];
        updated[index - 1] = "";
        setPinDigits(updated);
        inputRefs.current[index - 1]?.focus();
      } else {
        const updated = [...pinDigits];
        updated[index] = "";
        setPinDigits(updated);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    const updated = [...pinDigits];
    for (let i = 0; i < 4; i++) {
      if (pastedData[i]) {
        updated[i] = pastedData[i];
      }
    }
    setPinDigits(updated);
    inputRefs.current[Math.min(3, pastedData.length)]?.focus();

    if (pastedData.length === 4) {
      setTimeout(() => {
        handleVerifyPinAndLoadClaims(undefined, pastedData);
      }, 200);
    }
  };

  const handleKeypadPress = (digit: string) => {
    setErrorMsg("");
    const emptyIndex = pinDigits.findIndex((d) => d === "");
    const targetIdx = emptyIndex === -1 ? 3 : emptyIndex;
    
    const updated = [...pinDigits];
    updated[targetIdx] = digit;
    setPinDigits(updated);

    if (targetIdx < 3) {
      inputRefs.current[targetIdx + 1]?.focus();
    }

    const fullPin = updated.join("");
    if (fullPin.length === 4) {
      setTimeout(() => {
        handleVerifyPinAndLoadClaims(undefined, fullPin);
      }, 200);
    }
  };

  const handleKeypadBackspace = () => {
    const filledIndices = pinDigits.map((d, i) => d !== "" ? i : -1).filter((i) => i !== -1);
    if (filledIndices.length > 0) {
      const lastFilledIdx = filledIndices[filledIndices.length - 1];
      const updated = [...pinDigits];
      updated[lastFilledIdx] = "";
      setPinDigits(updated);
      inputRefs.current[lastFilledIdx]?.focus();
    }
  };

  const handleKeypadClear = () => {
    setPinDigits(Array(4).fill(""));
    inputRefs.current[0]?.focus();
  };

  const handleApproveClaim = async (claim: Claim) => {
    setErrorMsg("");
    setActioningClaimId(claim.id);

    try {
      // 1. Locally decrypt owner contact details using the PIN already provided
      const decryptedContact = await decryptContact(post!.contact, pin);
      if (!decryptedContact) {
        throw new Error("Failed to decrypt contact details");
      }

      // 2. Submit server-mediated approval
      const res = await apiService.approveClaim(claim.id, pin, decryptedContact, post!.id);
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
      const res = await apiService.rejectClaim(claimId, pin, post!.id);
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

  const handleSendFinderMessage = async (claimId: string, text: string) => {
    if (!text.trim()) return;
    setSendingMsg((prev) => ({ ...prev, [claimId]: true }));
    try {
      const res = await apiService.sendChatMessage(claimId, "Finder", text);
      if (res.success) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? res.claim : c))
        );
        setChatInputs((prev) => ({ ...prev, [claimId]: "" }));
      }
    } catch (err: any) {
      setErrorMsg("Failed to send message: " + err.message);
    } finally {
      setSendingMsg((prev) => ({ ...prev, [claimId]: false }));
    }
  };

  const handleFinderConfirmTrust = async (claimId: string) => {
    try {
      const res = await apiService.confirmTrust(claimId, "Finder");
      if (res.success) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? res.claim : c))
        );
      }
    } catch (err: any) {
      setErrorMsg("Failed to confirm trust: " + err.message);
    }
  };

  const handleFinderConfirmReturn = async (claimId: string) => {
    try {
      const res = await apiService.completeHandover(claimId, "Finder");
      if (res.success) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? res.claim : c))
        );
        if (onPostUpdated && res.post) {
          onPostUpdated(res.post);
        }
      }
    } catch (err: any) {
      setErrorMsg("Failed to complete recovery: " + err.message);
    }
  };

  const handleResolvePost = async () => {
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await apiService.resolvePost(post!.id, pin);
      if (res.success) {
        if (onPostUpdated && res.post) {
          onPostUpdated(res.post);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resolve listing");
    } finally {
      setLoading(false);
    }
  };

  const keypadNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <AnimatePresence>
      {isOpen && post && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
          id="owner-claims-overlay"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className={`bg-[#07070a] border border-[#161621] rounded-3xl p-5 md:p-6 w-full max-w-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.95)] relative flex flex-col max-h-[90vh] my-4 ${
              shaking ? "animate-shake" : ""
            }`}
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500 opacity-60" />

            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-[#12121a] shrink-0">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/20 px-3 py-1 rounded-full border border-cyan-500/10 w-fit mb-1.5">
                  <ShieldCheck size={12} /> claims control board
                </div>
                <h3 className="text-base font-display font-black text-slate-100">
                  Manage Claims: {post.item}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-[#12121a] text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-[300px]" id="claims-dashboard-content">
              {!isPinVerified ? (
                /* PIN Verification Form */
                <form
                  onSubmit={(e) => handleVerifyPinAndLoadClaims(e)}
                  className="max-w-sm mx-auto py-6 text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
                    <Key size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-black text-slate-200 uppercase tracking-wider">Enter security pin</h4>
                    <p className="text-[10px] text-slate-400 leading-normal mt-1 font-mono">
                      Specify the 4-digit security PIN specified when publishing this report to decrypt connection keys.
                    </p>
                  </div>

                  {/* Multi-box input for dashboard PIN */}
                  <div className="flex justify-center gap-3 py-1" id="dashboard-pin-row">
                    {pinDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        type="password"
                        maxLength={1}
                        value={digit}
                        ref={(el) => {
                          if (el) inputRefs.current[idx] = el;
                        }}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        className="w-11 h-12 text-center text-xl font-bold rounded-xl bg-[#030304] border border-[#1c1c26] focus:border-cyan-500 outline-none text-cyan-400 transition"
                      />
                    ))}
                  </div>

                  {/* Accessible Numeric Keypad */}
                  <div className="bg-[#030304]/60 p-4 rounded-2xl border border-[#161621] space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {keypadNumbers.map((digit) => (
                        <button
                          key={digit}
                          type="button"
                          onClick={() => handleKeypadPress(digit)}
                          className="py-2.5 rounded-xl bg-[#07070a] hover:bg-[#12121a] border border-[#1c1c26] text-xs font-bold text-slate-200 hover:text-cyan-400 transition cursor-pointer active:scale-95"
                        >
                          {digit}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleKeypadClear}
                        className="py-2.5 rounded-xl bg-[#07070a] hover:bg-[#12121a] border border-[#1c1c26] text-[10px] uppercase font-bold text-slate-500 transition cursor-pointer active:scale-95"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => handleKeypadPress("0")}
                        className="py-2.5 rounded-xl bg-[#07070a] hover:bg-[#12121a] border border-[#1c1c26] text-xs font-bold text-slate-200 hover:text-cyan-400 transition cursor-pointer active:scale-95"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={handleKeypadBackspace}
                        className="py-2.5 rounded-xl bg-[#07070a] hover:bg-red-950/20 border border-[#1c1c26] text-rose-400 transition flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        <Delete size={13} />
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="text-[10px] text-rose-400 flex items-center gap-1.5 justify-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 max-w-xs mx-auto font-mono">
                      <AlertTriangle size={13} className="shrink-0 text-rose-400 animate-bounce" /> {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full max-w-xs py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-black transition cursor-pointer text-xs flex items-center justify-center gap-1.5 mx-auto uppercase tracking-wider"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin" size={13} /> Authenticating...
                      </>
                    ) : (
                      "Decrypt & Access Dashboard"
                    )}
                  </button>
                </form>
              ) : (
                /* Claims List View */
                <div className="space-y-4">
                  {/* Resolve Action Banner */}
                  {post.status !== "Resolved" ? (
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex flex-col md:flex-row justify-between items-center gap-3">
                      <div className="space-y-1 text-center md:text-left">
                        <h4 className="text-xs font-mono font-black text-amber-400 uppercase tracking-wider">Reclaim &amp; Resolve Listing</h4>
                        <p className="text-[10px] text-slate-400 leading-normal font-mono">
                          Once handover coordinates succeed, mark this listing resolved to prevent additional claims.
                        </p>
                      </div>
                      <button
                        onClick={handleResolvePost}
                        disabled={loading}
                        className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 uppercase tracking-wider"
                      >
                        {loading ? <RefreshCw size={12} className="animate-spin" /> : "Resolve Post"}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
                      <Check className="text-emerald-400 shrink-0" size={16} />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-emerald-400">This Listing is Resolved</h4>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          This post is closed and is no longer accepting new claims. Existing claim history remains visible below.
                        </p>
                      </div>
                    </div>
                  )}

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
                      {claims
                        .filter((claim) => {
                          if (claim.postId !== post.id) {
                            console.error(`[DEFENSIVE-VALIDATION-MISMATCH] Claim ID: ${claim.id} has postId "${claim.postId}", but current post is "${post.id}". Ignoring.`);
                            return false;
                          }
                          return true;
                        })
                        .map((claim) => (
                        <div
                          key={claim.id}
                          className="p-4 rounded-2xl bg-[#030304]/60 border border-[#161621] hover:border-slate-800 transition space-y-4"
                        >
                          {/* Claimant Info Header */}
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                Claimant: {claim.claimantName}
                              </h4>
                              <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                                Submitted: {formatKolkataTimestamp(claim.created || claim.timestamp)}
                              </p>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {claim.status === "Approved" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                                  Approved
                                </span>
                              ) : claim.status === "Contact Unlocked" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest">
                                  Contact Unlocked
                                </span>
                              ) : claim.status === "Resolved" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-widest">
                                  Resolved
                                </span>
                              ) : claim.status === "Under Review" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse uppercase tracking-widest">
                                  Under Review
                                </span>
                              ) : claim.status === "Rejected" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest">
                                  Rejected
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse uppercase tracking-widest">
                                  Pending Review
                                </span>
                              )}
                            </div>
                          </div>

                          {/* AI Confidence Meter */}
                          <div className="p-3 rounded-xl bg-[#07070a] border border-[#1c1c26] space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                              <span>Gemini Integrity Score</span>
                              <span className="text-cyan-400 font-mono text-xs">{claim.aiScore}% Match</span>
                            </div>
                            <div className="w-full bg-[#030304] h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${claim.aiScore >= 80 ? "bg-emerald-500" : claim.aiScore >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                                style={{ width: `${claim.aiScore}%` }}
                              />
                            </div>
                            <p className="text-[9px] text-slate-400 leading-normal italic font-mono">
                              "{claim.aiReason}"
                            </p>
                          </div>

                          {/* Questions & Answers Grid */}
                          <div className="space-y-2.5 pl-2.5 border-l-2 border-[#161621]">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                              Verification Answers
                            </div>
                            {claim.questions.map((q, idx) => (
                              <div key={idx} className="space-y-0.5">
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                  Q: {q}
                                </p>
                                <p className="text-[10px] text-slate-200 bg-[#030304]/60 p-2 rounded-lg border border-[#161621] leading-relaxed">
                                  A: {claim.answers[idx] || "Not answered"}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Actions or Contact Reveal / Recovery Room workspace */}
                          <div className="pt-3 border-t border-[#12121a] text-left space-y-4">
                            {(claim.status === "Pending" || claim.status === "Under Review") ? (
                              <div className="flex flex-wrap gap-2 items-center justify-between">
                                <p className="text-[10px] text-slate-500 italic font-mono">
                                  Review answers. Approving activates the Secure Recovery Room.
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRejectClaim(claim.id)}
                                    disabled={actioningClaimId !== null}
                                    className="px-3.5 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-bold transition cursor-pointer flex items-center gap-1 disabled:opacity-50 font-mono uppercase tracking-widest text-[10px]"
                                  >
                                    <Ban size={12} /> Decline
                                  </button>
                                  <button
                                    onClick={() => handleApproveClaim(claim)}
                                    disabled={actioningClaimId !== null}
                                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition cursor-pointer text-xs flex items-center gap-1 disabled:opacity-50 font-mono uppercase tracking-widest text-[10px]"
                                  >
                                    {actioningClaimId === claim.id ? (
                                      <>
                                        <RefreshCw className="animate-spin" size={12} /> Approving...
                                      </>
                                    ) : (
                                      <>
                                        <Check size={14} /> Approve & Chat
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : claim.status === "Rejected" ? (
                              <p className="text-[10px] text-slate-500 italic font-mono">
                                Claim declined. Connection room deactivated.
                              </p>
                            ) : (
                              /* Active Recovery Room workspace for approved claims */
                              <div className="space-y-4 bg-[#050508] p-4 rounded-2xl border border-[#161621]">
                                <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] font-black uppercase tracking-widest">
                                  <ShieldCheck size={12} /> Secure Recovery Room Workspace
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                                  
                                  {/* Left: Chat Module (7/12) */}
                                  <div className="md:col-span-7 bg-[#030304]/60 border border-[#14141d] rounded-xl flex flex-col h-[280px]">
                                    <div className="px-3 py-1.5 bg-[#08080f] border-b border-[#111119] flex items-center gap-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      <span className="text-[9px] font-mono font-bold text-slate-400">Handover Chat</span>
                                    </div>
                                    
                                    {/* Messages list */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                                      {!claim.messages || claim.messages.length === 0 ? (
                                        <div className="text-center py-12 text-slate-600 text-[10px] font-mono">
                                          Room active. Send a greeting to start.
                                        </div>
                                      ) : (
                                        claim.messages.map((msg) => {
                                          const isMe = msg.sender === "Finder";
                                          return (
                                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                              <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-[11px] ${
                                                isMe 
                                                  ? "bg-cyan-500 text-slate-950 font-medium rounded-tr-none" 
                                                  : "bg-[#0c0c14] border border-[#1e1e2d] text-slate-200 rounded-tl-none"
                                              }`}>
                                                <span className="block text-[7px] opacity-65 font-bold font-mono">
                                                  {isMe ? "You (Finder)" : "Claimant"}
                                                </span>
                                                <p className="leading-snug whitespace-pre-wrap">{msg.text}</p>
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>

                                    {/* Sender Form */}
                                    <form 
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        const text = chatInputs[claim.id] || "";
                                        handleSendFinderMessage(claim.id, text);
                                      }}
                                      className="p-2 bg-[#08080f] border-t border-[#111119] flex gap-1.5"
                                    >
                                      <input
                                        type="text"
                                        placeholder="Type secure meeting coordinates..."
                                        value={chatInputs[claim.id] || ""}
                                        onChange={(e) => setChatInputs({ ...chatInputs, [claim.id]: e.target.value })}
                                        disabled={sendingMsg[claim.id]}
                                        className="flex-1 px-3 py-1.5 bg-[#030304] border border-[#1c1c2b] focus:border-cyan-500 outline-none rounded-lg text-[11px] text-slate-200"
                                      />
                                      <button
                                        type="submit"
                                        disabled={!(chatInputs[claim.id] || "").trim() || sendingMsg[claim.id]}
                                        className="p-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-950 disabled:text-slate-800 text-slate-950 rounded-lg transition"
                                      >
                                        <Send size={11} />
                                      </button>
                                    </form>
                                  </div>

                                  {/* Right: Verification Checkpoints & Handover (5/12) */}
                                  <div className="md:col-span-5 space-y-3.5 flex flex-col justify-between">
                                    
                                    {/* 1. Trust Confirmation Check */}
                                    <div className="p-3 bg-[#08080f] rounded-xl border border-[#13131f] space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold font-display text-slate-300">Mutual Trust status</span>
                                        <Lock size={10} className="text-slate-500" />
                                      </div>
                                      
                                      <div className="space-y-1 text-[9px] font-mono">
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-500">Claimant:</span>
                                          <span className={claim.claimantTrusted ? "text-emerald-400 font-bold" : "text-amber-500"}>
                                            {claim.claimantTrusted ? "✓ Confirmed" : "Pending"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-500">Finder (You):</span>
                                          <span className={claim.finderTrusted ? "text-emerald-400 font-bold" : "text-amber-500"}>
                                            {claim.finderTrusted ? "✓ Confirmed" : "Pending"}
                                          </span>
                                        </div>
                                      </div>

                                      {!claim.finderTrusted && (
                                        <button
                                          onClick={() => handleFinderConfirmTrust(claim.id)}
                                          className="w-full py-1.5 text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-400 text-cyan-400 font-bold uppercase rounded-lg transition"
                                        >
                                          Confirm I Trust Claimant
                                        </button>
                                      )}
                                    </div>

                                    {/* 2. Contacts (Visible if unlocked) */}
                                    {(claim.status === "Contact Unlocked" || claim.status === "Resolved" || (claim.claimantTrusted && claim.finderTrusted)) ? (
                                      <div className="p-3 bg-emerald-950/10 rounded-xl border border-emerald-500/10 space-y-1.5">
                                        <span className="block text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Unlocked Claimant Contact</span>
                                        <a
                                          href={`https://wa.me/91${claim.claimantContact}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[11px] font-mono font-black text-slate-200 hover:text-emerald-400 flex items-center gap-1"
                                        >
                                          <MessageSquare size={10} /> +91 {claim.claimantContact} <ExternalLink size={9} />
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="p-2.5 bg-[#030304] rounded-xl border border-[#161622] text-center text-[9px] text-slate-500 font-mono">
                                        🔒 Confirm trust to reveal contact details
                                      </div>
                                    )}

                                    {/* 3. Handover Receipts confirmations */}
                                    <div className="p-3 bg-[#08080f] rounded-xl border border-[#13131f] space-y-2">
                                      <span className="block text-[9px] font-bold text-slate-300">Complete Handover</span>
                                      
                                      <div className="space-y-1 text-[9px] font-mono">
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-500">You returned:</span>
                                          <span className={claim.finderConfirmedReturned ? "text-emerald-400 font-bold" : "text-slate-500"}>
                                            {claim.finderConfirmedReturned ? "✓ Yes" : "No"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-500">Claimant received:</span>
                                          <span className={claim.ownerConfirmedReceived ? "text-emerald-400 font-bold" : "text-slate-500"}>
                                            {claim.ownerConfirmedReceived ? "✓ Yes" : "No"}
                                          </span>
                                        </div>
                                      </div>

                                      {!claim.finderConfirmedReturned && (
                                        <button
                                          onClick={() => handleFinderConfirmReturn(claim.id)}
                                          className="w-full py-1.5 text-[10px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase rounded-lg transition"
                                        >
                                          Confirm I Returned Item
                                        </button>
                                      )}
                                    </div>

                                  </div>
                                </div>
                              </div>
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
              <div className="text-[10px] text-red-400 flex items-center gap-1 bg-red-950/20 p-2.5 rounded-xl border border-red-900/30 mb-2 shrink-0 font-mono">
                <AlertTriangle size={12} className="shrink-0" /> {errorMsg}
              </div>
            )}

            <div className="pt-3 border-t border-[#12121a] shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#030304] border border-[#1c1c26] text-slate-400 hover:text-white transition text-xs font-bold uppercase tracking-wider font-mono cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
