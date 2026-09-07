/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Mic, MicOff, Check, RotateCcw, X, Volume2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition";
import { useLanguage } from "../context/LanguageContext";

interface VoiceInputButtonProps {
  fieldName: string;
  onApply: (text: string) => void;
  currentValue?: string;
  className?: string;
  size?: "sm" | "md";
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  fieldName,
  onApply,
  currentValue = "",
  className = "",
  size = "md",
}) => {
  const { meta, t } = useLanguage();
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  } = useVoiceRecognition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableText, setEditableText] = useState("");

  // Sync transcript to editableText when final transcript arrives
  useEffect(() => {
    if (transcript) {
      setEditableText(transcript);
    }
  }, [transcript]);

  const handleOpen = () => {
    resetTranscript();
    setEditableText("");
    setIsModalOpen(true);
    startListening();
  };

  const handleClose = () => {
    stopListening();
    setIsModalOpen(false);
  };

  const handleApply = () => {
    const textToApply = editableText.trim() || transcript.trim();
    if (textToApply) {
      // Append if field already has content, or set directly
      const result = currentValue
        ? `${currentValue} ${textToApply}`
        : textToApply;
      onApply(result);
    }
    handleClose();
  };

  const handleRetry = () => {
    resetTranscript();
    setEditableText("");
    startListening();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title={`${t("voice.button", "Voice Input")} (${meta.nativeName})`}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border transition-all cursor-pointer ${
          isListening
            ? "bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse"
            : "bg-[#0b0d18] hover:bg-[#141624] border-[#1d2035] hover:border-amber-500/40 text-slate-300 hover:text-amber-300"
        } ${size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"} ${className}`}
      >
        <Mic size={size === "sm" ? 12 : 14} className={isListening ? "text-rose-400" : "text-amber-400"} />
        <span className="font-semibold">{meta.nativeName}</span>
      </button>

      {/* Voice Review & Transcription Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={handleClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-3xl bg-[#090b14] border border-[#212438] p-6 shadow-2xl z-10 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#181a2c] pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isListening
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    <Mic size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {fieldName} • {t("voice.button", "Voice Input")}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Speaking in: <strong className="text-amber-300">{meta.nativeName}</strong> ({meta.name})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status & Speech Visualization */}
              <div className="p-4 rounded-2xl bg-[#05060b] border border-[#161828] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-2">
                    {isListening ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-rose-400">
                          {t("voice.listening", "Listening... Speak clearly")}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400">
                        {editableText || transcript
                          ? t("voice.reviewSubtitle", "Review before applying:")
                          : "Tap speak to record in " + meta.nativeName}
                      </span>
                    )}
                  </span>

                  {isListening ? (
                    <button
                      type="button"
                      onClick={stopListening}
                      className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer"
                    >
                      Done Speaking
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={12} /> {t("voice.retry", "Speak Again")}
                    </button>
                  )}
                </div>

                {/* Error Banner if any */}
                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Editable Transcript Area */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {t("voice.reviewTitle", "Voice Transcription Review")}
                  </label>
                  <textarea
                    rows={4}
                    value={editableText || interimTranscript}
                    onChange={(e) => setEditableText(e.target.value)}
                    placeholder="Your spoken words will appear here in your chosen Indian language..."
                    className="w-full p-3 rounded-xl bg-[#090b14] border border-[#212438] focus:border-amber-500/60 outline-none text-xs text-slate-100 font-sans resize-none transition leading-relaxed"
                  />
                  {interimTranscript && !editableText && (
                    <p className="text-[10px] text-amber-400/80 italic animate-pulse">
                      Transcribing: "{interimTranscript}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  {t("voice.cancel", "Discard")}
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!editableText.trim() && !transcript.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-extrabold flex items-center gap-1.5 transition disabled:opacity-40 shadow-lg cursor-pointer"
                >
                  <Check size={14} className="stroke-[3]" />
                  <span>{t("voice.apply", "Apply to Field")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
