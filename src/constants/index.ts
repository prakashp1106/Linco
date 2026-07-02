/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, UrgencyInfo } from "../types";

export const CATEGORIES: Category[] = [
  { id: "Electronics", emoji: "📱" },
  { id: "Documents", emoji: "📄" },
  { id: "Wallet / Purse", emoji: "👛" },
  { id: "Keys", emoji: "🔑" },
  { id: "Pet", emoji: "🐶" },
  { id: "Bag / Luggage", emoji: "💼" },
  { id: "Jewelry", emoji: "💍" },
  { id: "ID / Card", emoji: "🆔" },
  { id: "Vehicle", emoji: "🚗" },
  { id: "Clothing", emoji: "👕" },
  { id: "Other", emoji: "📦" },
];

export const URGENCY_LEVELS: UrgencyInfo[] = [
  { id: "Normal", cls: "text-cyan-400 border-cyan-500/20 bg-cyan-950/20", color: "#22d3ee", bgColor: "rgba(6, 182, 212, 0.1)" },
  { id: "Urgent", cls: "text-amber-400 border-amber-500/20 bg-amber-950/20", color: "#fbbf24", bgColor: "rgba(245, 158, 11, 0.1)" },
  { id: "Contains ID", cls: "text-pink-400 border-pink-500/20 bg-pink-950/20", color: "#f472b6", bgColor: "rgba(236, 72, 153, 0.1)" },
  { id: "Medical", cls: "text-red-400 border-red-500/20 bg-red-950/20", color: "#f87171", bgColor: "rgba(239, 68, 68, 0.1)" },
];

export const CITIES = ["Pune", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Noida", "Gurgaon"];
