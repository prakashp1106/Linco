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
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
          onClick={() => {
            if (!isInitialOnboarding && onClose) onClose();
          }}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="relative p-6 sm:p-8 pb-4 border-b border-slate-100 bg-slate-50/50">
            {/* Top Row: Icon + Close (if not onboarding) */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
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
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200 cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t("lang.heading", "Choose Your Language")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
              {t("lang.subheading", "Use LINCO in the language you're most comfortable with.")}
            </p>

            {/* Search Input */}
            <div className="relative mt-4">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("lang.searchPlaceholder", "Search languages (e.g. Hindi, हिन्दी, Marathi, தமிழ்)...")}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-xs text-slate-900 placeholder:text-slate-400 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Languages Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 custom-scrollbar bg-white">
            {filteredLanguages.map((item) => {
              const isSelected = selected === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelected(item.code)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between gap-2 group ${
                    isSelected
                      ? "bg-indigo-50/70 border-indigo-500 shadow-xs ring-1 ring-indigo-500"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-base sm:text-lg font-bold tracking-tight ${isSelected ? "text-indigo-950" : "text-slate-900"}`}>
                          {item.nativeName}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({item.name})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        {item.region}
                      </span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white font-bold"
                          : "border border-slate-300 group-hover:border-slate-400"
                      }`}
                    >
                      {isSelected && <Check size={14} className="stroke-[2.5]" />}
                    </div>
                  </div>

                  {/* Sample phrase pill */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="italic truncate text-slate-600 font-normal">
                      "{item.samplePhrase}"
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-400 font-bold ml-2">
                      {item.script}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredLanguages.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                No languages found matching "{searchQuery}".
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Shield size={13} className="text-indigo-600 shrink-0" />
              <span>{t("lang.note", "You can change your language anytime from Settings.")}</span>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <span>{t("lang.continue", "Continue with LINCO")}</span>
              <ArrowRight size={14} className="stroke-[2.5]" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
