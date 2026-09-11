/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Clock, Sparkles, MapPin, AlertCircle, Plus, Check } from "lucide-react";
import { useAI } from "../hooks/useAI";
import { useLanguage } from "../context/LanguageContext";
import { VoiceInputButton } from "./VoiceInputButton";
import { ContextualHelp } from "./ContextualHelp";
import { TimelineEventItem } from "../services/api";

interface TimelineSectionProps {
  itemName: string;
  onSelectSuggestedAddress: (address: string) => void;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  itemName,
  onSelectSuggestedAddress,
}) => {
  const { lang, t } = useLanguage();
  const [timelineInput, setTimelineInput] = useState("");
  const { timelineLoading, timelineData, setTimelineData, runTimelineAnalysis } = useAI();
  const [error, setError] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New checkpoint form
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleTrace = async () => {
    if (!timelineInput.trim()) {
      setError("Please describe your steps first (e.g. 'left home at 9 AM, reached metro at 9:30...')");
      return;
    }
    setError("");
    try {
      await runTimelineAnalysis(itemName || "this item", timelineInput, lang);
    } catch (err: any) {
      setError(err.message || "Failed to analyze timeline");
    }
  };

  const handleAddCheckpoint = () => {
    if (!newLocation.trim()) return;
    const newEvt: TimelineEventItem = {
      id: `manual_${Date.now()}`,
      time: newTime.trim() || "Approximate",
      timeType: "APPROXIMATE",
      location: newLocation.trim(),
      locationType: "USER_PROVIDED",
      description: newDescription.trim() || "Movement checkpoint",
      confidence: "High",
      source: "USER_PROVIDED",
    };

    if (timelineData) {
      setTimelineData({
        ...timelineData,
        events: [...timelineData.events, newEvt],
      });
    }
    setIsAddingNew(false);
    setNewTime("");
    setNewLocation("");
    setNewDescription("");
  };

  const handleDeleteCheckpoint = (index: number) => {
    if (timelineData) {
      const updated = timelineData.events.filter((_, i) => i !== index);
      setTimelineData({
        ...timelineData,
        events: updated,
      });
    }
  };

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl bg-[#121520] border border-slate-800 space-y-4 text-left"
      id="timeline-tracer"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-100 tracking-tight">
              {t("timeline.title", "AI Timeline Reconstructor")}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
              {t("timeline.subtitle", "Chronological reconstruction of your movements and loss probability")}
            </p>
          </div>
        </div>

        <ContextualHelp fieldKey="timeline" />
      </div>

      {/* Input Area */}
      <div className="space-y-2.5">
        <div className="relative">
          <textarea
            rows={3}
            value={timelineInput}
            onChange={(e) => {
              setError("");
              setTimelineInput(e.target.value);
            }}
            placeholder="Describe your sequence of steps (e.g., 'left PG at 9 AM, took metro at 9:30 to Rajiv Chowk, sat in library till 1 PM, then canteen at 1:30 PM...')"
            className="w-full text-xs p-3.5 pr-20 rounded-xl bg-[#0c0e16] border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none transition placeholder:text-slate-600 resize-none leading-relaxed"
          />
          <div className="absolute right-2.5 bottom-2.5">
            <VoiceInputButton
              fieldName="Timeline"
              currentValue={timelineInput}
              onApply={(text) => {
                setTimelineInput(text);
                setError("");
              }}
              size="sm"
            />
          </div>
        </div>

        {error && (
          <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
            <AlertCircle size={12} /> {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleTrace}
          disabled={timelineLoading}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          <Sparkles size={14} className={timelineLoading ? "animate-spin" : ""} />
          <span>
            {timelineLoading
              ? "Reconstructing movements & risk zones..."
              : t("report.step7.traceBtn", "AI Reconstruct Timeline")}
          </span>
        </button>
      </div>

      {/* Structured Results Display */}
      {timelineData && (
        <div className="p-4 rounded-xl bg-[#0c0e16] border border-slate-800/80 space-y-4">
          {/* Top Summary Banner */}
          {(timelineData.likelyLossLocation || timelineData.likelyTimeWindow) && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 block">
                  {t("timeline.likelyLocation", "Likely Misplacement Location")}
                </span>
                <p className="text-xs font-semibold text-slate-100 mt-0.5 flex items-center gap-1.5">
                  <MapPin size={13} className="text-amber-400 shrink-0" />
                  <span>{timelineData.likelyLossLocation || "Analysis in progress"}</span>
                  {timelineData.likelyTimeWindow && (
                    <span className="text-[11px] font-normal text-slate-400">
                      • {timelineData.likelyTimeWindow}
                    </span>
                  )}
                </p>
                {timelineData.reasoning && (
                  <p className="text-[11px] text-slate-400 mt-1 italic font-sans">
                    "{timelineData.reasoning}"
                  </p>
                )}
              </div>

              {timelineData.likelyLossLocation && (
                <button
                  type="button"
                  onClick={() => onSelectSuggestedAddress(timelineData.likelyLossLocation!)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition cursor-pointer self-start sm:self-center"
                >
                  <Check size={12} />
                  <span>{t("timeline.applyLocation", "Use as Report Location")}</span>
                </button>
              )}
            </div>
          )}

          {/* Chronological Checkpoints */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Timeline Checkpoints
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> {t("timeline.addEvent", "+ Add Checkpoint")}
              </button>
            </div>

            <div className="space-y-2">
              {timelineData.events?.map((evt, idx) => {
                const isUserProvided = evt.source === "USER_PROVIDED";
                const badgeColor =
                  evt.confidence === "High"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : evt.confidence === "Medium"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700";

                return (
                  <div
                    key={evt.id || idx}
                    className="p-3 rounded-xl bg-[#121520] border border-slate-800/80 flex items-start justify-between gap-3 group hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#0c0e16] border border-slate-800 text-slate-400 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">
                            {evt.location}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {evt.time}
                          </span>
                          <span
                            className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${badgeColor}`}
                          >
                            {isUserProvided
                              ? t("timeline.userProvided", "USER PROVIDED")
                              : t("timeline.aiInferred", "AI INFERRED")}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {evt.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectSuggestedAddress(evt.location)}
                        title="Use this location"
                        className="p-1 rounded bg-[#0c0e16] hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer transition border border-slate-800"
                      >
                        <MapPin size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCheckpoint(idx)}
                        className="p-1 rounded bg-[#0c0e16] hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 text-[10px] cursor-pointer transition border border-slate-800"
                        title="Delete checkpoint"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Checkpoint In-Place Form */}
            {isAddingNew && (
              <div className="p-3 rounded-xl bg-[#121520] border border-slate-800 space-y-2">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                  New Checkpoint
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Time (e.g. 11:30 AM)"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="p-2 rounded-lg bg-[#0c0e16] border border-slate-800 text-slate-200 outline-none text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Location / Area"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="p-2 rounded-lg bg-[#0c0e16] border border-slate-800 text-slate-200 outline-none text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Description / Activity"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="p-2 rounded-lg bg-[#0c0e16] border border-slate-800 text-slate-200 outline-none text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-2.5 py-1 rounded bg-[#0c0e16] hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCheckpoint}
                    className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                  >
                    Save Checkpoint
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
