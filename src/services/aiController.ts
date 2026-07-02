/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiService, QuickFillResponse, SuggestRewardResponse, VerifyClaimResponse } from "./api";
import { Post } from "../types";

export const aiController = {
  /**
   * Quick-fills item details from a camera photo
   */
  async quickFillFromPhoto(imageBase64: string): Promise<QuickFillResponse> {
    try {
      return await apiService.quickFillPhoto(imageBase64);
    } catch (error) {
      console.error("aiController.quickFillFromPhoto failed:", error);
      throw new Error("AI could not read the item image. Please try a clearer picture or enter details manually.");
    }
  },

  /**
   * Structured voice processing
   */
  async quickFillFromVoice(transcript: string): Promise<QuickFillResponse> {
    try {
      return await apiService.quickFillVoice(transcript);
    } catch (error) {
      console.error("aiController.quickFillFromVoice failed:", error);
      throw new Error("AI was unable to process your voice transcript. Please enter details manually.");
    }
  },

  /**
   * Enhances a description to be more searchable and specific
   */
  async enhanceItemDescription(item: string, category: string, description: string): Promise<string> {
    try {
      const res = await apiService.enhanceDescription(item, category, description);
      return res.description;
    } catch (error) {
      console.error("aiController.enhanceItemDescription failed:", error);
      return description; // Fallback to raw description
    }
  },

  /**
   * Estimates a recommended reward
   */
  async recommendReward(item: string, description: string): Promise<SuggestRewardResponse> {
    try {
      return await apiService.suggestReward(item, description);
    } catch (error) {
      console.error("aiController.recommendReward failed:", error);
      return {
        min: 500,
        max: 1000,
        reason: "AI suggestion was unavailable. Using standard community reward recommendations.",
      };
    }
  },

  /**
   * Suggests where an item might have been lost based on a timeline
   */
  async reconstructUserTimeline(item: string, timeline: string): Promise<string> {
    try {
      const res = await apiService.reconstructTimeline(item, timeline);
      return res.analysis;
    } catch (error) {
      console.error("aiController.reconstructUserTimeline failed:", error);
      throw new Error("AI timeline reconstruction is temporarily offline. Please trace your steps manually.");
    }
  },

  /**
   * Generates custom questions for proving ownership
   */
  async generateVerificationQuestions(item: string, description: string): Promise<string[]> {
    try {
      const questions = await apiService.generateVerification(item, description);
      if (questions && questions.length > 0) return questions;
      throw new Error("Empty questions generated");
    } catch (error) {
      console.error("aiController.generateVerificationQuestions failed:", error);
      // Fallback robust generic questions
      return [
        "What is the brand or color of the item?",
        "Can you describe any unique scratches, markings, or content inside?",
      ];
    }
  },

  /**
   * Verifies the claimant's answers against the actual description
   */
  async verifyClaimOwnership(
    item: string,
    description: string,
    questions: string[],
    answers: string[]
  ): Promise<VerifyClaimResponse> {
    try {
      return await apiService.verifyClaim(item, description, questions, answers);
    } catch (error) {
      console.error("aiController.verifyClaimOwnership failed:", error);
      return {
        verified: false,
        confidence: 0,
        message: "AI validation server is temporarily unreachable. Please contact the owner directly.",
      };
    }
  },
};
