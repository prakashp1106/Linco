/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Check,
  RotateCcw,
  Edit3,
  X,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Tag,
  ArrowRight,
} from "lucide-react";
import { EnhanceDescriptionResponse } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

interface EnhanceDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  enhancedData: EnhanceDescriptionResponse | null;
  isLoading?: boolean;
  onAccept: (enhancedText: string, structured?: any) => void;
  onRetry: () => void;
}

export const EnhanceDescriptionModal: React.FC<EnhanceDescriptionModalProps> = ({
  isOpen,
  onClose,
  originalText,
  enhancedData,
  isLoading = false,
  onAccept,
  onRetry,
}) => {
  const { t } = useLanguage();
  const [editedText, setEditedText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (enhancedData?.description) {
      setEditedText(enhancedData.description);
    } else {
      setEditedText("");
    }
    setIsEditing(false);
  }, [enhancedData]);

  if (!isOpen) return null;

  const handleApply = () => {
    const finalContent = isEditing ? editedText : enhancedData?.description || editedText;
    onAccept(finalContent, enhancedData?.structured);
    onClose();
  };

  const handleKeepOriginal = () => {
    onAccept(originalText, undefined);
    onClose();
  };

  const structured = enhancedData?.structured;
  const missingSuggestions = structured?.missingInfoSuggestions || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      id="enhance-description-modal"
    >
      <div className="relative w-full max-w-2xl bg-[#090b14] border border-[#1e2136] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#181a2c] flex items-center justify-between bg-gradient-to-r from-cyan-950/30 via-slate-900 to-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles size={20} className={isLoading ? "animate-spin" : ""} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
                {t("enhance.modalTitle", "AI-Enhanced Description Review")}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {t("enhance.modalNotice", "AI-assisted — please review and verify before submitting")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-left">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <p className="text-sm font-bold text-slate-200">
                {t("enhance.analyzing", "Analyzing forensic details & formatting...")}
              </p>
              <p className="text-xs text-slate-500 max-w-xs">
                Extracting brand, model, unique scratch marks, and structuring search keywords for matching.
              </p>
            </div>
          ) : (
            <>
              {/* Comparison Grid: Original vs AI-Enhanced */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Description */}
                <div className="p-4 rounded-2xl bg-[#060810] border border-[#161828] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500">
                        {t("enhance.originalLabel", "Original Description")}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {originalText.length} chars
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                      {originalText || "(No description entered)"}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-900">
                    <button
                      type="button"
                      onClick={handleKeepOriginal}
                      className="text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>{t("enhance.keepOriginal", "Keep Original")}</span>
                    </button>
                  </div>
                </div>

                {/* AI-Enhanced Description */}
                <div className="p-4 rounded-2xl bg-cyan-950/15 border border-cyan-500/30 flex flex-col justify-between relative group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-cyan-400 flex items-center gap-1">
                        <Sparkles size={11} />
                        {t("enhance.enhancedLabel", "AI-Enhanced Description")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={11} />
                        <span>{isEditing ? "Cancel Edit" : "Edit Text"}</span>
                      </button>
                    </div>

                    {isEditing ? (
                      <textarea
                        rows={6}
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl bg-[#05060b] border border-cyan-500/50 text-slate-100 outline-none font-mono resize-none leading-relaxed"
                      />
                    ) : (
                      <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                        {enhancedData?.description || "No enhanced version produced."}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-cyan-900/30 flex items-center justify-between">
                    <span className="text-[10px] text-cyan-400/80 font-medium">
                      High match visibility
                    </span>
                    {isEditing && (
                      <span className="text-[10px] text-amber-400 font-medium">
                        (Editing mode active)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Extracted Forensic Facts */}
              {structured && (
                <div className="p-4 rounded-2xl bg-[#060810] border border-[#161828] space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    Extracted Forensic Facts
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {structured.brand && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                        <strong className="text-slate-400 font-medium">Brand:</strong> {structured.brand}
                      </span>
                    )}
                    {structured.model && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                        <strong className="text-slate-400 font-medium">Model:</strong> {structured.model}
                      </span>
                    )}
                    {structured.color && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                        <strong className="text-slate-400 font-medium">Color:</strong> {structured.color}
                      </span>
                    )}
                    {structured.visibleCondition && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                        <strong className="text-slate-400 font-medium">Condition:</strong> {structured.visibleCondition}
                      </span>
                    )}
                    {structured.uniqueMarks && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                        <strong className="text-slate-400 font-medium">Marks:</strong> {structured.uniqueMarks}
                      </span>
                    )}
                    {structured.identifyingDetails && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                        <strong className="text-slate-400 font-medium">Identifiers:</strong> {structured.identifyingDetails}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Missing Information Suggestions */}
              {missingSuggestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <HelpCircle size={12} className="text-amber-400" />
                    {t("enhance.missingSuggestions", "Missing Details Suggestions (Optional)")}
                  </span>
                  <p className="text-xs text-slate-300">
                    Adding these details can increase your match confidence by 40%:
                  </p>
                  <ul className="space-y-1">
                    {missingSuggestions.map((item, idx) => (
                      <li key={idx} className="text-xs text-amber-200/90 flex items-start gap-1.5 font-mono">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-[#181a2c] bg-[#06070d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40"
            >
              <RotateCcw size={13} />
              <span>{t("enhance.tryAgain", "Try Again")}</span>
            </button>
            <button
              type="button"
              onClick={handleKeepOriginal}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold transition cursor-pointer"
            >
              {t("enhance.keepOriginal", "Keep Original")}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleApply}
              disabled={isLoading || (!editedText && !enhancedData?.description)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition cursor-pointer disabled:opacity-40"
            >
              <Check size={14} className="stroke-[3]" />
              <span>{t("enhance.acceptApply", "Accept & Apply")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
