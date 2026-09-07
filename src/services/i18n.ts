/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SUPPORTED_LANGUAGES,
  LanguageCode,
  LanguageMeta,
  LanguageCategory,
  LanguageSupportLevel,
  allTranslations,
} from "./translations/index";
import { LincoNotification } from "../types";

export type { LanguageCode, LanguageMeta, LanguageCategory, LanguageSupportLevel };
export { SUPPORTED_LANGUAGES };

export const translations = allTranslations;

export function getTranslation(lang: LanguageCode, key: string, defaultVal?: string): string {
  const currentDict = translations[lang] || translations["en"];
  if (currentDict && currentDict[key]) {
    return currentDict[key];
  }
  const fallbackDict = translations["en"];
  if (fallbackDict && fallbackDict[key]) {
    return fallbackDict[key];
  }
  return defaultVal !== undefined ? defaultVal : key;
}

export function getLanguageMeta(lang: LanguageCode): LanguageMeta {
  const meta = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
  return meta || SUPPORTED_LANGUAGES[0];
}

export type NotificationCategoryKey =
  | "matchFound"
  | "claimReceived"
  | "ownerApproved"
  | "finderVerified"
  | "verificationComplete"
  | "newMessage"
  | "trustUpdate"
  | "handoverUpdate"
  | "itemReceived"
  | "itemReunited"
  | "listingAlert";

export interface NotificationTaxonomyInfo {
  categoryKey: NotificationCategoryKey;
  categoryTitle: string;
  actionKey: string;
  actionTitle: string;
  routeTarget: "overview" | "chat" | "claims" | "case";
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  iconType:
    | "sparkles"
    | "clipboard"
    | "userCheck"
    | "shieldCheck"
    | "checkCircle"
    | "messageSquare"
    | "heartHandshake"
    | "package"
    | "award"
    | "bell";
}

/**
 * Maps any notification to its strict taxonomy category, localized category title,
 * and localized action button.
 */
export function getNotificationTaxonomy(
  notif: LincoNotification,
  t: (key: string, defaultVal?: string) => string
): NotificationTaxonomyInfo {
  const typeLower = (notif.type || "").toLowerCase();
  const msgLower = (notif.message || "").toLowerCase();
  const keyLower = (notif.messageKey || "").toLowerCase();

  // 1. Chat & New Message
  if (
    typeLower === "chat" ||
    typeLower === "chat_message" ||
    keyLower.includes("newmessage") ||
    msgLower.includes("chat") ||
    msgLower.includes("new message") ||
    msgLower.includes("sent a message")
  ) {
    return {
      categoryKey: "newMessage",
      categoryTitle: t("notifications.newMessage", "NEW MESSAGE"),
      actionKey: "notifications.actions.openChat",
      actionTitle: t("notifications.actions.openChat", "Open Chat"),
      routeTarget: "chat",
      badgeBg: "bg-emerald-500/10",
      badgeText: "text-emerald-400",
      badgeBorder: "border-emerald-500/20",
      cardBorder: "border-emerald-500/30",
      iconType: "messageSquare",
    };
  }

  // 2. Reunited / Case Resolved
  if (
    typeLower === "case_resolved" ||
    keyLower.includes("itemreunited") ||
    msgLower.includes("reunited") ||
    msgLower.includes("officially marked as resolved") ||
    msgLower.includes("case resolved")
  ) {
    return {
      categoryKey: "itemReunited",
      categoryTitle: t("notifications.itemReunited", "ITEM REUNITED"),
      actionKey: "notifications.actions.viewCase",
      actionTitle: t("notifications.actions.viewCase", "View Case"),
      routeTarget: "overview",
      badgeBg: "bg-emerald-500/15",
      badgeText: "text-emerald-300",
      badgeBorder: "border-emerald-500/30",
      cardBorder: "border-emerald-500/40",
      iconType: "award",
    };
  }

  // 3. Item Received
  if (
    typeLower === "item_received" ||
    keyLower.includes("itemreceived") ||
    msgLower.includes("item receipt") ||
    msgLower.includes("received confirmed") ||
    msgLower.includes("received my item")
  ) {
    return {
      categoryKey: "itemReceived",
      categoryTitle: t("notifications.itemReceived", "ITEM RECEIVED"),
      actionKey: "notifications.actions.viewCase",
      actionTitle: t("notifications.actions.viewCase", "View Case"),
      routeTarget: "overview",
      badgeBg: "bg-teal-500/10",
      badgeText: "text-teal-400",
      badgeBorder: "border-teal-500/20",
      cardBorder: "border-teal-500/30",
      iconType: "checkCircle",
    };
  }

  // 4. Safe Handover Update
  if (
    typeLower === "handover" ||
    typeLower === "handover_updated" ||
    keyLower.includes("handoverupdate") ||
    msgLower.includes("handover") ||
    msgLower.includes("handover process")
  ) {
    return {
      categoryKey: "handoverUpdate",
      categoryTitle: t("notifications.handoverUpdate", "HANDOVER UPDATE"),
      actionKey: "notifications.actions.confirmHandover",
      actionTitle: t("notifications.actions.confirmHandover", "Confirm Handover"),
      routeTarget: "overview",
      badgeBg: "bg-amber-500/10",
      badgeText: "text-amber-400",
      badgeBorder: "border-amber-500/20",
      cardBorder: "border-amber-500/30",
      iconType: "package",
    };
  }

  // 5. Trust Confirmed / WhatsApp Contact Reveal
  if (
    typeLower === "trust" ||
    typeLower === "trust_updated" ||
    keyLower.includes("trustupdate") ||
    msgLower.includes("mutual trust") ||
    msgLower.includes("whatsapp contact") ||
    msgLower.includes("trust confirmed")
  ) {
    return {
      categoryKey: "trustUpdate",
      categoryTitle: t("notifications.trustUpdate", "TRUST UPDATE"),
      actionKey: "notifications.actions.confirmTrust",
      actionTitle: t("notifications.actions.confirmTrust", "Confirm Trust"),
      routeTarget: "overview",
      badgeBg: "bg-cyan-500/10",
      badgeText: "text-cyan-400",
      badgeBorder: "border-cyan-500/20",
      cardBorder: "border-cyan-500/30",
      iconType: "heartHandshake",
    };
  }

  // 6. Verification Complete / Both Approved
  if (
    typeLower === "verification_complete" ||
    typeLower === "claim_approved" ||
    keyLower.includes("bothapproved") ||
    keyLower.includes("claimapproved") ||
    keyLower.includes("verificationcomplete") ||
    msgLower.includes("both parties confirmed") ||
    msgLower.includes("verified and approved") ||
    msgLower.includes("verification complete")
  ) {
    return {
      categoryKey: "verificationComplete",
      categoryTitle: t("notifications.verificationComplete", "VERIFICATION COMPLETE"),
      actionKey: "notifications.actions.openChat",
      actionTitle: t("notifications.actions.openChat", "Open Chat"),
      routeTarget: "chat",
      badgeBg: "bg-violet-500/10",
      badgeText: "text-violet-400",
      badgeBorder: "border-violet-500/20",
      cardBorder: "border-violet-500/30",
      iconType: "shieldCheck",
    };
  }

  // 7. Owner Approved
  if (
    typeLower === "owner_approved" ||
    keyLower.includes("ownerapproved") ||
    msgLower.includes("owner confirmed") ||
    msgLower.includes("owner approved")
  ) {
    return {
      categoryKey: "ownerApproved",
      categoryTitle: t("notifications.ownerApproved", "OWNER APPROVED"),
      actionKey: "notifications.actions.viewVerification",
      actionTitle: t("notifications.actions.viewVerification", "View Verification"),
      routeTarget: "overview",
      badgeBg: "bg-blue-500/10",
      badgeText: "text-blue-400",
      badgeBorder: "border-blue-500/20",
      cardBorder: "border-blue-500/30",
      iconType: "userCheck",
    };
  }

  // 8. Finder Verified
  if (
    typeLower === "finder_verified" ||
    keyLower.includes("finderverified") ||
    msgLower.includes("finder verified") ||
    msgLower.includes("finder confirmed")
  ) {
    return {
      categoryKey: "finderVerified",
      categoryTitle: t("notifications.finderVerified", "FINDER VERIFIED"),
      actionKey: "notifications.actions.viewVerification",
      actionTitle: t("notifications.actions.viewVerification", "View Verification"),
      routeTarget: "overview",
      badgeBg: "bg-indigo-500/10",
      badgeText: "text-indigo-400",
      badgeBorder: "border-indigo-500/20",
      cardBorder: "border-indigo-500/30",
      iconType: "shieldCheck",
    };
  }

  // 9. Claim Received
  if (
    typeLower === "claim" ||
    typeLower === "claim_received" ||
    keyLower.includes("claimreceived") ||
    msgLower.includes("ownership claim") ||
    msgLower.includes("claimed this item") ||
    msgLower.includes("submitted a claim")
  ) {
    return {
      categoryKey: "claimReceived",
      categoryTitle: t("notifications.claimReceived", "CLAIM RECEIVED"),
      actionKey: "notifications.actions.reviewClaim",
      actionTitle: t("notifications.actions.reviewClaim", "Review Claim"),
      routeTarget: "claims",
      badgeBg: "bg-yellow-500/10",
      badgeText: "text-yellow-400",
      badgeBorder: "border-yellow-500/20",
      cardBorder: "border-yellow-500/30",
      iconType: "clipboard",
    };
  }

  // 10. Match Found
  if (
    typeLower === "match" ||
    keyLower.includes("matchfound") ||
    msgLower.includes("confidence match") ||
    msgLower.includes("matched your report") ||
    msgLower.includes("potential match") ||
    notif.matchId
  ) {
    return {
      categoryKey: "matchFound",
      categoryTitle: t("notifications.matchFound", "MATCH FOUND"),
      actionKey: "notifications.actions.viewMatch",
      actionTitle: t("notifications.actions.viewMatch", "View Match"),
      routeTarget: "overview",
      badgeBg: "bg-indigo-500/10",
      badgeText: "text-indigo-400",
      badgeBorder: "border-indigo-500/20",
      cardBorder: "border-indigo-500/30",
      iconType: "sparkles",
    };
  }

  // Fallback: Listing Alert
  return {
    categoryKey: "listingAlert",
    categoryTitle: t("notifications.listingAlert", "LISTING ALERT"),
    actionKey: "notifications.actions.viewDetails",
    actionTitle: t("notifications.actions.viewDetails", "View Details"),
    routeTarget: "overview",
    badgeBg: "bg-slate-500/10",
    badgeText: "text-slate-400",
    badgeBorder: "border-slate-500/20",
    cardBorder: "border-slate-500/30",
    iconType: "bell",
  };
}

/**
 * Returns the properly localized message for any notification.
 */
export function getLocalizedNotificationMessage(
  notif: LincoNotification,
  t: (key: string, defaultVal?: string) => string
): string {
  if (notif.messageKey) {
    return t(notif.messageKey, notif.message);
  }

  const msgLower = (notif.message || "").toLowerCase();
  if (msgLower.includes("high-confidence match") || msgLower.includes("potential match")) {
    return t("notifications.matchFoundMsg", notif.message);
  }
  if (msgLower.includes("ownership claim") || msgLower.includes("claimed this item")) {
    return t("notifications.claimReceivedMsg", notif.message);
  }
  if (msgLower.includes("verified and approved") || msgLower.includes("claim approved")) {
    return t("notifications.claimApprovedMsg", notif.message);
  }
  if (msgLower.includes("owner confirmed") || msgLower.includes("owner approved")) {
    return t("notifications.ownerApprovedMsg", notif.message);
  }
  if (msgLower.includes("finder verified") || msgLower.includes("finder confirmed")) {
    return t("notifications.finderVerifiedMsg", notif.message);
  }
  if (msgLower.includes("both parties confirmed")) {
    return t("notifications.bothApprovedMsg", notif.message);
  }
  if (msgLower.includes("new message")) {
    return t("notifications.newMessageMsg", notif.message);
  }
  if (msgLower.includes("mutual trust") || msgLower.includes("whatsapp contact")) {
    return t("notifications.trustUpdateMsg", notif.message);
  }
  if (msgLower.includes("handover")) {
    return t("notifications.handoverUpdateMsg", notif.message);
  }
  if (msgLower.includes("receipt") || msgLower.includes("received confirmed")) {
    return t("notifications.itemReceivedMsg", notif.message);
  }
  if (msgLower.includes("reunited") || msgLower.includes("officially marked as resolved")) {
    return t("notifications.itemReunitedMsg", notif.message);
  }

  return notif.message;
}
