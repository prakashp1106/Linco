/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiService, QuickFillResponse, SuggestRewardResponse, VerifyClaimResponse, EnhanceDescriptionResponse, ReconstructTimelineResponse } from "./api";


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
   * Enhances a description to be more searchable and specific with forensic structured extraction
   */
  async enhanceItemDescription(item: string, category: string, description: string, language?: string): Promise<EnhanceDescriptionResponse> {
    try {
      return await apiService.enhanceDescription(item, category, description, language);
    } catch (error) {
      console.error("aiController.enhanceItemDescription failed:", error);
      return {
        description,
        originalDescription: description,
        structured: {
          category: category || "Property",
          brand: "Not provided",
          model: "Not provided",
          color: "Not provided",
          visibleCondition: "Not provided",
          distinctiveCharacteristics: "Not provided",
          uniqueMarks: "Not provided",
          accessories: "Not provided",
          identifyingDetails: description,
          searchKeywords: [item, category].filter(Boolean),
          missingInfoSuggestions: ["Would you like to add the brand name?", "Would you like to specify the color?"]
        }
      };
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
   * Suggests where an item might have been lost based on a timeline with structured checkpoints
   */
  async reconstructUserTimeline(item: string, timeline: string, language?: string): Promise<ReconstructTimelineResponse> {
    try {
      return await apiService.reconstructTimeline(item, timeline, language);
    } catch (error) {
      console.error("aiController.reconstructUserTimeline failed:", error);
      return {
        analysis: "AI timeline reconstruction is temporarily offline. Please trace your steps manually.",
        events: [
          {
            id: "evt_1",
            time: "Recent",
            timeType: "RELATIVE",
            location: "Location described",
            locationType: "USER_PROVIDED",
            description: timeline,
            source: "USER_PROVIDED",
            confidence: "Medium"
          }
        ],
        likelyLossLocation: "Last reported location",
        likelyTimeWindow: "Recent hours",
        reasoning: "Trace each location visited chronologically to locate your item."
      };
    }
  },

  /**
   * Generates custom questions for proving ownership
   */
  async generateVerificationQuestions(item: string, description: string, postId: string): Promise<string[]> {
    try {
      const questions = await apiService.generateVerification(item, description, postId);
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
