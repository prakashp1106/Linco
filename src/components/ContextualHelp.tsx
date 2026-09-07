/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { HelpCircle, Volume2, VolumeX, Sparkles, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface ContextualHelpProps {
  fieldKey: "itemName" | "location" | "time" | "description" | "identifying" | "timeline";
  className?: string;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({ fieldKey, className = "" }) => {
  const { meta, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const helpText = t(`help.${fieldKey}`);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(helpText);
    utterance.lang = meta.speechCode || "en-IN";
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleClose = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] text-amber-400/90 hover:text-amber-300 font-medium transition cursor-pointer group"
        >
          <HelpCircle size={12} className="text-amber-400 group-hover:scale-110 transition-transform" />
          <span>{t("help.notSure", "Not sure what to enter here?")}</span>
        </button>
      ) : (
        <div className="mt-2 p-3.5 rounded-2xl bg-[#0c0e1a] border border-amber-500/30 shadow-xl space-y-2.5 animate-fadeIn text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles size={13} />
              <span>{t("help.askLinco", "Ask LINCO")} ({meta.nativeName})</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {helpText}
          </p>

          <div className="flex items-center gap-2 pt-1 border-t border-[#1a1d30]">
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isSpeaking
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                  : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30"
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={13} />
                  <span>{t("help.stopListen", "Stop Listening")}</span>
                </>
              ) : (
                <>
                  <Volume2 size={13} />
                  <span>{t("help.listen", "Listen to Explanation")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
