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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          id="pin-modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className={`w-full max-w-sm rounded-3xl bg-[#07070a] border border-[#161621] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.95)] relative ${
              shaking ? "animate-shake" : ""
            }`}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 opacity-60" />
            
            {/* Header */}
            <div className="p-5 border-b border-[#12121a] bg-[#07070a]/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={15} className={actionType === "delete" ? "text-rose-400" : actionType === "unlock" ? "text-indigo-400" : "text-emerald-400"} />
                <span className="text-[11px] font-mono font-extrabold text-slate-300 uppercase tracking-widest">
                  {actionType === "delete" ? "Authenticate Deletion" : actionType === "unlock" ? "Unlock Connection Keys" : "Verify Resolution"}
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
            <div className="p-6 space-y-5">
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed text-center font-mono">
                {actionType === "unlock" 
                  ? "Enter the 4-digit Security PIN to decrypt contact information safely."
                  : "Enter the 4-digit Security PIN specified when publishing this report to authorize."}
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
                    className="w-12 h-14 text-center text-2xl font-bold rounded-2xl bg-[#030304] border border-[#1c1c26] focus:border-indigo-500 outline-none text-indigo-400 transition"
                  />
                ))}
              </div>

              {/* Custom Numeric Keypad */}
              <div className="bg-[#030304]/60 p-4 rounded-2xl border border-[#161621] space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {keypadNumbers.map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadPress(digit)}
                      className="py-3 rounded-xl bg-[#07070a] hover:bg-[#12121a] border border-[#1c1c26] text-sm font-bold text-slate-200 hover:text-indigo-400 transition cursor-pointer active:scale-95"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    className="py-3 rounded-xl bg-[#07070a] hover:bg-[#12121a] border border-[#1c1c26] text-[10px] uppercase font-bold text-slate-500 transition cursor-pointer active:scale-95"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress("0")}
                    className="py-3 rounded-xl bg-[#07070a] hover:bg-[#12121a] border border-[#1c1c26] text-sm font-bold text-slate-200 hover:text-indigo-400 transition cursor-pointer active:scale-95"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    className="py-3 rounded-xl bg-[#07070a] hover:bg-red-950/20 border border-[#1c1c26] text-rose-400 transition flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    <Delete size={14} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold font-mono">
                  <AlertTriangle size={14} className="shrink-0 text-rose-400 animate-bounce" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={() => handleConfirm()}
                disabled={submitting}
                className={`w-full py-3 rounded-2xl text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  actionType === "delete"
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/20"
                    : actionType === "unlock"
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/20"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center gap-2 font-mono">
                    <RefreshCw className="animate-spin inline-block" size={13} />
                    Verifying...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 size={13} />
                    {actionType === "unlock" ? "Decrypt & Unlock" : "Confirm Request"}
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
