/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UrgencyType = "Normal" | "Urgent" | "Contains ID" | "Medical";

export type MatchStatus =
  | "POTENTIAL_MATCH"
  | "FINDER_VERIFICATION_PENDING"
  | "OWNER_REVIEW_PENDING"
  | "OWNER_APPROVED"
  | "FINDER_APPROVED"
  | "MUTUAL_TRUST_PENDING"
  | "VERIFIED_CONNECTION"
  | "HANDOVER_PENDING"
  | "OWNER_RECEIVED_CONFIRMED"
  | "FINDER_HANDOVER_CONFIRMED"
  | "RESOLVED"
  | "REJECTED"
  | "DISMISSED";

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
  characteristics?: string;
  uniqueMarks?: string;
  contents?: string;
  condition?: string;
  lostFoundTime?: string;
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
  status: "Pending" | "Under Review" | "Approved" | "Rejected" | "Contact Unlocked" | "Resolved" | "Recovery Room";
  created: number;
  timestamp: string;
  trackingCode: string;
  revealedOwnerContact?: string;
  claimantTrusted?: boolean;
  finderTrusted?: boolean;
  ownerConfirmedReceived?: boolean;
  finderConfirmedReturned?: boolean;
  messages?: { id: string; sender: "Claimant" | "Finder"; text: string; timestamp: number }[];
}

export interface MatchMessage {
  id: string;
  sender: "Owner" | "Finder" | "System";
  text: string;
  timestamp: number;
}

export interface VerificationSubmission {
  respondentName: string;
  contact: string;
  answers: string[];
  questions: string[];
  submittedAt: number;
  aiScore?: number;
  aiReason?: string;
}

export interface HandoverDetails {
  location?: string;
  meetingTime?: string;
  notes?: string;
  startedBy?: "Owner" | "Finder";
  startedAt?: number;
}

export interface PotentialMatch {
  matchId: string;
  lostPostId: string;
  foundPostId: string;
  matchScore: number;
  similarityScore?: number;
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
  matchStatus?: MatchStatus;
  ownerApproved?: boolean;
  finderApproved?: boolean;
  ownerTrustConfirmed?: boolean;
  finderTrustConfirmed?: boolean;
  ownerTrusted?: boolean;
  finderTrusted?: boolean;
  handoverStarted?: boolean;
  handoverDetails?: HandoverDetails;
  ownerReceivedConfirmed?: boolean;
  finderHandoverConfirmed?: boolean;
  resolvedAt?: number;
  revealedOwnerContact?: string;
  revealedFinderContact?: string;
  ownerVerification?: VerificationSubmission;
  finderVerification?: VerificationSubmission;
  rejectionReason?: string;
  rejectedBy?: "Owner" | "Finder";
  messages?: MatchMessage[];
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

