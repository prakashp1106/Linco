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
import { getWhatsAppLink } from "../utils/whatsapp";

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
          id="owner-claims-overlay"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className={`bg-[#0c0e16] border border-slate-800 rounded-2xl p-5 md:p-6 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh] my-4 ${
              shaking ? "animate-shake" : ""
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-800 shrink-0">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 w-fit mb-1.5">
                  <ShieldCheck size={13} /> Claims Control Board
                </div>
                <h3 className="text-base font-semibold text-slate-100">
                  Manage Claims: {post.item}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X size={16} />
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
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                    <Key size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Enter Security PIN</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Enter the 4-digit security PIN set when publishing this report to view claims and messages.
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
                        className="w-11 h-12 text-center text-xl font-semibold rounded-xl bg-[#121520] border border-slate-800 focus:border-indigo-500 outline-none text-indigo-300 transition"
                      />
                    ))}
                  </div>

                  {/* Accessible Numeric Keypad */}
                  <div className="bg-[#121520] p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {keypadNumbers.map((digit) => (
                        <button
                          key={digit}
                          type="button"
                          onClick={() => handleKeypadPress(digit)}
                          className="py-2.5 rounded-lg bg-[#0c0e16] hover:bg-slate-800/60 border border-slate-800 text-xs font-medium text-slate-200 hover:text-indigo-400 transition cursor-pointer active:scale-95"
                        >
                          {digit}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleKeypadClear}
                        className="py-2.5 rounded-lg bg-[#0c0e16] hover:bg-slate-800/60 border border-slate-800 text-xs font-medium text-slate-400 transition cursor-pointer active:scale-95"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => handleKeypadPress("0")}
                        className="py-2.5 rounded-lg bg-[#0c0e16] hover:bg-slate-800/60 border border-slate-800 text-xs font-medium text-slate-200 hover:text-indigo-400 transition cursor-pointer active:scale-95"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={handleKeypadBackspace}
                        className="py-2.5 rounded-lg bg-[#0c0e16] hover:bg-rose-500/10 border border-slate-800 text-rose-400 transition flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        <Delete size={14} />
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="text-xs text-rose-400 flex items-center gap-1.5 justify-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 max-w-xs mx-auto">
                      <AlertTriangle size={14} className="shrink-0 text-rose-400" /> {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full max-w-xs py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer text-xs flex items-center justify-center gap-1.5 mx-auto"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin" size={13} /> Authenticating...
                      </>
                    ) : (
                      "Unlock Claims Board"
                    )}
                  </button>
                </form>
              ) : (
                /* Claims List View */
                <div className="space-y-4">
                  {/* Resolve Action Banner */}
                  {post.status !== "Resolved" ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row justify-between items-center gap-3">
                      <div className="space-y-0.5 text-center md:text-left">
                        <h4 className="text-xs font-semibold text-amber-300">Resolve Listing</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Once the handover is complete, mark this listing resolved to close further claims.
                        </p>
                      </div>
                      <button
                        onClick={handleResolvePost}
                        disabled={loading}
                        className="w-full md:w-auto px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {loading ? <RefreshCw size={12} className="animate-spin" /> : "Mark Resolved"}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                      <Check className="text-emerald-400 shrink-0" size={16} />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-semibold text-emerald-400">This Listing is Resolved</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          This post is closed and is no longer accepting new claims. Existing claim history remains visible below.
                        </p>
                      </div>
                    </div>
                  )}

                  {claims.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <Calendar className="mx-auto text-slate-500" size={28} />
                      <p className="text-xs font-medium">No claims submitted yet.</p>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
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
                          className="p-4 rounded-xl bg-[#121520] border border-slate-800 hover:border-slate-700 transition space-y-4"
                        >
                          {/* Claimant Info Header */}
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                Claimant: {claim.claimantName}
                              </h4>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                Submitted: {formatKolkataTimestamp(claim.created || claim.timestamp)}
                              </p>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {claim.status === "Approved" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Approved
                                </span>
                              ) : claim.status === "Contact Unlocked" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  Contact Unlocked
                                </span>
                              ) : claim.status === "Resolved" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  Resolved
                                </span>
                              ) : claim.status === "Under Review" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  Under Review
                                </span>
                              ) : claim.status === "Rejected" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  Rejected
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Pending Review
                                </span>
                              )}
                            </div>
                          </div>

                          {/* AI Confidence Meter */}
                          <div className="p-3 rounded-xl bg-[#0c0e16] border border-slate-800 space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                              <span>Gemini Integrity Score</span>
                              <span className="text-indigo-400 font-semibold">{claim.aiScore}% Match</span>
                            </div>
                            <div className="w-full bg-[#121520] h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${claim.aiScore >= 80 ? "bg-emerald-500" : claim.aiScore >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                                style={{ width: `${claim.aiScore}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed italic">
                              "{claim.aiReason}"
                            </p>
                          </div>

                          {/* Questions & Answers Grid */}
                          <div className="space-y-2.5 pl-3 border-l-2 border-slate-800">
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Verification Answers
                            </div>
                            {claim.questions.map((q, idx) => (
                              <div key={idx} className="space-y-1">
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                  Q: {q}
                                </p>
                                <p className="text-xs text-slate-200 bg-[#0c0e16] p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                                  A: {claim.answers[idx] || "Not answered"}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Actions or Contact Reveal / Recovery Room workspace */}
                          <div className="pt-3 border-t border-slate-800 text-left space-y-4">
                            {(claim.status === "Pending" || claim.status === "Under Review") ? (
                              <div className="flex flex-wrap gap-2 items-center justify-between">
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  Review answers. Approving activates the direct recovery room.
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRejectClaim(claim.id)}
                                    disabled={actioningClaimId !== null}
                                    className="px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 text-xs font-medium transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <Ban size={13} /> Decline
                                  </button>
                                  <button
                                    onClick={() => handleApproveClaim(claim)}
                                    disabled={actioningClaimId !== null}
                                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition cursor-pointer text-xs flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {actioningClaimId === claim.id ? (
                                      <>
                                        <RefreshCw className="animate-spin" size={13} /> Approving...
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
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Claim declined. Connection room deactivated.
                              </p>
                            ) : (
                              /* Active Recovery Room workspace for approved claims */
                              <div className="space-y-4 bg-[#0c0e16] p-4 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold">
                                  <ShieldCheck size={14} /> Direct Recovery Handover Room
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                                  
                                  {/* Left: Chat Module (7/12) */}
                                  <div className="md:col-span-7 bg-[#121520] border border-slate-800 rounded-xl flex flex-col h-[280px]">
                                    <div className="px-3 py-2 bg-[#0c0e16] border-b border-slate-800 flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                      <span className="text-xs font-medium text-slate-300">Handover Chat</span>
                                    </div>
                                    
                                    {/* Messages list */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                                      {!claim.messages || claim.messages.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400 text-xs">
                                          Room active. Send a greeting to coordinate handover.
                                        </div>
                                      ) : (
                                        claim.messages.map((msg) => {
                                          const isMe = msg.sender === "Finder";
                                          return (
                                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                              <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs ${
                                                isMe 
                                                  ? "bg-indigo-600 text-white font-medium rounded-tr-none" 
                                                  : "bg-[#0c0e16] border border-slate-800 text-slate-200 rounded-tl-none"
                                              }`}>
                                                <span className="block text-[10px] opacity-75 font-medium mb-0.5">
                                                  {isMe ? "You" : "Claimant"}
                                                </span>
                                                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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
                                      className="p-2 bg-[#0c0e16] border-t border-slate-800 flex gap-1.5"
                                    >
                                      <input
                                        type="text"
                                        placeholder="Type meeting coordinates or details..."
                                        value={chatInputs[claim.id] || ""}
                                        onChange={(e) => setChatInputs({ ...chatInputs, [claim.id]: e.target.value })}
                                        disabled={sendingMsg[claim.id]}
                                        className="flex-1 px-3 py-1.5 bg-[#121520] border border-slate-800 focus:border-indigo-500 outline-none rounded-lg text-xs text-slate-200"
                                      />
                                      <button
                                        type="submit"
                                        disabled={!(chatInputs[claim.id] || "").trim() || sendingMsg[claim.id]}
                                        className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition cursor-pointer"
                                      >
                                        <Send size={12} />
                                      </button>
                                    </form>
                                  </div>

                                  {/* Right: Verification Checkpoints & Handover (5/12) */}
                                  <div className="md:col-span-5 space-y-3 flex flex-col justify-between">
                                    
                                    {/* 1. Trust Confirmation Check */}
                                    <div className="p-3 bg-[#121520] rounded-xl border border-slate-800 space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-slate-300">Mutual Trust Status</span>
                                        <Lock size={12} className="text-slate-400" />
                                      </div>
                                      
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">Claimant:</span>
                                          <span className={claim.claimantTrusted ? "text-emerald-400 font-medium" : "text-amber-400"}>
                                            {claim.claimantTrusted ? "✓ Confirmed" : "Pending"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">Finder (You):</span>
                                          <span className={claim.finderTrusted ? "text-emerald-400 font-medium" : "text-amber-400"}>
                                            {claim.finderTrusted ? "✓ Confirmed" : "Pending"}
                                          </span>
                                        </div>
                                      </div>

                                      {!claim.finderTrusted && (
                                        <button
                                          onClick={() => handleFinderConfirmTrust(claim.id)}
                                          className="w-full py-1.5 text-xs bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 font-medium rounded-lg transition cursor-pointer"
                                        >
                                          Confirm I Trust Claimant
                                        </button>
                                      )}
                                    </div>

                                    {/* 2. Contacts (Visible if unlocked) */}
                                    {(claim.status === "Contact Unlocked" || claim.status === "Resolved" || (claim.claimantTrusted && claim.finderTrusted)) ? (
                                      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-1.5">
                                        <span className="block text-xs font-medium text-emerald-400">Unlocked Claimant Contact</span>
                                        <a
                                          href={getWhatsAppLink(claim.claimantContact, `Hi ${claim.claimantName}! I approved your claim for '${post.item}' on LINCO. Let's arrange a handover!`)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs font-semibold text-slate-200 hover:text-emerald-400 flex items-center gap-1.5"
                                        >
                                          <MessageSquare size={12} /> +91 {claim.claimantContact} <ExternalLink size={10} />
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="p-2.5 bg-[#121520] rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                                        Confirm trust to reveal direct contact
                                      </div>
                                    )}

                                    {/* 3. Handover Receipts confirmations */}
                                    <div className="p-3 bg-[#121520] rounded-xl border border-slate-800 space-y-2">
                                      <span className="block text-xs font-medium text-slate-300">Complete Handover</span>
                                      
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">You returned:</span>
                                          <span className={claim.finderConfirmedReturned ? "text-emerald-400 font-medium" : "text-slate-400"}>
                                            {claim.finderConfirmedReturned ? "✓ Yes" : "No"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">Claimant received:</span>
                                          <span className={claim.ownerConfirmedReceived ? "text-emerald-400 font-medium" : "text-slate-400"}>
                                            {claim.ownerConfirmedReceived ? "✓ Yes" : "No"}
                                          </span>
                                        </div>
                                      </div>

                                      {!claim.finderConfirmedReturned && (
                                        <button
                                          onClick={() => handleFinderConfirmReturn(claim.id)}
                                          className="w-full py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition cursor-pointer"
                                        >
                                          Confirm Item Returned
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
              <div className="text-xs text-rose-400 flex items-center gap-1 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 mb-2 shrink-0">
                <AlertTriangle size={13} className="shrink-0" /> {errorMsg}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition text-xs font-medium cursor-pointer"
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
