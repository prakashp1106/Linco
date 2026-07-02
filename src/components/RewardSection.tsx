/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DollarSign, Sparkles, Check, AlertCircle } from "lucide-react";
import { useAI } from "../hooks/useAI";

interface RewardSectionProps {
  itemName: string;
  itemDescription: string;
  onSetSuggestedReward: (amount: string) => void;
}

export const RewardSection: React.FC<RewardSectionProps> = ({
  itemName,
  itemDescription,
  onSetSuggestedReward,
}) => {
  const { rewardLoading, rewardReason, runRewardSuggestion } = useAI();
  const [estimatedMin, setEstimatedMin] = useState<number | null>(null);
  const [estimatedMax, setEstimatedMax] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleEstimate = async () => {
    if (!itemName.trim()) {
      setError("Please fill in the item name above first!");
      return;
    }
    setError("");
    try {
      const res = await runRewardSuggestion(itemName, itemDescription || "Standard visual property");
      setEstimatedMin(res.min);
      setEstimatedMax(res.max);
    } catch (err: any) {
      setError(err.message || "Failed to calculate reward recommendation");
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-900/80 backdrop-blur-md space-y-4" id="reward-recommender">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <DollarSign size={16} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-200">AI Reward Recommender</h4>
          <p className="text-[10px] text-slate-500">Find the optimal thank-you token</p>
        </div>
      </div>

      <div className="space-y-3">
        {error && (
          <p className="text-[10px] text-red-400 flex items-center gap-1">
            <AlertCircle size={10} /> {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleEstimate}
          disabled={rewardLoading}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Sparkles size={12} className={rewardLoading ? "animate-spin" : ""} />
          {rewardLoading ? "Calculating range..." : "Suggest Recommended Reward"}
        </button>
      </div>

      {estimatedMin !== null && estimatedMax !== null && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-900/80 space-y-3 animate-fade-in text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Estimated Fair Range</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              ₹{estimatedMin} - ₹{estimatedMax}
            </span>
          </div>

          {rewardReason && (
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              {rewardReason}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onSetSuggestedReward(String(estimatedMin))}
              className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-400 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check size={10} /> Keep Min (₹{estimatedMin})
            </button>
            <button
              type="button"
              onClick={() => onSetSuggestedReward(String(estimatedMax))}
              className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-400 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check size={10} /> Keep Max (₹{estimatedMax})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
