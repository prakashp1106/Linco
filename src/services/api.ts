/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Post, AIMatch, Claim, PotentialMatch, LincoNotification } from "../types";

export interface DBResponse {
  posts: Post[];
  matches: Record<string, AIMatch[]>;
}

export interface QuickFillResponse {
  item: string;
  category: string;
  description: string;
  details?: string;
  urgency?: string;
}

export interface SuggestRewardResponse {
  min: number;
  max: number;
  reason: string;
}

export interface VerifyClaimResponse {
  verified: boolean;
  confidence: number;
  message: string;
}

export interface LincoSaathiiResponse {
  reply: string;
  extractedFields: Partial<Post> | null;
  isReadyToPublish: boolean;
  shouldAutoSubmit: boolean;
}

export const apiService = {
  /**
   * Fetch all posts and AI matches
   */
  async getPosts(): Promise<DBResponse> {
    const response = await fetch("/api/posts");
    if (!response.ok) {
      throw new Error("Failed to load posts from LINCO system");
    }
    return response.json();
  },

  /**
   * Submit a new lost/found report post
   */
  async createPost(postData: Partial<Post> & { securityPin?: string }): Promise<{ success: boolean; post: Post }> {
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to submit post");
    }
    return response.json();
  },

  /**
   * Mark a post as resolved using its PIN
   */
  async resolvePost(id: string, securityPin: string): Promise<{ success: boolean; post: Post }> {
    const response = await fetch(`/api/posts/${id}/resolve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ securityPin }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Incorrect PIN or failed to resolve");
    }
    return response.json();
  },

  /**
   * Delete a post using its PIN
   */
  async deletePost(id: string, securityPin: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/posts/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ securityPin }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Incorrect PIN or failed to delete");
    }
    return response.json();
  },

  /**
   * Verify post security PIN without executing actions
   */
  async verifyPin(id: string, securityPin: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/posts/${id}/verify-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ securityPin }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Incorrect PIN");
    }
    return response.json();
  },

  /**
   * Record a view on a post
   */
  async incrementView(id: string): Promise<{ success: boolean; views: number }> {
    const response = await fetch(`/api/posts/${id}/view`, { method: "POST" });
    if (!response.ok) {
      throw new Error("Failed to register view count");
    }
    return response.json();
  },

  /**
   * AI Quick-fill from Photo
   */
  async quickFillPhoto(imageBase64: string): Promise<QuickFillResponse> {
    const response = await fetch("/api/ai/quick-fill-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "AI failed to analyze photo");
    }
    return response.json();
  },

  /**
   * AI Quick-fill from Voice transcription
   */
  async quickFillVoice(transcript: string): Promise<QuickFillResponse> {
    const response = await fetch("/api/ai/quick-fill-voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "AI failed to decode voice description");
    }
    return response.json();
  },

  /**
   * AI Enhance raw item description
   */
  async enhanceDescription(item: string, category: string, description: string): Promise<{ description: string }> {
    const response = await fetch("/api/ai/enhance-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, category, description }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "AI description enhancement failed");
    }
    return response.json();
  },

  /**
   * AI Suggest a reasonable reward
   */
  async suggestReward(item: string, description: string): Promise<SuggestRewardResponse> {
    const response = await fetch("/api/ai/suggest-reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, description }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "AI reward recommendation failed");
    }
    return response.json();
  },

  /**
   * AI Timeline logical reconstructor
   */
  async reconstructTimeline(item: string, timeline: string): Promise<{ analysis: string }> {
    const response = await fetch("/api/ai/reconstruct-timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, timeline }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "AI timeline analysis failed");
    }
    return response.json();
  },

  /**
   * AI Generate customized verification questions
   */
  async generateVerification(item: string, description: string, postId: string): Promise<string[]> {
    const response = await fetch("/api/ai/generate-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, description, postId }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "AI verification generator failed");
    }
    return response.json();
  },

  /**
   * AI Verify claim answers
   */
  async verifyClaim(
    item: string,
    description: string,
    questions: string[],
    answers: string[]
  ): Promise<VerifyClaimResponse> {
    const response = await fetch("/api/ai/verify-claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, description, questions, answers }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "AI claim verification failed");
    }
    return response.json();
  },

  /**
   * LincoSaathii friendly AI chatbot
   */
  async lincoSaathii(
    history: Array<{ role: "user" | "model"; content: string }>,
    currentState: Partial<Post>,
    message: string
  ): Promise<LincoSaathiiResponse> {
    const response = await fetch("/api/ai/linco-saathii", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, currentState, message }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "LincoSaathii assistant failed");
    }
    return response.json();
  },

  /**
   * Submit a claim for a post
   */
  async submitClaim(
    postId: string,
    claimData: { claimantName: string; claimantContact: string; questions: string[]; answers: string[]; matchedPostId?: string }
  ): Promise<{ success: boolean; claim: Claim }> {
    const response = await fetch(`/api/posts/${postId}/claims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(claimData),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to submit claim");
    }
    return response.json();
  },

  /**
   * Get all claims for a post using owner security PIN
   */
  async listClaims(postId: string, securityPin: string): Promise<{ success: boolean; claims: Claim[] }> {
    const response = await fetch(`/api/posts/${postId}/claims/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ securityPin }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to list claims");
    }
    return response.json();
  },

  /**
   * Track a claim using claim ID and optional tracking code (Magic Link / code lookup)
   */
  async trackClaim(claimId: string, code?: string, postId?: string): Promise<{ success: boolean; claim: Claim }> {
    let url = `/api/claims/track?claimId=${encodeURIComponent(claimId)}`;
    if (code) {
      url += `&code=${encodeURIComponent(code)}`;
    }
    if (postId) {
      url += `&postId=${encodeURIComponent(postId)}`;
    }
    const response = await fetch(url, {
      method: "GET",
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to track claim");
    }
    return response.json();
  },

  /**
   * Approve a claim and supply the decrypted owner contact details
   */
  async approveClaim(
    claimId: string,
    securityPin: string,
    revealedOwnerContact: string,
    postId: string
  ): Promise<{ success: boolean; claim: Claim; post: Post }> {
    const response = await fetch(`/api/claims/${claimId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ securityPin, revealedOwnerContact, postId }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to approve claim");
    }
    return response.json();
  },

  /**
   * Reject a claim
   */
  async rejectClaim(claimId: string, securityPin: string, postId: string): Promise<{ success: boolean; claim: Claim }> {
    const response = await fetch(`/api/claims/${claimId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ securityPin, postId }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to reject claim");
    }
    return response.json();
  },

  /**
   * Fetch all potential matches
   */
  async getMatches(): Promise<{ success: boolean; matches: PotentialMatch[] }> {
    const response = await fetch("/api/matches");
    if (!response.ok) {
      throw new Error("Failed to fetch matches");
    }
    return response.json();
  },

  /**
   * Review/Dismiss a potential match
   */
  async reviewMatch(matchId: string, reviewed: boolean, status?: "Active" | "Dismissed"): Promise<{ success: boolean }> {
    const response = await fetch(`/api/matches/${matchId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewed, status }),
    });
    if (!response.ok) {
      throw new Error("Failed to review match");
    }
    return response.json();
  },

  /**
   * Get match details by ID
   */
  async getMatchById(matchId: string): Promise<{ success: boolean; match: PotentialMatch }> {
    const response = await fetch(`/api/matches/${matchId}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to fetch match details");
    }
    return response.json();
  },

  /**
   * Submit participant verification for a potential match
   */
  async verifyMatch(
    matchId: string,
    data: {
      role: "Owner" | "Finder";
      respondentName: string;
      contact: string;
      questions: string[];
      answers: string[];
      postId: string;
      securityPin?: string;
    }
  ): Promise<{ success: boolean; match: PotentialMatch }> {
    const response = await fetch(`/api/matches/${matchId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to submit verification");
    }
    return response.json();
  },

  /**
   * Approve match verification (Mutual Approval Engine)
   */
  async approveMatch(
    matchId: string,
    data: {
      role: "Owner" | "Finder";
      securityPin?: string;
      postId?: string;
    }
  ): Promise<{ success: boolean; match: PotentialMatch }> {
    const response = await fetch(`/api/matches/${matchId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to approve match");
    }
    return response.json();
  },

  /**
   * Reject match
   */
  async rejectMatch(
    matchId: string,
    data: {
      role: "Owner" | "Finder";
      securityPin?: string;
      postId?: string;
      reason?: string;
    }
  ): Promise<{ success: boolean; match: PotentialMatch }> {
    const response = await fetch(`/api/matches/${matchId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to reject match");
    }
    return response.json();
  },

  /**
   * Send a chat message inside the Match Handover Secure Chat
   * (Enforced: Mutually approved connections only)
   */
  async sendMatchChat(
    matchId: string,
    data: {
      sender: "Owner" | "Finder";
      text: string;
      securityPin?: string;
      postId?: string;
    }
  ): Promise<{ success: boolean; match: PotentialMatch; message: any }> {
    const response = await fetch(`/api/matches/${matchId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to send chat message");
    }
    return response.json();
  },

  /**
   * Fetch in-app notifications for a specific post
   */
  async getNotifications(postId: string): Promise<{ success: boolean; notifications: LincoNotification[] }> {
    const response = await fetch(`/api/notifications?postId=${encodeURIComponent(postId)}`);
    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }
    return response.json();
  },

  /**
   * Mark a notification as read
   */
  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to mark notification as read");
    }
    return response.json();
  },

  /**
   * Get match threshold configuration
   */
  async getConfig(): Promise<{ success: boolean; matchThreshold: number }> {
    const response = await fetch("/api/config");
    if (!response.ok) {
      throw new Error("Failed to fetch configuration");
    }
    return response.json();
  },

  /**
   * Update match threshold configuration
   */
  async updateConfig(threshold: number): Promise<{ success: boolean; matchThreshold: number }> {
    const response = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threshold }),
    });
    if (!response.ok) {
      throw new Error("Failed to update configuration");
    }
    return response.json();
  },

  /**
   * Confirm mutual trust for a potential match
   */
  async submitMatchTrust(
    matchId: string,
    data: { role: "Owner" | "Finder"; securityPin?: string; postId?: string }
  ): Promise<{ success: boolean; match: PotentialMatch }> {
    const response = await fetch(`/api/matches/${matchId}/trust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to confirm trust");
    }
    return response.json();
  },

  /**
   * Start handover process for a potential match
   */
  async startMatchHandover(
    matchId: string,
    data: {
      role: "Owner" | "Finder";
      securityPin?: string;
      postId?: string;
      location?: string;
      meetingTime?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; match: PotentialMatch }> {
    const response = await fetch(`/api/matches/${matchId}/handover/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to start handover");
    }
    return response.json();
  },

  /**
   * Confirm item handover / received for a potential match
   */
  async confirmMatchHandover(
    matchId: string,
    data: { role: "Owner" | "Finder"; securityPin?: string; postId?: string }
  ): Promise<{ success: boolean; match: PotentialMatch }> {
    const response = await fetch(`/api/matches/${matchId}/handover/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to confirm handover");
    }
    return response.json();
  },

  /**
   * Securely retrieve unmasked counterparty contact details & WhatsApp link after mutual trust
   */
  async getMatchRevealedContact(
    matchId: string,
    data: { role: "Owner" | "Finder"; securityPin?: string; postId?: string }
  ): Promise<{
    success: boolean;
    contact: string;
    normalizedPhone: string;
    whatsappUrl: string;
    item: string;
  }> {
    const response = await fetch(`/api/matches/${matchId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Contact is still locked or unavailable");
    }
    return response.json();
  },

  /**
   * Submit community "I Have This Item" finder verification
   */
  async submitCommunityFound(data: {
    lostPostId: string;
    finderName: string;
    finderContact: string;
    finderSecurityPin?: string;
    foundLocation?: string;
    foundDetails?: string;
    foundImage?: string | null;
    answers?: string[];
    questions?: string[];
  }): Promise<{ success: boolean; match: PotentialMatch; post: Post }> {
    const response = await fetch("/api/matches/community-found", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to submit finder verification");
    }
    return response.json();
  },

  /**
   * Send a chat message inside the Recovery Room
   */
  async sendChatMessage(claimId: string, sender: "Claimant" | "Finder", text: string): Promise<{ success: boolean; claim: Claim }> {
    const response = await fetch(`/api/claims/${claimId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender, text }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to send chat message");
    }
    return response.json();
  },

  /**
   * Confirm mutual trust inside the Recovery Room
   */
  async confirmTrust(claimId: string, role: "Claimant" | "Finder"): Promise<{ success: boolean; claim: Claim }> {
    const response = await fetch(`/api/claims/${claimId}/trust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to confirm trust");
    }
    return response.json();
  },

  /**
   * Confirm handover completed inside the Recovery Room
   */
  async completeHandover(claimId: string, role: "Claimant" | "Finder"): Promise<{ success: boolean; claim: Claim; post?: Post }> {
    const response = await fetch(`/api/claims/${claimId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to complete recovery");
    }
    return response.json();
  }
};
