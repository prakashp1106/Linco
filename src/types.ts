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
  timeline?: string;
  status: "Active" | "Resolved";
  views: number;
  created: number;
  timestamp: string;
  aiFeatures?: any;
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
  matchedPostId?: string;
  postTitle: string;
  postType: "Lost" | "Found";
  claimantName: string;
  claimantContact: string;
  questions: string[];
  answers: string[];
  aiScore: number;
  aiReason: string;
  status: "Pending" | "Under Review" | "Approved" | "Rejected" | "Contact Unlocked" | "Resolved";
  created: number;
  timestamp: string;
  trackingCode: string;
  revealedOwnerContact?: string;
}

export interface PotentialMatch {
  matchId: string;
  lostPostId: string;
  foundPostId: string;
  matchScore: number;
  matchBreakdown: {
    category: number;
    item: number;
    brand: number;
    colors: number;
    description: number;
    image: number;
    material: number;
    size: number;
    shape: number;
    location: number;
    dateProximity: number;
    timeline: number;
    identifiers: number;
  };
  createdAt: number;
  status: "Active" | "Dismissed";
  reviewed: boolean;
  notificationsSent: boolean;
  lastUpdated: number;
  reason: string;
}

export interface LincoNotification {
  id: string;
  postId: string;
  message: string;
  createdAt: number;
  read: boolean;
  type: "match" | "system" | "claim";
  matchId?: string;
  claimId?: string;
  matchedPostId?: string;
}

