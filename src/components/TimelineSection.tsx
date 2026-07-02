/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Clock, Sparkles, MapPin, AlertCircle } from "lucide-react";
import { useAI } from "../hooks/useAI";

interface TimelineSectionProps {
  itemName: string;
  onSelectSuggestedAddress: (address: string) => void;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  itemName,
  onSelectSuggestedAddress,
}) => {
  const [timelineInput, setTimelineInput] = useState("");
  const { timelineLoading, timelineResult, runTimelineAnalysis } = useAI();
  const [error, setError] = useState("");

  const handleTrace = async () => {
    if (!timelineInput.trim()) {
      setError("Please describe your timeline first (e.g., 'went to café at 2 PM, then library...')");
      return;
    }
    setError("");
    try {
      await runTimelineAnalysis(itemName || "this item", timelineInput);
    } catch (err: any) {
      setError(err.message || "Failed to analyze timeline");
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-900/80 backdrop-blur-md space-y-4" id="timeline-tracer">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <Clock size={16} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-200">AI Steps &amp; Timeline Tracer</h4>
          <p className="text-[10px] text-slate-500">Trace where you might have left it</p>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          rows={3}
          value={timelineInput}
          onChange={(e) => {
            setError("");
            setTimelineInput(e.target.value);
          }}
          placeholder="Describe your timeline (e.g., 'I was at Symbiosis Cafeteria at 1:00 PM, then sat in the central library on 2nd floor from 2 PM to 4 PM, then went to computer lab...')"
          className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-900 focus:border-violet-500/50 text-slate-200 outline-none transition placeholder:text-slate-600 resize-none"
        />

        {error && (
          <p className="text-[10px] text-red-400 flex items-center gap-1">
            <AlertCircle size={10} /> {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleTrace}
          disabled={timelineLoading}
          className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Sparkles size={12} className={timelineLoading ? "animate-spin" : ""} />
          {timelineLoading ? "AI is tracing..." : "Reconstruct Lost Location"}
        </button>
      </div>

      {timelineResult && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-900/80 space-y-3 animate-fade-in text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-violet-400">
            <Sparkles size={12} />
            <span>AI Suggested Critical Zones</span>
          </div>
          
          <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {timelineResult}
          </div>

          <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-500 leading-normal">
            💡 Tap any of your critical timeline checkpoints above to automatically populate your report location!
          </div>
        </div>
      )}
    </div>
  );
};
