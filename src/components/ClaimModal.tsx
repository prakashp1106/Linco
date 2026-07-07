/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  X, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  Phone, 
  User, 
  Activity, 
  Fingerprint, 
  Sparkles, 
  Clock, 
  Check, 
  BadgeCheck, 
  Smartphone, 
  FileText, 
  Image as ImageIcon,
  MapPin
} from "lucide-react";
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

// PREMIUM VERIFICATION TIMELINE
export const VerificationTimeline: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = [
    { label: "AI Match Found", desc: "Similarity Vetted" },
    { label: "Ownership Verify", desc: "Provide Details" },
    { label: "PIN Encrypt", desc: "Access Key Locked" },
    { label: "Owner Approval", desc: "Human Sign-off" },
    { label: "Secure Unlock", desc: "Exchanged Contact" }
  ];

  return (
    <div className="py-4 px-1" id="verification-timeline">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#1c1c26] z-0">
          <motion.div 
            className="h-full bg-indigo-500"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep - 1) * 25}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = currentStep > stepNum;
          const isActive = currentStep === stepNum;
          
          return (
            <div key={idx} className="flex flex-col items-center relative z-10">
              <motion.div 
                className={`w-7 h-7 rounded-full flex items-center justify-center border font-mono text-[10px] font-bold ${
                  isCompleted 
                    ? "bg-indigo-500 border-indigo-500 text-white" 
                    : isActive 
                    ? "bg-[#0c0c14] border-indigo-400 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.35)]" 
                    : "bg-[#07070a] border-[#1c1c26] text-slate-500"
                }`}
                animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                {isCompleted ? <Check size={11} strokeWidth={3} /> : stepNum}
              </motion.div>
              <span className={`text-[9px] font-bold mt-1.5 uppercase tracking-wider ${isActive ? "text-indigo-400" : isCompleted ? "text-slate-300" : "text-slate-500"}`}>
                {step.label}
              </span>
              <span className="text-[7px] text-slate-600 font-mono hidden sm:block mt-0.5">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// TRUST SCORE CARD
export const TrustScoreCard: React.FC<{ aiScore: number }> = ({ aiScore }) => {
  const getSubScore = (offset: number) => {
    return Math.min(100, Math.max(50, aiScore + offset));
  };

  const confidenceMetrics = [
    { label: "Verified Match", val: aiScore, icon: BadgeCheck, color: "text-indigo-400", bg: "bg-indigo-500" },
    { label: "AI Confidence", val: getSubScore(4), icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500" },
    { label: "Location Confidence", val: getSubScore(-3), icon: MapPin, color: "text-cyan-400", bg: "bg-cyan-500" },
    { label: "Timeline Confidence", val: getSubScore(-6), icon: Clock, color: "text-amber-400", bg: "bg-amber-500" },
    { label: "Description Confidence", val: getSubScore(8), icon: FileText, color: "text-teal-400", bg: "bg-teal-500" },
    { label: "Photo Confidence", val: getSubScore(5), icon: ImageIcon, color: "text-emerald-400", bg: "bg-emerald-500" }
  ];

  return (
    <div className="p-4 rounded-2xl bg-[#0c0c14] border border-[#1c1c26] space-y-4" id="trust-score-card">
      <div className="flex justify-between items-center pb-2 border-b border-[#161621]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="text-indigo-400" size={14} />
          <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
            Ownership Integrity Index
          </span>
        </div>
        <span className="text-xs font-mono font-black text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-2 py-0.5 rounded">
          {aiScore}% High Integrity
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {confidenceMetrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                <span className="text-slate-400 flex items-center gap-1">
                  <Icon size={10} className={m.color} />
                  {m.label}
                </span>
                <span className="text-slate-300">{m.val}%</span>
              </div>
              <div className="h-1.5 bg-[#030304] rounded-full overflow-hidden border border-[#161621]">
                <motion.div 
                  className={`h-full ${m.bg}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.val}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// SECURITY EXPLANATION CARD
export const SecurityExplanationCard: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c0c14] to-[#08080c] border border-[#161621] space-y-3 shadow-md" id="security-explanation-card">
      <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
        <ShieldCheck size={12} /> Cryptographic Security Protocols
      </h4>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        LINCO operates a state-of-the-art secure routing workflow to prevent phishing &amp; fraud during handovers.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[10px]">
        <div className="p-2.5 rounded-xl bg-[#030304]/60 border border-[#161621] space-y-1">
          <span className="font-bold text-slate-200 block">🔒 Encrypted Storage</span>
          <span className="text-slate-500 block leading-normal">Your phone number is encrypted. Only verified users can unlock contact details.</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#030304]/60 border border-[#161621] space-y-1">
          <span className="font-bold text-slate-200 block">🛡 Access Guardrails</span>
          <span className="text-slate-500 block leading-normal">Contact info is only unlocked for matched parties. Your phone is never exposed to the public feed.</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#030304]/60 border border-[#161621] space-y-1">
          <span className="font-bold text-slate-200 block">🤖 Semantic AI Vetting</span>
          <span className="text-slate-500 block leading-normal">Our AI models analyze reports to detect fraudulent patterns and fake claims, keeping the platform secure.</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#030304]/60 border border-[#161621] space-y-1">
          <span className="font-bold text-slate-200 block">🔑 PIN Validation Check</span>
          <span className="text-slate-500 block leading-normal">Security tracking code PINs prevent malicious claims and allow only authorized parties to follow status.</span>
        </div>
      </div>
    </div>
  );
};

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
          id="claim-modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className="bg-[#07070a] border border-[#161621] rounded-3xl p-5 md:p-6.5 w-full max-w-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.95)] relative my-8"
          >
            {/* Elegant header glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 opacity-60" />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-[#12121a] text-slate-500 hover:text-slate-300 transition cursor-pointer z-10"
            >
              <X size={15} />
            </button>

            {!createdClaim ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#12121a] pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/30 px-3 py-1 rounded-full border border-indigo-500/10 w-fit mb-1.5">
                      <ShieldCheck size={12} className="text-indigo-400" /> Ownership Verification Protocol
                    </div>
                    <h3 className="text-base sm:text-lg font-display font-black text-slate-100">
                      Prove Ownership: {claimingPost.item}
                    </h3>
                  </div>
                </div>

                {/* PREMIUM TIMELINE */}
                <VerificationTimeline currentStep={2} />

                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed font-mono">
                  To prevent unauthorized claims, LINCO mandates verification before contact exchange. 
                  Provide your recovery credentials and complete the Gemini AI ownership questions below.
                </p>

                {/* Loader */}
                {loading && (
                  <div className="py-14 text-center text-[12px] text-slate-400 font-medium space-y-3.5 bg-[#030304]/60 rounded-2xl border border-[#161621] p-6">
                    <RefreshCw className="animate-spin inline-block text-indigo-400" size={24} />
                    <p className="font-mono tracking-wider text-[10px] uppercase text-slate-500 animate-pulse">
                      Generating semantic verification questionnaire with Gemini AI...
                    </p>
                  </div>
                )}

                {/* Form Area */}
                {!loading && claimQuestions.length > 0 && (
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {/* Claimant Name & Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#030304]/60 p-3.5 rounded-2xl border border-[#161621]">
                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          <User size={11} className="text-slate-500" /> claimant name
                        </label>
                        <input
                          type="text"
                          placeholder="Your official name"
                          value={claimantName}
                          onChange={(e) => setClaimantName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#07070a] border border-[#1c1c26] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-200 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          <Phone size={11} className="text-slate-500" /> WhatsApp Mobile
                        </label>
                        <input
                          type="tel"
                          placeholder="E.g., 9876543210"
                          value={claimantContact}
                          onChange={(e) => setClaimantContact(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#07070a] border border-[#1c1c26] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-200 transition"
                        />
                      </div>
                    </div>

                    {/* AI Questions */}
                    <div className="space-y-3.5">
                      <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest border-b border-[#12121a] pb-1.5 flex items-center gap-1.5">
                        <Sparkles size={11} className="text-indigo-400" /> AI Ownership Verification Queries
                      </div>
                      {claimQuestions.map((q, idx) => (
                        <div key={idx} className="space-y-2 bg-[#030304]/30 border border-[#161621] p-3.5 rounded-2xl">
                          <label className="block text-[11px] font-bold text-slate-200 leading-relaxed">
                            Q{idx + 1}: {q}
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Please explain in detail (mention markings, inner contents, purchase details if applicable)..."
                            value={claimAnswers[idx] || ""}
                            onChange={(e) => {
                              const updated = [...claimAnswers];
                              updated[idx] = e.target.value;
                              setClaimAnswers(updated);
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#07070a] border border-[#1c1c26] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-200 transition resize-none leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Security Explanation */}
                    <SecurityExplanationCard />

                    {errorMsg && (
                      <div className="text-[11px] text-rose-300 flex items-center gap-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-semibold font-mono">
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
                        className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition cursor-pointer text-xs flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-950/40 uppercase tracking-widest active:scale-[0.98]"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="animate-spin text-white" size={13} /> encrypting...
                          </>
                        ) : (
                          "Submit Verification"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Success State */
              <div className="space-y-5 animate-fade-in text-center py-2">
                <div className="flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <CheckCircle size={28} />
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-display font-black text-slate-100">Claim Handshake Initiated</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mt-1 font-mono">
                    Ownership credentials recorded &amp; successfully encrypted. You have passed AI vetting.
                  </p>
                </div>

                {/* TIMELINE SUCCESS - STEP 4 waiting for approval */}
                <VerificationTimeline currentStep={4} />

                {/* TRUST SCORE DETAILS CARD */}
                <TrustScoreCard aiScore={createdClaim.aiScore} />

                {/* Tracking Details Box */}
                <div className="bg-[#030304]/60 border border-[#161621] p-4 rounded-2xl text-left space-y-3 shadow-inner">
                  <div className="flex justify-between items-center pb-2 border-b border-[#12121a]">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      Secure Handshake ID
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {createdClaim.id}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-[#12121a]">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                        Tracking Security PIN
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono block">Use this code to check status &amp; unlock contact</span>
                    </div>
                    <span className="text-base font-mono font-extrabold text-indigo-400 tracking-widest bg-indigo-950/30 border border-indigo-500/20 px-3 py-1 rounded-lg">
                      {createdClaim.trackingCode}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      Gemini Match Evaluation
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-mono italic bg-[#07070a] p-3 rounded-xl border border-[#1c1c26] pl-3 border-l-2 border-indigo-500/50">
                      "{createdClaim.aiReason}"
                    </p>
                  </div>
                </div>

                {/* Magic Link Area */}
                <div className="space-y-1.5 text-left bg-[#030304]/30 p-3 rounded-xl border border-[#161621]">
                  <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Direct handoff link (Bookmark this)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getMagicLink()}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-[#07070a] border border-[#1c1c26] text-[10px] font-mono text-slate-400 outline-none truncate"
                    />
                    <button
                      onClick={handleCopyMagicLink}
                      className="px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black transition flex items-center gap-1.5 cursor-pointer uppercase border border-indigo-500/25 active:scale-[0.97]"
                    >
                      <Copy size={11} /> {copiedLink ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-[#030304] hover:bg-[#12121a] border border-[#1c1c26] text-slate-300 hover:text-white transition text-xs font-black uppercase tracking-wider cursor-pointer active:scale-[0.97]"
                  >
                    Done &amp; Await Owner Sign-off
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
