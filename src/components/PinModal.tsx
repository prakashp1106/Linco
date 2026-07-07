/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Lock, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PinModalProps {
  isOpen: boolean;
  actionType: "delete" | "resolve" | "unlock";
  onClose: () => void;
  onSubmit: (pin: string) => Promise<void> | void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  actionType,
  onClose,
  onSubmit,
}) => {
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setError("Please enter a valid 4-digit PIN");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(pin);
      setPin("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Incorrect PIN. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          id="pin-modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="w-full max-w-sm rounded-3xl bg-[#0a0a0d] border border-[#1c1c26] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.85)] relative"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-violet-500 opacity-60" />
            {/* Header */}
            <div className="p-5 border-b border-[#16161f] bg-[#07070a]/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={15} className={actionType === "delete" ? "text-rose-400" : actionType === "unlock" ? "text-indigo-400" : "text-emerald-400"} />
                <span className="text-[11px] font-mono font-extrabold text-slate-300 uppercase tracking-widest">
                  {actionType === "delete" ? "Delete Report" : actionType === "unlock" ? "Unlock Decryption Key" : "Mark Resolved"}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-[#12121a] transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6.5 space-y-5">
              <p className="text-[12px] text-slate-400 leading-relaxed text-center">
                {actionType === "unlock" 
                  ? "Specify the 4-digit security PIN used to encrypt this post's contact details to decrypt connection keys."
                  : "Specify the 4-digit security PIN used when creating this report to authenticate this operation."}
              </p>

              <div className="space-y-2">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setError("");
                    setPin(e.target.value.replace(/\D/g, ""));
                  }}
                  placeholder="••••"
                  className="w-full text-center tracking-[1.25em] text-3xl font-sans font-bold py-3 px-4 rounded-2xl bg-[#030304] border border-[#161621] focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-slate-100 outline-none transition-all duration-150"
                />
                <p className="text-[9px] text-slate-500 text-center uppercase tracking-widest font-sans font-bold">
                  4-Digit Security PIN
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                  <AlertTriangle size={14} className="shrink-0 text-rose-400" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={`w-full py-3 rounded-2xl text-[12px] font-bold tracking-wider flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  actionType === "delete"
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/20"
                    : actionType === "unlock"
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/20"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin inline-block" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 size={13} />
                    {actionType === "unlock" ? "Unlock Connection" : "Confirm Authentication"}
                  </>
                )}
              </button>
            </div>
          </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
