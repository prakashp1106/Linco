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
    <div className="py-3 px-1" id="verification-timeline">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-200 z-0">
          <motion.div 
            className="h-full bg-indigo-600"
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
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-semibold transition-all ${
                  isCompleted 
                    ? "bg-indigo-600 border-indigo-600 text-white" 
                    : isActive 
                    ? "bg-indigo-50 border-indigo-600 text-indigo-600 ring-2 ring-indigo-100" 
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? <Check size={11} strokeWidth={2.5} /> : stepNum}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 ${isActive ? "text-indigo-600" : isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                {step.label}
              </span>
              <span className="text-[9px] text-slate-500 hidden sm:block mt-0.5">
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
    { label: "Verified Match", val: aiScore, icon: BadgeCheck, color: "text-indigo-600", bg: "bg-indigo-600" },
    { label: "AI Confidence", val: getSubScore(4), icon: Sparkles, color: "text-indigo-600", bg: "bg-indigo-600" },
    { label: "Location Confidence", val: getSubScore(-3), icon: MapPin, color: "text-indigo-600", bg: "bg-indigo-600" },
    { label: "Timeline Confidence", val: getSubScore(-6), icon: Clock, color: "text-indigo-600", bg: "bg-indigo-600" },
    { label: "Description Confidence", val: getSubScore(8), icon: FileText, color: "text-indigo-600", bg: "bg-indigo-600" },
    { label: "Photo Confidence", val: getSubScore(5), icon: ImageIcon, color: "text-indigo-600", bg: "bg-indigo-600" }
  ];

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-left shadow-2xs" id="trust-score-card">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="text-indigo-600" size={14} />
          <span className="text-xs font-bold text-slate-900">
            Ownership Integrity Index
          </span>
        </div>
        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full shadow-2xs">
          {aiScore}% High Integrity
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {confidenceMetrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 flex items-center gap-1 font-medium">
                  <Icon size={11} className={m.color} />
                  {m.label}
                </span>
                <span className="text-slate-800 font-bold">{m.val}%</span>
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
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
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-left shadow-2xs" id="security-explanation-card">
      <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
        <ShieldCheck size={14} className="text-indigo-600" /> Safe Ownership Verification
      </h4>
      <p className="text-xs text-slate-500 leading-relaxed">
        We use secure, private steps to ensure handovers are completely safe, authentic, and trouble-free.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5 shadow-2xs">
          <span className="font-bold text-slate-800 block">🔒 Information Protected</span>
          <span className="text-slate-500 block leading-relaxed text-[11px]">Your contact details are fully protected. Only verified matched parties can unlock them.</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5 shadow-2xs">
          <span className="font-bold text-slate-800 block">🛡 Secure Contact Sharing</span>
          <span className="text-slate-500 block leading-relaxed text-[11px]">Contact options are only unlocked once mutual ownership is verified. Your phone is never shown publicly.</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5 shadow-2xs">
          <span className="font-bold text-slate-800 block">🤖 Genuine Match Verification</span>
          <span className="text-slate-500 block leading-relaxed text-[11px]">AI evaluates claims to confirm genuine details and protect against fraudulent claims.</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5 shadow-2xs">
          <span className="font-bold text-slate-800 block">🔑 Safe Handover Code</span>
          <span className="text-slate-500 block leading-relaxed text-[11px]">Unique verification tracking codes protect both parties and let you coordinate a safe meeting.</span>
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
    return `${window.location.origin}?claimId=${createdClaim.id}`;
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
          id="claim-modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 w-full max-w-2xl shadow-2xl relative my-8 text-slate-800 font-sans"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer z-10"
            >
              <X size={16} />
            </button>

            {!createdClaim ? (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 w-fit mb-1.5 shadow-2xs">
                    <ShieldCheck size={13} className="text-indigo-600" /> Safe Ownership Verification
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Prove Ownership: {claimingPost.item}
                  </h3>
                </div>

                {/* PREMIUM TIMELINE */}
                <VerificationTimeline currentStep={2} />

                <p className="text-xs text-slate-500 leading-relaxed text-left">
                  To ensure items are returned to their rightful owners, we verify matches before sharing contact details.
                  Please answer the verification questions below.
                </p>

                {/* Loader */}
                {loading && (
                  <div className="py-12 text-center text-xs text-slate-500 font-medium space-y-3 bg-slate-50 rounded-xl border border-slate-200 p-6 shadow-2xs">
                    <RefreshCw className="animate-spin inline-block text-indigo-600" size={20} />
                    <p className="text-xs text-slate-600 font-medium">
                      Preparing your verification questions...
                    </p>
                  </div>
                )}

                {/* Form Area */}
                {!loading && claimQuestions.length > 0 && (
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {/* Claimant Name & Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left shadow-2xs">
                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <User size={12} className="text-slate-400" /> Claimant Name
                        </label>
                        <input
                          type="text"
                          placeholder="Your full name"
                          value={claimantName}
                          onChange={(e) => setClaimantName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-indigo-500 outline-none text-xs text-slate-900 transition shadow-2xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Phone size={12} className="text-slate-400" /> WhatsApp Mobile
                        </label>
                        <div className="flex gap-2">
                          <div className="flex items-center justify-center px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-500 font-medium select-none shrink-0 gap-1 shadow-2xs">
                            <span>🇮🇳</span>
                            <span>+91</span>
                          </div>
                          <input
                            type="tel"
                            inputMode="tel"
                            maxLength={10}
                            placeholder="9876543210"
                            value={claimantContact}
                            onChange={(e) => setClaimantContact(e.target.value.replace(/\D/g, ""))}
                            className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-indigo-500 outline-none text-xs text-slate-900 transition shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* AI Questions */}
                    <div className="space-y-3 text-left">
                      <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-indigo-600" /> Verify Item Details
                      </div>
                      {claimQuestions.map((q, idx) => (
                        <div key={idx} className="space-y-1.5 bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-2xs">
                          <label className="block text-xs font-semibold text-slate-800 leading-relaxed">
                            Q{idx + 1}: {q}
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Describe in detail (mention markings, inner contents, purchase details if applicable)..."
                            value={claimAnswers[idx] || ""}
                            onChange={(e) => {
                              const updated = [...claimAnswers];
                              updated[idx] = e.target.value;
                              setClaimAnswers(updated);
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-indigo-500 outline-none text-xs text-slate-900 transition resize-none leading-relaxed shadow-2xs"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Security Explanation */}
                    <SecurityExplanationCard />

                    {errorMsg && (
                      <div className="text-xs text-rose-700 flex items-center gap-2 bg-rose-50 p-3 rounded-xl border border-rose-200 font-medium text-left shadow-2xs">
                        <AlertTriangle size={14} className="shrink-0 text-rose-600" /> {errorMsg}
                      </div>
                    )}

                    <div className="flex gap-2.5 pt-1">
                      <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitClaim}
                        disabled={submitting}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer text-xs flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xs active:scale-95"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="animate-spin text-white" size={13} /> Submitting...
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
              <div className="space-y-4 animate-fade-in text-center py-2">
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                    <CheckCircle size={24} />
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Verification Registered</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                    Your details have been saved securely. The item finder will review your verification answers.
                  </p>
                </div>

                {/* TIMELINE SUCCESS - STEP 4 waiting for approval */}
                <VerificationTimeline currentStep={4} />

                {/* TRUST SCORE DETAILS CARD */}
                <TrustScoreCard aiScore={createdClaim.aiScore} />

                {/* Tracking Details Box */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left space-y-2.5 shadow-2xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">
                      Verification ID (Claim ID)
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {createdClaim.id}
                    </span>
                  </div>

                  <div className="space-y-1 pt-0.5">
                    <div className="text-xs text-slate-500 font-medium">
                      Match Assessment
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      "{createdClaim.aiReason}"
                    </p>
                  </div>
                </div>

                {/* Magic Link Area */}
                <div className="space-y-1 text-left bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <label className="block text-xs font-semibold text-slate-700">
                    Direct recovery room link (bookmark to return)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getMagicLink()}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 outline-none truncate shadow-2xs"
                    />
                    <button
                      onClick={handleCopyMagicLink}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer border border-indigo-200 shadow-2xs"
                    >
                      <Copy size={12} /> {copiedLink ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition text-xs font-semibold cursor-pointer shadow-2xs"
                  >
                    Done &amp; Await Finder Review
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
