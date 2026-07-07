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
  CheckCircle, 
  Copy, 
  ExternalLink, 
  Phone, 
  MessageSquare, 
  Search, 
  BookOpen, 
  BadgeCheck, 
  Lock, 
  LockOpen, 
  Clock, 
  ArrowRight, 
  HelpCircle, 
  Smartphone,
  ChevronRight,
  Sparkles,
  Info,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Claim } from "../types";
import { apiService } from "../services/api";
import { TrustScoreCard, SecurityExplanationCard, VerificationTimeline } from "./ClaimModal";

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
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Handshake animations
  const [shaking, setShaking] = useState(false);
  const [unblurred, setUnblurred] = useState(false);
  const [revealTimer, setRevealTimer] = useState(false);

  // References for multi-input PIN fields
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Auto-fill and auto-search if initial values are provided
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setClaim(null);
      setUnblurred(false);
      setRevealTimer(false);
      
      if (initialClaimId && initialCode) {
        setClaimId(initialClaimId);
        const codeChars = initialCode.toUpperCase().split("").slice(0, 6);
        const newCode = Array(6).fill("");
        codeChars.forEach((char, idx) => { newCode[idx] = char; });
        setCode(newCode);
        handleTrack(initialClaimId, initialCode);
      } else {
        setClaimId("");
        setCode(Array(6).fill(""));
      }
    }
  }, [isOpen, initialClaimId, initialCode]);

  // Handle unblur effect on approved claim
  useEffect(() => {
    if (claim && claim.status === "Approved") {
      const timer = setTimeout(() => {
        setUnblurred(true);
      }, 1500); // 1.5s delay before unblur to create premium Apple Wallet reveal feel
      return () => clearTimeout(timer);
    } else {
      setUnblurred(false);
    }
  }, [claim]);

  const getPINString = (codeArray: string[]) => {
    return codeArray.join("").trim();
  };

  const handleTrack = async (targetId: string, targetCode: string) => {
    if (!targetId.trim()) {
      setErrorMsg("Please enter a valid Claim ID");
      triggerShake();
      return;
    }
    if (targetCode.length < 6) {
      setErrorMsg("Please enter your 6-character Tracking PIN");
      triggerShake();
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
      setErrorMsg(err.message || "Incorrect Tracking PIN or Claim ID. Try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleManualTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack(claimId, getPINString(code));
  };

  const handlePinChange = (index: number, val: string) => {
    const uppercaseVal = val.toUpperCase().slice(-1);
    const updated = [...code];
    updated[index] = uppercaseVal;
    setCode(updated);

    // Auto-focus next input
    if (uppercaseVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!code[index] && index > 0) {
        const updated = [...code];
        updated[index - 1] = "";
        setCode(updated);
        inputRefs.current[index - 1]?.focus();
      } else {
        const updated = [...code];
        updated[index] = "";
        setCode(updated);
      }
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().toUpperCase().slice(0, 6);
    const updated = [...code];
    for (let i = 0; i < 6; i++) {
      if (pastedData[i]) {
        updated[i] = pastedData[i];
      }
    }
    setCode(updated);
    inputRefs.current[Math.min(5, pastedData.length)]?.focus();
  };

  const handleKeypadPress = (char: string) => {
    const emptyIndex = code.findIndex(c => c === "");
    const targetIdx = emptyIndex === -1 ? 5 : emptyIndex;
    const updated = [...code];
    updated[targetIdx] = char;
    setCode(updated);
    if (targetIdx < 5) {
      inputRefs.current[targetIdx + 1]?.focus();
    }
  };

  const handleKeypadBackspace = () => {
    const filledIndices = code.map((c, i) => c !== "" ? i : -1).filter(i => i !== -1);
    if (filledIndices.length > 0) {
      const lastFilledIdx = filledIndices[filledIndices.length - 1];
      const updated = [...code];
      updated[lastFilledIdx] = "";
      setCode(updated);
      inputRefs.current[lastFilledIdx]?.focus();
    }
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

  const handleCopyContact = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Virtual Keypad elements
  const keypadKeys = ["A", "B", "C", "D", "E", "F", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "X", "Y"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
          id="claim-tracker-overlay"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className={`bg-[#07070a] border border-[#161621] rounded-3xl p-5 md:p-6.5 w-full max-w-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.95)] relative my-8 overflow-hidden ${
              shaking ? "animate-shake" : ""
            }`}
          >
            {/* Top accent glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500 opacity-60" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-[#12121a] text-slate-500 hover:text-slate-300 transition cursor-pointer z-10"
            >
              <X size={15} />
            </button>

            {!claim ? (
              /* Track Entry Form */
              <div className="space-y-5">
                <div className="border-b border-[#12121a] pb-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/20 px-3 py-1 rounded-full border border-cyan-500/10 w-fit mb-2">
                    <Search size={12} /> SECURE IDENTITY VERIFIER
                  </div>
                  <h3 className="text-base sm:text-lg font-display font-black text-slate-100">
                    Track Safe Custody Handovers
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                    Examine the current status of your submitted claim, verify cryptographic handshake codes, and unlock connection keys securely.
                  </p>
                </div>

                <form onSubmit={handleManualTrackSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Secure Handshake ID
                      </label>
                      <input
                        type="text"
                        placeholder="E.g., claim_1690000000"
                        value={claimId}
                        onChange={(e) => setClaimId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#030304] border border-[#1c1c26] focus:border-cyan-500 outline-none text-xs text-slate-200 transition font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        6-Character Handshake Code
                      </label>
                      
                      {/* Structured 6-box input */}
                      <div className="flex justify-between gap-1.5" id="code-inputs-row">
                        {code.map((char, idx) => (
                          <input
                            key={idx}
                            type="text"
                            maxLength={1}
                            value={char}
                            ref={(el) => {
                              if (el) inputRefs.current[idx] = el;
                            }}
                            onChange={(e) => handlePinChange(idx, e.target.value)}
                            onKeyDown={(e) => handlePinKeyDown(idx, e)}
                            onPaste={handlePinPaste}
                            className="w-full h-10 rounded-xl bg-[#030304] border border-[#1c1c26] focus:border-cyan-500 outline-none text-center text-xs font-mono font-extrabold text-cyan-400 transition"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Accessible Beautiful Virtual Keypad */}
                  <div className="bg-[#030304]/60 p-4 rounded-2xl border border-[#161621] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Quick Input Keypad
                      </span>
                      <span className="text-[8px] text-slate-600 font-mono">Tap characters to write Handshake Code</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {keypadKeys.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleKeypadPress(key)}
                          className="py-2.5 rounded-xl bg-[#07070a] hover:bg-[#12121a] border border-[#1c1c26] text-xs font-mono font-black text-slate-300 hover:text-cyan-400 transition cursor-pointer active:scale-95"
                        >
                          {key}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleKeypadBackspace}
                        className="col-span-6 py-2 rounded-xl bg-red-950/10 hover:bg-red-950/20 border border-red-900/10 text-[10px] font-mono font-black text-rose-400 transition cursor-pointer active:scale-98 uppercase tracking-widest"
                      >
                        Delete Character
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    /* Wrong PIN failure state */
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                      <div className="flex items-center gap-2.5 text-rose-300 text-xs font-black uppercase tracking-wider font-mono">
                        <AlertTriangle size={15} className="shrink-0 text-rose-400 animate-bounce" /> Authentication Failed
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                        {errorMsg}
                      </p>
                      <div className="pt-1.5 flex flex-wrap gap-2 text-[10px] font-mono font-bold">
                        <span className="text-slate-500">Recovery Tips:</span>
                        <button 
                          type="button"
                          onClick={() => {
                            setCode(Array(6).fill(""));
                            setErrorMsg("");
                            inputRefs.current[0]?.focus();
                          }} 
                          className="text-cyan-400 hover:underline"
                        >
                          • Reset Fields
                        </button>
                        <a href="mailto:support@linco.agency" className="text-cyan-400 hover:underline">• Contact Trust &amp; Safety</a>
                      </div>
                    </div>
                  )}

                  <SecurityExplanationCard />

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl bg-[#030304] border border-[#1c1c26] text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-black transition cursor-pointer text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-lg shadow-cyan-950/20"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="animate-spin" size={13} /> DECRYPTING HASHES...
                        </>
                      ) : (
                        "Verify & Unlock"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Results Screen */
              <div className="space-y-5 animate-fade-in text-center py-2">
                
                {/* 1. STATUS HEADER SYSTEM */}
                <div className="flex flex-col items-center gap-3 border-b border-[#12121a] pb-4">
                  {claim.status === "Approved" ? (
                    <>
                      <div className="w-14 h-14 rounded-full bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <LockOpen size={24} className="text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            🎉 Ownership Cleared
                          </span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                            🔒 Channel Secure
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-display font-black text-slate-100 mt-2">
                          Handshake Match: {claim.postTitle}
                        </h3>
                      </div>
                    </>
                  ) : claim.status === "Rejected" ? (
                    <>
                      <div className="w-14 h-14 rounded-full bg-rose-950/20 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                          ❌ Claim Declined
                        </span>
                        <h3 className="text-base sm:text-lg font-display font-black text-slate-100 mt-2">
                          Claim Rejected for {claim.postTitle}
                        </h3>
                      </div>
                    </>
                  ) : (
                    /* Owner Approval Screen waiting state */
                    <>
                      <div className="relative">
                        {/* Animated radar sonar rings */}
                        <div className="absolute inset-0 rounded-full bg-amber-500/10 border border-amber-500/20 animate-ping opacity-70" />
                        <div className="w-14 h-14 rounded-full bg-amber-950/30 border border-amber-500/20 flex items-center justify-center text-amber-400 relative z-10">
                          <Activity size={24} className="animate-pulse text-amber-400" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest animate-pulse">
                            ⏳ Under Review
                          </span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#12121a] text-slate-400 border border-[#1c1c26] uppercase tracking-widest">
                            Real-time Status
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-display font-black text-slate-100 mt-2">
                          Verification Pending: {claim.postTitle}
                        </h3>
                      </div>
                    </>
                  )}
                </div>

                {/* 2. TIMELINE PROGRESS */}
                <VerificationTimeline currentStep={claim.status === "Approved" ? 5 : 4} />

                {/* 3. CORE ACTIONING / REVEAL SCREEN */}
                <div className="bg-[#030304]/60 border border-[#161621] p-4.5 rounded-2xl text-left space-y-4">
                  
                  {claim.status === "Approved" ? (
                    /* CONTACT UNLOCK SCREEN */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BadgeCheck size={12} className="text-emerald-400" /> Secure Contact Unlocked
                        </div>
                        <span className="text-[8px] font-mono text-slate-500 uppercase">cryptographic handover key active</span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                        Fantastic! The creator has verified your ownership answers, approved your claim, and released their safe recovery coordinates.
                      </p>

                      {/* BLUR TO CLEAR TELEPHONE CARD */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c0c14] to-[#050508] border border-emerald-500/20 p-4.5 rounded-2xl text-center space-y-3 shadow-inner">
                        <div className="flex justify-center items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase">
                            ✓ Verified Owner Badge
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 uppercase">
                            ✓ Secure Handover Code Cleared
                          </span>
                        </div>

                        <div className="py-2 relative">
                          <p 
                            className={`text-xl sm:text-2xl font-mono font-black text-emerald-400 tracking-wider transition-all duration-1000 select-none ${
                              unblurred ? "blur-0" : "blur-md"
                            }`}
                          >
                            +91 {claim.revealedOwnerContact || "8838271822"}
                          </p>
                          {!unblurred && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest bg-indigo-950/40 border border-indigo-500/10 px-2 py-1 rounded">
                                Decrypting key hashes...
                              </span>
                            </div>
                          )}
                        </div>

                        {claim.revealedOwnerContact ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                            <button
                              onClick={() => handleCopyContact(claim.revealedOwnerContact!)}
                              className="py-2 px-3 rounded-xl bg-[#030304] border border-[#1c1c26] hover:bg-[#12121a] text-slate-300 text-[10px] font-mono font-black transition uppercase flex items-center justify-center gap-1.5 active:scale-97"
                            >
                              <Copy size={11} /> Copy Contact
                            </button>
                            <a
                              href={`https://wa.me/91${claim.revealedOwnerContact}?text=Hi! My claim (ID: ${claim.id}) for your lost item '${claim.postTitle}' was approved! Let's arrange a handover.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-3 rounded-xl bg-[#092e1a] border border-[#155a36] hover:bg-[#0c4425] text-emerald-400 text-[10px] font-mono font-black transition uppercase flex items-center justify-center gap-1.5 active:scale-97"
                            >
                              <MessageSquare size={11} /> WhatsApp
                            </a>
                            <a
                              href={`tel:+91${claim.revealedOwnerContact}`}
                              className="py-2 px-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 hover:bg-indigo-950/40 text-indigo-400 text-[10px] font-mono font-black transition uppercase flex items-center justify-center gap-1.5 active:scale-97"
                            >
                              <Phone size={11} /> Voice Call
                            </a>
                          </div>
                        ) : (
                          <div className="p-3 text-[10px] text-slate-500 italic bg-[#030304] rounded-xl border border-[#161621]">
                            No contact coordinates provided by verified owner.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : claim.status === "Rejected" ? (
                    /* FAILED VERIFICATION SCREEN */
                    <div className="space-y-4">
                      <div className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-rose-400" /> AI Neural Vetting Discrepancy
                      </div>
                      
                      <div className="bg-[#12080a] border border-rose-500/10 p-4 rounded-xl space-y-2.5">
                        <span className="text-[11px] font-bold text-slate-300 block">Verification Refused</span>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                          The item's owner evaluated the submitted answers and has chosen not to authorize contact details. 
                          The details did not pass location proximity checks or photo matching index specifications.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block tracking-wider">Helpful Recovery Actions</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                          <button 
                            onClick={() => setClaim(null)}
                            className="p-2.5 rounded-xl bg-[#030304] border border-[#1c1c26] text-slate-300 hover:text-white hover:border-slate-500 transition text-left flex items-center justify-between"
                          >
                            <span>Try different tracking PIN</span>
                            <ChevronRight size={10} />
                          </button>
                          <a 
                            href="mailto:trust@linco.agency" 
                            className="p-2.5 rounded-xl bg-[#030304] border border-[#1c1c26] text-slate-300 hover:text-white hover:border-slate-500 transition text-left flex items-center justify-between"
                          >
                            <span>Appeal neural evaluation</span>
                            <ChevronRight size={10} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* OWNER APPROVAL SCREEN (WAITING) */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock size={12} className="text-amber-400 animate-spin" /> Owner has been notified
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Awaiting human review</span>
                      </div>

                      <div className="p-3.5 bg-[#090704] border border-amber-500/10 rounded-xl space-y-2.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-300 font-mono">Estimated response time</span>
                          <span className="text-amber-400 font-mono font-black">~ 4 Hours (Standard queue)</span>
                        </div>
                        <div className="w-full bg-[#16120c] h-1.5 rounded-full overflow-hidden border border-amber-500/5">
                          <motion.div 
                            className="h-full bg-amber-500" 
                            initial={{ width: "35%" }}
                            animate={{ width: "85%" }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                          Real-time status logs
                        </span>
                        <div className="bg-[#030304] border border-[#161621] p-3 rounded-xl font-mono text-[9px] text-slate-400 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <span>[Handshake] Secure claim recorded successfully</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>[AI Vetting] Integrity score evaluated at {claim.aiScore}% Match</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>[Gateway] Awaiting owner validation key signature...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* TRUST SCORE DETAILS CARD IF WAITING OR APPROVED */}
                {claim.status !== "Rejected" && (
                  <TrustScoreCard aiScore={claim.aiScore} />
                )}

                {/* Bookmark / Magic Link */}
                <div className="space-y-1.5 text-left bg-[#030304]/30 p-3 rounded-xl border border-[#161621]">
                  <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Bookmark link to check status later
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getMagicLink()}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#07070a] border border-[#1c1c26] text-[10px] font-mono text-slate-400 outline-none truncate"
                    />
                    <button
                      onClick={handleCopyMagicLink}
                      className="px-3 py-1.5 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 text-[10px] font-bold transition flex items-center gap-1.5 border border-cyan-500/20 cursor-pointer uppercase font-mono active:scale-97"
                    >
                      <Copy size={11} /> {copiedLink ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setClaim(null)}
                    className="flex-1 py-3 rounded-xl bg-[#030304] border border-[#1c1c26] text-slate-400 hover:text-white transition text-xs font-black uppercase tracking-wider font-mono cursor-pointer active:scale-97"
                  >
                    Track another claim
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 transition text-xs font-black uppercase tracking-wider font-mono cursor-pointer active:scale-97"
                  >
                    Close tracker
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
