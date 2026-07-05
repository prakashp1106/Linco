/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from "react";
import { aiController } from "../services/aiController";
import { QuickFillResponse, SuggestRewardResponse, VerifyClaimResponse } from "../services/api";

export function useAI() {
  const [photoLoading, setPhotoLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  // Suggested values / detector states
  const [rewardReason, setRewardReason] = useState("");
  const [timelineResult, setTimelineResult] = useState("");

  const runPhotoAnalyzer = useCallback(async (imageBase64: string): Promise<QuickFillResponse> => {
    setPhotoLoading(true);
    try {
      const res = await aiController.quickFillFromPhoto(imageBase64);
      return res;
    } finally {
      setPhotoLoading(false);
    }
  }, []);

  const runVoiceAnalyzer = useCallback(async (transcript: string): Promise<QuickFillResponse> => {
    setVoiceLoading(true);
    try {
      const res = await aiController.quickFillFromVoice(transcript);
      return res;
    } finally {
      setVoiceLoading(false);
    }
  }, []);

  const runEnhanceDescription = useCallback(async (item: string, category: string, rawDesc: string): Promise<string> => {
    setEnhanceLoading(true);
    try {
      const res = await aiController.enhanceItemDescription(item, category, rawDesc);
      return res;
    } finally {
      setEnhanceLoading(false);
    }
  }, []);

  const runRewardSuggestion = useCallback(async (item: string, description: string): Promise<SuggestRewardResponse> => {
    setRewardLoading(true);
    try {
      const res = await aiController.recommendReward(item, description);
      setRewardReason(res.reason);
      return res;
    } finally {
      setRewardLoading(false);
    }
  }, []);

  const runTimelineAnalysis = useCallback(async (item: string, timeline: string): Promise<string> => {
    setTimelineLoading(true);
    try {
      const analysis = await aiController.reconstructUserTimeline(item, timeline);
      setTimelineResult(analysis);
      return analysis;
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const runVerificationQuestions = useCallback(async (item: string, description: string, postId: string): Promise<string[]> => {
    return aiController.generateVerificationQuestions(item, description, postId);
  }, []);

  const runClaimOwnership = useCallback(async (
    item: string,
    description: string,
    questions: string[],
    answers: string[]
  ): Promise<VerifyClaimResponse> => {
    setClaimLoading(true);
    try {
      return await aiController.verifyClaimOwnership(item, description, questions, answers);
    } finally {
      setClaimLoading(false);
    }
  }, []);

  return {
    photoLoading,
    voiceActive,
    setVoiceActive,
    voiceLoading,
    enhanceLoading,
    rewardLoading,
    timelineLoading,
    claimLoading,
    rewardReason,
    setRewardReason,
    timelineResult,
    setTimelineResult,
    runPhotoAnalyzer,
    runVoiceAnalyzer,
    runEnhanceDescription,
    runRewardSuggestion,
    runTimelineAnalysis,
    runVerificationQuestions,
    runClaimOwnership,
  };
}
