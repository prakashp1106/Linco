/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ShieldCheck, X, RefreshCw, Lock, ExternalLink, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Post } from "../types";
import { useAI } from "../hooks/useAI";
import { decryptContact } from "../services/encryptionService";
import { dbService } from "../services/db";

interface ClaimModalProps {
  isOpen: boolean;
  claimingPost: Post | null;
  onClose: () => void;
  onUnlockSuccess: (postId: string, decryptedContact: string) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  claimingPost,
  onClose,
  onUnlockSuccess,
}) => {
  const { claimLoading, runVerificationQuestions, runClaimOwnership } = useAI();
  const [localLoading, setLocalLoading] = useState(false);
  const [claimQuestions, setClaimQuestions] = useState<string[]>([]);
  const [claimAnswers, setClaimAnswers] = useState<string[]>(["", ""]);
  const [claimResult, setClaimResult] = useState<{ verified: boolean; confidence: number; message: string } | null>(null);
  
  const [decryptPinEntered, setDecryptPinEntered] = useState("");
  const [isPinVerifiedSuccessfully, setIsPinVerifiedSuccessfully] = useState(false);
  const [decryptedNumber, setDecryptedNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load questions when claimingPost is selected
  useEffect(() => {
    if (isOpen && claimingPost) {
      setClaimQuestions([]);
      setClaimAnswers(["", ""]);
      setClaimResult(null);
      setDecryptPinEntered("");
      setIsPinVerifiedSuccessfully(false);
      setDecryptedNumber("");
      setErrorMsg("");
      setLocalLoading(true);

      runVerificationQuestions(claimingPost.item, claimingPost.details)
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
          setClaimAnswers(["", ""]);
        })
        .finally(() => {
          setLocalLoading(false);
        });
    }
  }, [isOpen, claimingPost, runVerificationQuestions]);

  const handleSubmitClaimAnswers = async () => {
    if (!claimingPost) return;
    if (claimAnswers.some((a) => !a.trim())) {
      setErrorMsg("Please answer all questions to verify ownership");
      return;
    }
    setErrorMsg("");
    setLocalLoading(true);

    try {
      const res = await runClaimOwnership(
        claimingPost.item,
        claimingPost.details,
        claimQuestions,
        claimAnswers
      );
      setClaimResult({
        verified: res.verified,
        confidence: res.confidence,
        message: res.message,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process verification check");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDecryptContact = async () => {
    if (!claimingPost) return;
    if (!/^\d{4}$/.test(decryptPinEntered)) {
      setErrorMsg("Please enter a valid 4-digit Security PIN");
      return;
    }
    setErrorMsg("");
    setLocalLoading(true);

    try {
      const isLegacy = !claimingPost.contact.startsWith("ENC:");
      let decrypted = "";
      if (isLegacy) {
        if (decryptPinEntered !== (claimingPost.securityPin || "1234")) {
          throw new Error("Incorrect Security PIN");
        }
        decrypted = claimingPost.contact;
      } else {
        decrypted = await decryptContact(claimingPost.contact, decryptPinEntered);
      }

      setDecryptedNumber(decrypted);
      setIsPinVerifiedSuccessfully(true);
      dbService.saveUnlockedPost(claimingPost.id);
      onUnlockSuccess(claimingPost.id, decrypted);
    } catch (err: any) {
      setErrorMsg(err.message || "Incorrect PIN. Decryption failed.");
    } finally {
      setLocalLoading(false);
    }
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
          className="bg-slate-900 border border-slate-900 rounded-3xl p-5 md:p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1 rounded-lg hover:bg-slate-950 text-slate-500 hover:text-slate-300 transition cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">
            <ShieldCheck size={14} /> Ownership Verification
          </div>
          <h3 className="text-sm font-bold text-slate-100 mb-1">
            Prove ownership of {claimingPost.item}
          </h3>
          <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
            To prevent spam and fake claims, Gemini has generated specific questions based on item details.
          </p>

          {/* Loader */}
          {(localLoading || claimLoading) && claimQuestions.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 font-medium space-y-2">
              <RefreshCw className="animate-spin inline-block text-cyan-400" size={20} />
              <p>Formulating questions via Gemini AI...</p>
            </div>
          )}

          {/* Questions Answer Area */}
          {!localLoading && !claimLoading && !claimResult && claimQuestions.length > 0 && (
            <div className="space-y-4">
              {claimQuestions.map((q, idx) => (
                <div key={idx} className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                    Q{idx + 1}: {q}
                  </label>
                  <input
                    type="text"
                    placeholder="Provide unique details..."
                    value={claimAnswers[idx] || ""}
                    onChange={(e) => {
                      const updated = [...claimAnswers];
                      updated[idx] = e.target.value;
                      setClaimAnswers(updated);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:border-cyan-500/50 outline-none text-xs text-slate-200 transition"
                  />
                </div>
              ))}

              {errorMsg && (
                <div className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertTriangle size={12} /> {errorMsg}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-950 border border-slate-900 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitClaimAnswers}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-extrabold transition cursor-pointer text-xs"
                >
                  Submit Answers
                </button>
              </div>
            </div>
          )}

          {/* Results screen */}
          {!localLoading && !claimLoading && claimResult && (
            <div className="text-center py-2 space-y-4">
              <div className={`text-4xl ${claimResult.verified ? "animate-bounce" : "animate-pulse"}`}>
                {claimResult.verified ? "🎉" : "❌"}
              </div>
              
              {/* Matching score ring */}
              <div className="flex items-center justify-center">
                <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-mono text-sm font-extrabold shadow-inner ${
                  claimResult.verified ? "border-emerald-500/80 text-emerald-400" : "border-rose-500/80 text-rose-400"
                }`}>
                  {claimResult.confidence}%
                </div>
              </div>

              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${
                  claimResult.verified ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {claimResult.verified ? "AI Verification Passed!" : "Verification Failed"}
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1 bg-slate-950 p-3 rounded-xl border border-slate-950 text-left">
                  {claimResult.message}
                </p>
              </div>

              {claimResult.verified && (
                <div className="text-left border border-slate-900 bg-slate-950/60 p-3 rounded-xl space-y-3 animate-fade-in">
                  {!isPinVerifiedSuccessfully ? (
                    <>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                        <Lock size={12} /> Encrypted Contact Details
                      </div>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        Contact is encrypted using browser AES-GCM. Please enter the post's 4-digit Security PIN to decrypt:
                      </p>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="Enter 4-digit Security PIN"
                        value={decryptPinEntered}
                        onChange={(e) => setDecryptPinEntered(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-900 focus:border-violet-500/50 outline-none text-center text-sm font-bold tracking-widest text-slate-200 transition"
                      />
                      {errorMsg && (
                        <p className="text-[10px] text-red-400">{errorMsg}</p>
                      )}
                      <button
                        onClick={handleDecryptContact}
                        className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-slate-950 font-bold hover:text-black transition text-xs cursor-pointer"
                      >
                        🔓 Decrypt &amp; Unlock Contact
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        <ShieldCheck size={12} /> Contact Securely Decrypted!
                      </div>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        Decryption successful! Contact number has been unlocked locally. Tap below to coordinate.
                      </p>
                      <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/30 p-2 rounded-xl border border-emerald-500/15 text-center">
                        Number: +91 {decryptedNumber}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-2 pt-2">
                {claimResult.verified && isPinVerifiedSuccessfully && decryptedNumber && (
                  <a
                    href={`https://wa.me/91${decryptedNumber}?text=Hi! I successfully passed the LINCO Gemini Ownership Verification for your found item '${claimingPost.item}' (with ${claimResult.confidence}% match). Let's coordinate the handover!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold hover:text-black transition flex items-center justify-center gap-1.5 text-xs"
                  >
                    Contact Finder on WhatsApp <ExternalLink size={12} />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-900 text-slate-400 hover:text-white transition text-xs font-bold cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
