/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Lock, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PinModalProps {
  isOpen: boolean;
  actionType: "delete" | "resolve";
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-900 overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={16} className={actionType === "delete" ? "text-red-400" : "text-emerald-400"} />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                {actionType === "delete" ? "Delete Report" : "Mark Resolved"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition hover:bg-slate-900 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed text-center">
              Please enter the 4-digit Security PIN you specified when creating this report to complete this action.
            </p>

            <div className="space-y-1.5">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setError("");
                  setPin(e.target.value.replace(/\D/g, ""));
                }}
                placeholder="••••"
                className="w-full text-center tracking-[1em] text-2xl font-mono font-bold py-3 px-4 rounded-2xl bg-slate-950 border border-slate-900 focus:border-cyan-500/50 text-slate-100 outline-none transition"
              />
              <p className="text-[10px] text-slate-500 text-center font-mono">
                Security PIN (4 numeric digits)
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertTriangle size={14} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={submitting}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                actionType === "delete"
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/10"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/10"
              }`}
            >
              {submitting ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Confirm Action
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
