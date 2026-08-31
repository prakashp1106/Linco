/**
 * Utility for formatting phone numbers and building WhatsApp direct chat URLs.
 */

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";

  // If contact is encrypted (starts with ENC:) or masked with asterisks, return empty
  if (phone.startsWith("ENC:") || phone.includes("*")) {
    return "";
  }

  // Strip all non-digit characters (including +, -, spaces, parentheses, brackets, dots)
  let cleaned = phone.replace(/\D/g, "");

  // If number starts with 0 and is 11 digits (e.g., 09876543210), strip the leading zero
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // If 10 digits (standard Indian mobile number without country code), prepend country code 91
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }

  // Validate length: valid international phone numbers are between 10 and 15 digits
  if (cleaned.length < 10 || cleaned.length > 15) {
    return "";
  }

  return cleaned;
}

export function formatWhatsAppNumber(phone: string): string {
  return normalizePhoneNumber(phone);
}

export function getWhatsAppLink(phone: string, message?: string): string {
  const cleanNumber = normalizePhoneNumber(phone);
  if (!cleanNumber) return "";

  const defaultMessage = message || "Hi! I am reaching out regarding the item listing on LINCO.";
  const encodedText = encodeURIComponent(defaultMessage);

  // Standard official WhatsApp wa.me click-to-chat URL format
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

export function maskPhoneNumber(phone: string): string {
  if (!phone) return "+91 ******XXXX";
  if (phone.startsWith("ENC:")) return "+91 ******XX";
  const clean = phone.replace(/\D/g, "");
  if (clean.length >= 4) {
    return `+91 ******${clean.slice(-4)}`;
  }
  return "+91 ******XXXX";
}

export interface RevealedContactResult {
  isEligible: boolean;
  contact: string;
  maskedContact: string;
  name?: string;
}

export function getMatchRevealedContact(
  match: {
    matchStatus?: string;
    ownerApproved?: boolean;
    finderApproved?: boolean;
    ownerTrusted?: boolean;
    finderTrusted?: boolean;
    ownerVerification?: { respondentName?: string; contact?: string };
    finderVerification?: { respondentName?: string; contact?: string };
  },
  viewerRole: "owner" | "finder"
): RevealedContactResult {
  const isEligible = Boolean(
    (match.ownerApproved && match.finderApproved && match.ownerTrusted && match.finderTrusted) ||
    match.matchStatus === "VERIFIED_CONNECTION" ||
    match.matchStatus === "HANDOVER_PENDING" ||
    match.matchStatus === "OWNER_RECEIVED_CONFIRMED" ||
    match.matchStatus === "FINDER_HANDOVER_CONFIRMED" ||
    match.matchStatus === "RESOLVED"
  );

  const targetVerification = viewerRole === "owner" ? match.finderVerification : match.ownerVerification;
  const rawContact = targetVerification?.contact || (viewerRole === "owner" ? (match as any).finderContact : (match as any).ownerContact) || "";
  const defaultName = viewerRole === "owner" ? ((match as any).finderName || "Item Finder") : ((match as any).ownerName || "Item Owner");
  const name = targetVerification?.respondentName || defaultName;

  return {
    isEligible,
    contact: isEligible ? rawContact : "",
    maskedContact: maskPhoneNumber(rawContact),
    name
  };
}

