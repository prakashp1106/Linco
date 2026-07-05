/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UrgencyType = "Normal" | "Urgent" | "Contains ID" | "Medical";

export interface Post {
  id: string;
  item: string;
  details: string;
  type: "Lost" | "Found";
  address: string;
  reward?: string;
  contact: string;
  maskedContact?: string;
  securityPin?: string;
  category: string;
  urgency: UrgencyType;
  image?: string | null;
  latitude?: number;
  longitude?: number;
  status: "Active" | "Resolved";
  views: number;
  created: number;
  timestamp: string;
}

export interface AIMatch {
  id: string;
  item: string;
  contact: string;
  score: number;
  reason: string;
}

export interface Category {
  id: string;
  emoji: string;
}

export interface UrgencyInfo {
  id: UrgencyType;
  cls: string;
  color: string;
  bgColor: string;
}

export interface Claim {
  id: string;
  postId: string;
  postTitle: string;
  postType: "Lost" | "Found";
  claimantName: string;
  claimantContact: string;
  questions: string[];
  answers: string[];
  aiScore: number;
  aiReason: string;
  status: "Pending" | "Approved" | "Rejected";
  created: number;
  timestamp: string;
  trackingCode: string;
  revealedOwnerContact?: string;
}

