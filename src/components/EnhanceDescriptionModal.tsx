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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      id="enhance-description-modal"
    >
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 font-sans">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Sparkles size={18} className={isLoading ? "animate-spin" : ""} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {t("enhance.modalTitle", "AI-Enhanced Description Review")}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                {t("enhance.modalNotice", "AI-assisted — please review and verify before submitting")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-left">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
              <p className="text-sm font-bold text-slate-900">
                {t("enhance.analyzing", "Analyzing forensic details & formatting...")}
              </p>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Extracting brand, model, unique scratch marks, and structuring search keywords for matching.
              </p>
            </div>
          ) : (
            <>
              {/* Comparison Grid: Original vs AI-Enhanced */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Description */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                        {t("enhance.originalLabel", "Original Description")}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {originalText.length} chars
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                      {originalText || "(No description entered)"}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleKeepOriginal}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>{t("enhance.keepOriginal", "Keep Original")}</span>
                    </button>
                  </div>
                </div>

                {/* AI-Enhanced Description */}
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 flex flex-col justify-between relative group shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-700 flex items-center gap-1">
                        <Sparkles size={11} className="text-indigo-600" />
                        {t("enhance.enhancedLabel", "AI-Enhanced Description")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
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
                        className="w-full text-xs p-2.5 rounded-lg bg-white border border-indigo-300 text-slate-900 outline-none resize-none leading-relaxed shadow-2xs"
                      />
                    ) : (
                      <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                        {enhancedData?.description || "No enhanced version produced."}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-indigo-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">
                      High match visibility
                    </span>
                    {isEditing && (
                      <span className="text-[10px] text-amber-700 font-semibold">
                        (Editing mode active)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Extracted Forensic Facts */}
              {structured && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    Extracted Forensic Facts
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {structured.brand && (
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                        <strong className="text-slate-500 font-medium">Brand:</strong> {structured.brand}
                      </span>
                    )}
                    {structured.model && (
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                        <strong className="text-slate-500 font-medium">Model:</strong> {structured.model}
                      </span>
                    )}
                    {structured.color && (
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                        <strong className="text-slate-500 font-medium">Color:</strong> {structured.color}
                      </span>
                    )}
                    {structured.visibleCondition && (
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                        <strong className="text-slate-500 font-medium">Condition:</strong> {structured.visibleCondition}
                      </span>
                    )}
                    {structured.uniqueMarks && (
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                        <strong className="text-slate-500 font-medium">Marks:</strong> {structured.uniqueMarks}
                      </span>
                    )}
                    {structured.identifyingDetails && (
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                        <strong className="text-slate-500 font-medium">Identifiers:</strong> {structured.identifyingDetails}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Missing Information Suggestions */}
              {missingSuggestions.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <HelpCircle size={12} className="text-amber-600" />
                    {t("enhance.missingSuggestions", "Missing Details Suggestions (Optional)")}
                  </span>
                  <p className="text-xs text-slate-700">
                    Adding these details can increase your match confidence:
                  </p>
                  <ul className="space-y-1">
                    {missingSuggestions.map((item, idx) => (
                      <li key={idx} className="text-xs text-amber-900 flex items-start gap-1.5 font-sans">
                        <span className="text-amber-600 font-bold">•</span>
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
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 shadow-2xs"
            >
              <RotateCcw size={13} />
              <span>{t("enhance.tryAgain", "Try Again")}</span>
            </button>
            <button
              type="button"
              onClick={handleKeepOriginal}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              {t("enhance.keepOriginal", "Keep Original")}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleApply}
              disabled={isLoading || (!editedText && !enhancedData?.description)}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 shadow-2xs active:scale-95"
            >
              <Check size={14} />
              <span>{t("enhance.acceptApply", "Accept & Apply")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
