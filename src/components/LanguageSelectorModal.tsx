/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Check, Globe, Search, X, Sparkles, ArrowRight, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { SUPPORTED_LANGUAGES, LanguageCode } from "../services/i18n";

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isInitialOnboarding?: boolean;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  isInitialOnboarding = false,
}) => {
  const { lang, setLang, completeFirstTime, t } = useLanguage();
  const [selected, setSelected] = useState<LanguageCode>(lang);
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.nativeName.toLowerCase().includes(q) ||
      item.region.toLowerCase().includes(q) ||
      item.samplePhrase.toLowerCase().includes(q)
    );
  });

  const handleConfirm = () => {
    setLang(selected);
    if (isInitialOnboarding) {
      completeFirstTime();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
          onClick={() => {
            if (!isInitialOnboarding && onClose) onClose();
          }}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-2xl rounded-3xl bg-[#090a10] border border-[#202234] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="relative p-6 sm:p-8 pb-4 border-b border-[#181a28] bg-gradient-to-b from-[#111322] to-transparent">
            {/* Top Row: Icon + Close (if not onboarding) */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      LINCO Regional
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">12 Indian Languages</span>
                  </div>
                </div>
              </div>

              {!isInitialOnboarding && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition border border-slate-800 cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {t("lang.heading", "Choose Your Language")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium leading-relaxed">
              {t("lang.subheading", "Use LINCO in the language you're most comfortable with.")}
            </p>

            {/* Search Input */}
            <div className="relative mt-4">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("lang.searchPlaceholder", "Search languages (e.g. Hindi, हिन्दी, Marathi, தமிழ்)...")}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#05060a] border border-[#1d2030] focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/20 outline-none text-xs text-slate-100 placeholder:text-slate-600 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Languages Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 custom-scrollbar">
            {filteredLanguages.map((item) => {
              const isSelected = selected === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelected(item.code)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between gap-2 group ${
                    isSelected
                      ? "bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40"
                      : "bg-[#0c0d16]/70 border-[#181a28] hover:border-slate-700 hover:bg-[#111322]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                          {item.nativeName}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          ({item.name})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {item.region}
                      </span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-amber-500 text-black font-black"
                          : "border border-slate-700 group-hover:border-slate-500"
                      }`}
                    >
                      {isSelected && <Check size={14} className="stroke-[3]" />}
                    </div>
                  </div>

                  {/* Sample phrase pill */}
                  <div className="pt-1.5 border-t border-[#181a28]/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="italic truncate text-slate-400 font-normal">
                      "{item.samplePhrase}"
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-600 font-bold ml-2">
                      {item.script}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredLanguages.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                No languages found matching "{searchQuery}".
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 sm:p-6 pt-3 border-t border-[#181a28] bg-[#07080e] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Shield size={13} className="text-amber-400 shrink-0" />
              <span>{t("lang.note", "You can change your language anytime from Settings.")}</span>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs tracking-wide uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] transition cursor-pointer"
            >
              <span>{t("lang.continue", "Continue with LINCO")}</span>
              <ArrowRight size={14} className="stroke-[3]" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
