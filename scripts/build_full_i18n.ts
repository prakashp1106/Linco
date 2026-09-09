/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";

// Load existing translations to preserve curated high-quality translations
import { enTranslations } from "../src/services/translations/en";
import { hiTranslations } from "../src/services/translations/hi";
import { mrTranslations } from "../src/services/translations/mr";
import { guTranslations } from "../src/services/translations/gu";
import { bnTranslations } from "../src/services/translations/bn";
import { taTranslations } from "../src/services/translations/ta";
import { teTranslations } from "../src/services/translations/te";
import { knTranslations } from "../src/services/translations/kn";
import { mlTranslations } from "../src/services/translations/ml";
import { paTranslations } from "../src/services/translations/pa";
import { orTranslations } from "../src/services/translations/or";
import { asTranslations } from "../src/services/translations/as";

// Add missing keys for EN
const enExtra: Record<string, string> = {
  // Missing Notification message keys
  "notifications.matchFoundMsg": "We found a high-confidence match for your report.",
  "notifications.claimReceivedMsg": "Someone has submitted an ownership claim on this item.",
  "notifications.claimApprovedMsg": "Your claim has been verified and approved by the counterparty.",
  "notifications.ownerApprovedMsg": "The item owner confirmed this may be their item.",
  "notifications.finderVerifiedMsg": "The finder verified your claim matches the recovered item.",
  "notifications.bothApprovedMsg": "Both parties confirmed the match. Secure chat is now available.",
  "notifications.newMessageMsg": "You have a new message in secure chat.",
  "notifications.trustUpdateMsg": "Mutual trust confirmed! WhatsApp contact reveal is now unlocked.",
  "notifications.handoverUpdateMsg": "Safe handover process has been initiated.",
  "notifications.itemReceivedMsg": "Item receipt has been confirmed.",
  "notifications.itemReunitedMsg": "Item successfully reunited! Case is officially marked as Resolved.",

  // Home / Landing Page
  "home.heroTag": "Locate • Verify • Reunite",
  "home.heroTitle1": "Your identity stays private.",
  "home.heroTitle2": "Your item doesn't.",
  "home.heroSubtitle1": "Never lose what matters.",
  "home.heroSubtitle2": "Powered by people. Protected by AI.",
  "home.heroDesc": "Report a lost or found item in under one minute while your identity remains private until ownership is verified.",
  "home.reportLost": "Report Lost Item",
  "home.reportFound": "Report Found Item",
  "home.findItem": "Find an Item",
  "home.viewMatches": "View AI Matches",
  "home.startReport": "Start Report",
  "home.browseFeed": "Browse Community Feed",
  "home.statsTotal": "Active Cases",
  "home.statsLost": "Lost Items",
  "home.statsFound": "Found Items",
  "home.statsResolved": "Reunited Items",
  "home.trustTitle": "Why LINCO is Different",
  "home.trustSubtitle": "Built on zero-knowledge privacy, verifiable ownership proof, and fast community recovery.",
  "home.trustPrivacyTitle": "Identity Shielded",
  "home.trustPrivacyDesc": "Your phone number and private details are never exposed to public feeds or web crawlers.",
  "home.trustProofTitle": "Forensic Proof of Ownership",
  "home.trustProofDesc": "Dynamic non-revealing ownership questions prevent fraudulent claims before meeting.",
  "home.trustRecoveryTitle": "Community Trust Network",
  "home.trustRecoveryDesc": "Connect safely via secure in-app verification chat, mutual approval, and guided handover.",
  "home.timelineShowcaseTitle": "AI Timeline Reconstructor",
  "home.timelineShowcaseSubtitle": "Trace your day's sequence to isolate the exact moment and location where your item was misplaced.",
  "home.timelineTryPrompt": "Try an example scenario:",
  "home.faqTitle": "Frequently Asked Questions",
  "home.faqSubtitle": "Everything you need to know about how LINCO works.",

  // Dashboard / Profile & Settings
  "dashboard.title": "Citizen Profile & Activity",
  "dashboard.subtitle": "Manage your tickets, active recovery rooms, and security preferences",
  "dashboard.tabReports": "My Reports",
  "dashboard.tabClaims": "My Claims",
  "dashboard.tabRecovery": "Recovery Rooms",
  "dashboard.tabSettings": "Settings",
  "dashboard.noReports": "You haven't reported any items yet.",
  "dashboard.noClaims": "No active claims found.",
  "dashboard.noRecovery": "No active recovery rooms. Once a match is confirmed, secure chat opens here.",
  "dashboard.accountDetails": "Personal Information",
  "dashboard.fullName": "Full Name",
  "dashboard.phoneNumber": "Registered Mobile Number",
  "dashboard.city": "Primary City / Campus",
  "dashboard.languagePreference": "Language Preference",
  "dashboard.changeLanguage": "Change Language",
  "dashboard.saveSettings": "Save Settings",
  "dashboard.settingsSaved": "Settings successfully updated!",

  // Claim & Verification
  "claim.modalTitle": "Submit Ownership Claim",
  "claim.modalSubtitle": "Provide evidence that this found item belongs to you.",
  "claim.verifyIdentity": "Ownership Verification",
  "claim.questionsPrompt": "Please answer the owner verification questions carefully:",
  "claim.proofDetails": "Distinct Proof / Identifying Secret",
  "claim.proofPlaceholder": "Describe specific scratches, stickers, inner contents, or serial numbers that only the true owner would know...",
  "claim.submitClaim": "Submit Claim",
  "claim.statusPending": "Pending Review",
  "claim.statusApproved": "Approved by Finder",
  "claim.statusRejected": "Verification Unsuccessful",
  "claim.statusResolved": "Case Closed / Handed Over",

  // Categories
  "category.Electronics": "Electronics",
  "category.Documents": "Documents & Certificates",
  "category.Wallet / Purse": "Wallet / Purse",
  "category.Keys": "Keys & Keychains",
  "category.Pet": "Pets & Animals",
  "category.Bag / Luggage": "Bags & Luggage",
  "category.Jewelry": "Jewelry & Ornaments",
  "category.ID / Card": "Cards & Government IDs",
  "category.Vehicle": "Vehicles & Cycles",
  "category.Clothing": "Clothing & Apparel",
  "category.Other": "Other Belongings",

  // Urgency
  "urgency.Normal": "Standard",
  "urgency.Urgent": "Urgent",
  "urgency.Contains ID": "Contains Critical ID",
  "urgency.Medical": "Medical / Life Critical",
};

export const completeEn: Record<string, string> = { ...enTranslations, ...enExtra };

console.log("Total EN authoritative keys:", Object.keys(completeEn).length);
