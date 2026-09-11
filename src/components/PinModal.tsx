/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Lock, X, CheckCircle2, AlertTriangle, Key, ShieldCheck, RefreshCw, Delete } from "lucide-react";
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
  const [pinDigits, setPinDigits] = useState<string[]>(Array(4).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setPinDigits(Array(4).fill(""));
      setError("");
      setShaking(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 250);
    }
  }, [isOpen]);

  const getPINString = (digits: string[]) => {
    return digits.join("").trim();
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleConfirm = async (finalPin?: string) => {
    const pinToSubmit = finalPin || getPINString(pinDigits);
    if (!/^\d{4}$/.test(pinToSubmit)) {
      setError("Please enter a valid 4-digit PIN");
      triggerShake();
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(pinToSubmit);
      setPinDigits(Array(4).fill(""));
      onClose();
    } catch (err: any) {
      setError(err.message || "Incorrect PIN. Please try again.");
      triggerShake();
    } finally {
      setSubmitting(false);
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

    // Auto submit if 4 digits are completed
    const fullPin = updated.join("");
    if (fullPin.length === 4) {
      setTimeout(() => {
        handleConfirm(fullPin);
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
        handleConfirm(pastedData);
      }, 200);
    }
  };

  const handleKeypadPress = (digit: string) => {
    setError("");
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
        handleConfirm(fullPin);
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

  const keypadNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          id="pin-modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.97, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 8 }}
            className={`w-full max-w-sm rounded-2xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden relative ${
              shaking ? "animate-shake" : ""
            }`}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  actionType === "delete" 
                    ? "bg-rose-50 text-rose-600" 
                    : actionType === "unlock" 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "bg-emerald-50 text-emerald-600"
                }`}>
                  <Lock size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {actionType === "delete" 
                      ? "Confirm Deletion" 
                      : actionType === "unlock" 
                      ? "Unlock Details" 
                      : "Mark Resolved"}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-5">
              <p className="text-xs text-slate-500 leading-relaxed text-center">
                {actionType === "unlock" 
                  ? "Enter the 4-digit security PIN set when creating this report to view contact details."
                  : "Enter the 4-digit security PIN for this report to confirm this action."}
              </p>

              {/* Box inputs */}
              <div className="flex justify-center gap-3" id="pin-digits-row">
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
                    className="w-12 h-13 text-center text-xl font-bold rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900 transition"
                  />
                ))}
              </div>

              {/* Custom Numeric Keypad */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  {keypadNumbers.map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadPress(digit)}
                      className="py-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-800 transition cursor-pointer active:scale-95 shadow-2xs"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    className="py-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer active:scale-95 shadow-2xs"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress("0")}
                    className="py-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-800 transition cursor-pointer active:scale-95 shadow-2xs"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    className="py-2.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 transition flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                    aria-label="Delete"
                  >
                    <Delete size={15} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={() => handleConfirm()}
                disabled={submitting}
                className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  actionType === "delete"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : actionType === "unlock"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="animate-spin inline-block" size={14} />
                    Verifying...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    {actionType === "unlock" ? "Unlock Details" : "Confirm"}
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
