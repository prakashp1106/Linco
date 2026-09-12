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
  Copy,
  MessageSquare,
  Lock,
  LockOpen,
  Clock,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Claim } from "../types";
import { apiService } from "../services/api";
import { getWhatsAppLink } from "../utils/whatsapp";

interface ClaimTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  initialClaimId?: string;
}

export const SafeRecoveryGuidelines: React.FC = () => {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs text-left" id="safe-recovery-guidelines">
      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-600" />
        Safe Recovery Protocols
      </h4>
      <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
        <div className="flex gap-2.5">
          <span className="text-indigo-600 font-bold shrink-0">1.</span>
          <p>Meet in public, highly visible, well-lit spaces like a metro station or cafe.</p>
        </div>
        <div className="flex gap-2.5">
          <span className="text-indigo-600 font-bold shrink-0">2.</span>
          <p>Never go alone—bring a friend or family member along for the handover.</p>
        </div>
        <div className="flex gap-2.5">
          <span className="text-indigo-600 font-bold shrink-0">3.</span>
          <p>Verify the item carefully in hand before releasing rewards or completing.</p>
        </div>
        <div className="flex gap-2.5">
          <span className="text-indigo-600 font-bold shrink-0">4.</span>
          <p>Use our Secure Chat to document and agree on meeting details.</p>
        </div>
      </div>
    </div>
  );
};

export const RecoveryTimelineSteps: React.FC<{ status: string; claimantTrusted: boolean; finderTrusted: boolean; received: boolean; returned: boolean }> = ({ 
  status, claimantTrusted, finderTrusted, received, returned 
}) => {
  let activeStep = 1;
  if (status === "Pending" || status === "Under Review") activeStep = 2;
  else if (status === "Recovery Room") {
    if (claimantTrusted && finderTrusted) activeStep = 5;
    else activeStep = 4;
  } else if (status === "Contact Unlocked") activeStep = 5;
  else if (status === "Resolved") activeStep = 6;

  const steps = [
    { label: "AI Match & Claim", desc: "System matched item details" },
    { label: "Finder Approval", desc: "Awaiting finder validation" },
    { label: "Recovery Room & Chat", desc: "Secure messaging enabled" },
    { label: "Mutual Trust Check", desc: "Verification of confidence" },
    { label: "Safe Handover", desc: "Meet safely & exchange details" },
    { label: "Completed", desc: "Item safely returned" }
  ];

  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs text-left" id="recovery-timeline-steps">
      <h4 className="text-xs font-bold text-slate-900">Recovery Status Timeline</h4>
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = activeStep > stepNum || (stepNum === 6 && status === "Resolved");
          const isActive = activeStep === stepNum && status !== "Resolved" && (stepNum !== 6);
          
          return (
            <div key={idx} className="flex gap-3 text-left items-start">
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-2xs ${
                  isCompleted 
                    ? "bg-emerald-600 text-white" 
                    : isActive 
                    ? "bg-indigo-600 text-white ring-2 ring-indigo-200" 
                    : "bg-white border border-slate-200 text-slate-400"
                }`}>
                  {isCompleted ? "✓" : stepNum}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-[1px] h-5 my-1 ${
                    isCompleted ? "bg-emerald-300" : isActive ? "bg-indigo-300" : "bg-slate-200"
                  }`} />
                )}
              </div>
              <div className="space-y-0.5 pb-0.5">
                <span className={`text-xs block ${
                  isActive ? "text-indigo-700 font-bold" : isCompleted ? "text-emerald-700 font-semibold" : "text-slate-600 font-medium"
                }`}>
                  {step.label}
                </span>
                <span className="text-[11px] text-slate-500 block leading-normal">{step.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ClaimTracker: React.FC<ClaimTrackerProps> = ({
  isOpen,
  onClose,
  initialClaimId = "",
}) => {
  const [claimId, setClaimId] = useState("");
  const [loading, setLoading] = useState(false);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Chat input
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-fill and auto-search if initial values are provided
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setClaim(null);
      
      if (initialClaimId) {
        setClaimId(initialClaimId);
        handleTrack(initialClaimId);
      } else {
        setClaimId("");
      }
    }
  }, [isOpen, initialClaimId]);

  // Set up polling when claim is loaded to simulate real-time chat updates
  useEffect(() => {
    if (claim && claim.status !== "Resolved" && claim.status !== "Rejected") {
      const interval = setInterval(() => {
        refreshClaimDetails();
      }, 5000); // Poll every 5s
      setPollingTimer(interval);
      return () => {
        clearInterval(interval);
        setPollingTimer(null);
      };
    }
  }, [claim?.id, claim?.status]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [claim?.messages?.length]);

  const refreshClaimDetails = async () => {
    if (!claim) return;
    try {
      const res = await apiService.trackClaim(claim.id);
      if (res.success && res.claim) {
        setClaim(res.claim);
      }
    } catch (e) {
      console.error("Failed to poll claim details", e);
    }
  };

  const handleTrack = async (targetId: string) => {
    if (!targetId.trim()) {
      setErrorMsg("Please enter a valid Claim ID");
      triggerShake();
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await apiService.trackClaim(targetId);
      if (res.success && res.claim) {
        setClaim(res.claim);
      } else {
        throw new Error("Unable to locate claim records");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Claim ID not found. Please review the ID and try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack(claimId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim || !newMessage.trim() || sendingMsg) return;

    const textToSend = newMessage.trim();
    setNewMessage("");
    setSendingMsg(true);

    try {
      const res = await apiService.sendChatMessage(claim.id, "Claimant", textToSend);
      if (res.success) {
        setClaim(res.claim);
      }
    } catch (err: any) {
      setErrorMsg("Message delivery failed. Please try again.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleConfirmTrust = async () => {
    if (!claim) return;
    setLoading(true);
    try {
      const res = await apiService.confirmTrust(claim.id, "Claimant");
      if (res.success) {
        setClaim(res.claim);
      }
    } catch (err: any) {
      setErrorMsg("Failed to confirm trust. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!claim) return;
    setLoading(true);
    try {
      const res = await apiService.completeHandover(claim.id, "Claimant");
      if (res.success) {
        setClaim(res.claim);
      }
    } catch (err: any) {
      setErrorMsg("Failed to confirm item receipt.");
    } finally {
      setLoading(false);
    }
  };

  const getMagicLink = () => {
    if (!claim) return "";
    return `${window.location.origin}?claimId=${claim.id}`;
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
          id="claim-tracker-overlay"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className={`bg-white border border-slate-200 rounded-2xl p-5 md:p-6 w-full max-w-4xl shadow-xl relative my-8 overflow-hidden max-h-[90vh] flex flex-col text-slate-800 font-sans ${
              shaking ? "animate-shake" : ""
            }`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer z-10"
            >
              <X size={16} />
            </button>

            {!claim ? (
              /* Track Lookup Screen */
              <div className="space-y-5 overflow-y-auto py-2">
                <div className="border-b border-slate-100 pb-4 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 w-fit mb-2 shadow-2xs">
                    <ShieldCheck size={13} /> Secure Recovery Room
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Enter Recovery Room
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Access your secure, privacy-first hand-back workspace. Enter your Claim ID to chat safely, establish mutual trust, and coordinate your safe recovery.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  <div className="md:col-span-5 space-y-4">
                    <SafeRecoveryGuidelines />
                    <RecoveryTimelineSteps 
                      status="Pending" 
                      claimantTrusted={false} 
                      finderTrusted={false} 
                      received={false} 
                      returned={false} 
                    />
                  </div>

                  <div className="md:col-span-7 bg-slate-50 border border-slate-200 p-5 sm:p-6 rounded-xl flex flex-col justify-center space-y-4 shadow-2xs">
                    <form onSubmit={handleLookupSubmit} className="space-y-4">
                      <div className="space-y-1.5 text-left">
                        <label className="block text-xs font-semibold text-slate-700">
                          Claim ID / Verification ID
                        </label>
                        <input
                          type="text"
                          placeholder="E.g., claim_1690000000"
                          value={claimId}
                          onChange={(e) => setClaimId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-900 transition shadow-2xs"
                          required
                        />
                        <span className="text-xs text-slate-500 leading-relaxed block">
                          You can find your unique Claim ID on the confirmation screen of your submitted claim, or check your bookmarked magic link.
                        </span>
                      </div>

                      {errorMsg && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1 text-left">
                          <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold">
                            <AlertTriangle size={14} className="shrink-0 text-rose-600" /> Search Failed
                          </div>
                          <p className="text-xs text-rose-600 leading-relaxed">
                            {errorMsg}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="animate-spin" size={13} /> Loading...
                            </>
                          ) : (
                            "Enter Room"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              /* Active Recovery Room Dashboard */
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 shrink-0 gap-3">
                  <div className="text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                        Room Active
                      </span>
                      <span className="text-xs text-slate-500">
                        ID: {claim.id}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                      Safe Handover: {claim.postTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={refreshClaimDetails}
                      className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer shadow-2xs"
                      title="Sync Room state"
                    >
                      <RefreshCw size={13} />
                    </button>
                    <button
                      onClick={() => setClaim(null)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                    >
                      Lookup another
                    </button>
                  </div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
                  
                  {/* Left Column (5/12) - Recovery Timeline, Trust Status, Handover Confirmations */}
                  <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-1">
                    
                    {/* Progress steps */}
                    <RecoveryTimelineSteps 
                      status={claim.status} 
                      claimantTrusted={!!claim.claimantTrusted} 
                      finderTrusted={!!claim.finderTrusted}
                      received={!!claim.ownerConfirmedReceived}
                      returned={!!claim.finderConfirmedReturned}
                    />

                    {/* Conditional Recovery States */}
                    {claim.status === "Pending" || claim.status === "Under Review" ? (
                      /* 1. Waiting for Finder Approval State */
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left space-y-2.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                          <Clock size={13} className="animate-spin text-amber-600" /> Awaiting Finder Approval
                        </div>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Your claim has been submitted and is currently being evaluated by the item finder. Once approved, the secure private chat and mutual trust protocols will automatically activate.
                        </p>
                        <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-slate-600">
                          Estimated response time: ~4 hours. You can bookmark the magic link below to return to this room at any time.
                        </div>
                      </div>
                    ) : claim.status === "Rejected" ? (
                      /* 2. Rejected State */
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-left space-y-2.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-rose-800 text-xs font-bold">
                          <AlertTriangle size={13} className="text-rose-600" /> Claim Evaluation Unsuccessful
                        </div>
                        <p className="text-xs text-rose-700 leading-relaxed">
                          The finder could not verify item ownership based on the answers provided. Please double check that your details and description match.
                        </p>
                        <a 
                          href="mailto:lincoindia00@gmail.com?subject=Claim Appeal"
                          className="block text-center py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold text-xs rounded-lg border border-rose-200 shadow-2xs"
                        >
                          Submit Verification Appeal
                        </a>
                      </div>
                    ) : (
                      /* 3. Recovery Room Activated (Secure Chat, Trust, Complete states) */
                      <div className="space-y-4">
                        
                        {/* Trust Confirmation Section */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200 text-left space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">
                              Mutual Trust Check
                            </h4>
                            <span className="text-xs text-slate-500 font-medium">
                              Privacy Lock
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Direct contacts remain hidden to protect against spam or unsafe situations. Once both you and the finder click <strong>Confirm Trust</strong>, contact numbers will automatically unlock.
                          </p>

                          {/* Confidence Meters */}
                          <div className="space-y-2 py-1 text-xs">
                            <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                              <span className="text-slate-600 font-medium">Owner (You):</span>
                              <span className={claim.claimantTrusted ? "text-emerald-700 font-semibold" : "text-amber-700 font-medium"}>
                                {claim.claimantTrusted ? "✓ Trust Confirmed" : "Awaiting Confirmation"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                              <span className="text-slate-600 font-medium">Finder:</span>
                              <span className={claim.finderTrusted ? "text-emerald-700 font-semibold" : "text-amber-700 font-medium"}>
                                {claim.finderTrusted ? "✓ Trust Confirmed" : "Awaiting Confirmation"}
                              </span>
                            </div>
                          </div>

                          {!claim.claimantTrusted && (
                            <button
                              onClick={handleConfirmTrust}
                              disabled={loading}
                              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition active:scale-97 cursor-pointer shadow-2xs"
                            >
                              Confirm I Trust Finder
                            </button>
                          )}
                        </div>

                        {/* Unlocked Contacts Section */}
                        {(claim.status === "Contact Unlocked" || claim.status === "Resolved" || (claim.claimantTrusted && claim.finderTrusted)) && (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left space-y-3 animate-fade-in shadow-2xs">
                            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                              <LockOpen size={13} className="text-emerald-600" /> Contact Channel Unlocked
                            </div>
                            
                            <p className="text-xs text-emerald-800 leading-relaxed">
                              Mutual trust established! You can now access telephone and messaging links to coordinate the safe handover meeting.
                            </p>

                            <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2 text-center shadow-2xs">
                              <span className="text-xs text-slate-500 block font-medium">Finder's Contact Number</span>
                              <p className="text-base font-bold text-emerald-700 tracking-wider">
                                {claim.revealedOwnerContact || "+91 8838271822"}
                              </p>
                              
                              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                <button
                                  onClick={() => handleCopyContact(claim.revealedOwnerContact || "+91 8838271822")}
                                  className="py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition cursor-pointer font-semibold shadow-2xs"
                                >
                                  Copy Number
                                </button>
                                <a
                                  href={getWhatsAppLink(claim.revealedOwnerContact || "8838271822", `Hi! I verified my claim for '${claim.postTitle}' on LINCO. Let's arrange a handover meeting!`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-center transition cursor-pointer flex items-center justify-center gap-1 font-semibold shadow-2xs"
                                >
                                  <MessageSquare size={12} /> WhatsApp
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Direct Handover Receipt confirmation */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200 text-left space-y-3 shadow-2xs">
                          <h4 className="text-xs font-bold text-slate-900">
                            Confirm Meeting Handover
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Once you meet and have your item back in hand, please confirm below to complete the recovery loop.
                          </p>

                          <div className="space-y-2 py-1 text-xs">
                            <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                              <span className="text-slate-600 font-medium">Received (You):</span>
                              <span className={claim.ownerConfirmedReceived ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                                {claim.ownerConfirmedReceived ? "✓ Yes, Received" : "Awaiting Confirmation"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                              <span className="text-slate-600 font-medium">Returned (Finder):</span>
                              <span className={claim.finderConfirmedReturned ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                                {claim.finderConfirmedReturned ? "✓ Yes, Returned" : "Awaiting Confirmation"}
                              </span>
                            </div>
                          </div>

                          {!claim.ownerConfirmedReceived && (
                            <button
                              onClick={handleConfirmReceipt}
                              disabled={loading}
                              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition active:scale-97 cursor-pointer shadow-2xs"
                            >
                              I Have Received My Item
                            </button>
                          )}
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Right Column (7/12) - Secure Handover Chat Box */}
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden h-full min-h-[350px] shadow-2xs">
                    
                    {/* Chat header */}
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-900 block">Secure Recovery Chat</span>
                        <span className="text-[11px] text-slate-500 block">Coordinated handover channel</span>
                      </div>
                    </div>

                    {/* Chat messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3" id="chat-messages-container">
                      {claim.status === "Pending" || claim.status === "Under Review" ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                          <Lock size={20} className="text-slate-400" />
                          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                            Chat is locked. Once the finder evaluates and approves your verification answers, the private room chat activates.
                          </p>
                        </div>
                      ) : !claim.messages || claim.messages.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          Secure chat established. Say hello to coordinate the meeting.
                        </div>
                      ) : (
                        claim.messages.map((msg) => {
                          const isMe = msg.sender === "Claimant";
                          return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-left text-xs ${
                                isMe 
                                  ? "bg-indigo-600 text-white font-medium rounded-tr-none shadow-2xs" 
                                  : "bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs"
                              }`}>
                                <span className="block text-[10px] opacity-75 mb-0.5 font-medium">
                                  {isMe ? "You" : "Item Finder"}
                                </span>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat input form */}
                    <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
                      <input
                        type="text"
                        placeholder={
                          claim.status === "Pending" || claim.status === "Under Review"
                            ? "Chat will open after finder approval..."
                            : "Type safe handover coordinates..."
                        }
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={claim.status === "Pending" || claim.status === "Under Review" || claim.status === "Rejected" || sendingMsg}
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-indigo-500 outline-none text-xs text-slate-900 transition placeholder-slate-400 shadow-2xs"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMsg}
                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition cursor-pointer shadow-2xs"
                      >
                        <Send size={13} />
                      </button>
                    </form>

                  </div>
                </div>

                {/* Bookmark / Magic Link */}
                <div className="space-y-1 text-left bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0 shadow-2xs">
                  <span className="block text-xs font-semibold text-slate-700">
                    Recovery Room Direct Bookmark Link
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getMagicLink()}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 outline-none truncate shadow-2xs"
                    />
                    <button
                      onClick={handleCopyMagicLink}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition flex items-center gap-1 border border-indigo-200 cursor-pointer shadow-2xs"
                    >
                      {copiedLink ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="pt-2 shrink-0 flex gap-3">
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition text-xs font-semibold cursor-pointer shadow-2xs"
                  >
                    Close Recovery Room
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
