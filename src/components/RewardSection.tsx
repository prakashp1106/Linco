/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Coins, Sparkles, Check, AlertCircle } from "lucide-react";
import { useAI } from "../hooks/useAI";

interface RewardSectionProps {
  itemName: string;
  itemDescription: string;
  onSetSuggestedReward: (amount: string) => void;
  currentReward?: string;
}

export const RewardSection: React.FC<RewardSectionProps> = ({
  itemName,
  itemDescription,
  onSetSuggestedReward,
  currentReward,
}) => {
  const { rewardLoading, rewardReason, runRewardSuggestion } = useAI();
  const [estimatedMin, setEstimatedMin] = useState<number | null>(null);
  const [estimatedMax, setEstimatedMax] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleEstimate = async () => {
    if (!itemName.trim()) {
      setError("Please fill in the item name first to calculate a reward suggestion.");
      return;
    }
    setError("");
    try {
      const res = await runRewardSuggestion(itemName, itemDescription || "Standard property");
      setEstimatedMin(res.min);
      setEstimatedMax(res.max);
    } catch (err: any) {
      setError(err.message || "Unable to calculate reward recommendation.");
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#121520] border border-slate-800 space-y-4" id="reward-recommender">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
          <Coins size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-slate-200 tracking-tight">
            {currentReward ? "AI Reward Evaluator" : "AI Reward Recommender"}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            {currentReward 
              ? `Estimated recommendation based on your ₹${currentReward} offer.` 
              : "Calculates an optimal fair token for citizen finders."}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {error && (
          <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
            <AlertCircle size={12} className="shrink-0" /> {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleEstimate}
          disabled={rewardLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
        >
          <Sparkles size={13} className={rewardLoading ? "animate-spin" : ""} />
          <span>{rewardLoading ? "Analyzing item value..." : "Suggest Recommended Reward"}</span>
        </button>
      </div>

      {estimatedMin !== null && estimatedMax !== null && (
        <div className="p-4 rounded-xl bg-[#0c0e16] border border-slate-800/80 space-y-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Fair Market Range
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 whitespace-nowrap bg-emerald-950/40 border border-emerald-900/30 px-2.5 py-1 rounded-lg">
              ₹{estimatedMin} – ₹{estimatedMax}
            </span>
          </div>

          {rewardReason && (
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {rewardReason}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onSetSuggestedReward(String(estimatedMin))}
              className="py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Check size={12} /> <span>Min (₹{estimatedMin})</span>
            </button>
            <button
              type="button"
              onClick={() => onSetSuggestedReward(String(estimatedMax))}
              className="py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Check size={12} /> <span>Max (₹{estimatedMax})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
