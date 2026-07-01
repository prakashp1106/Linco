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
