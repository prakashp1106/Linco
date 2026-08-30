/**
 * Utility for formatting phone numbers and building WhatsApp direct chat URLs.
 */

export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return "";
  // Strip all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If number starts with 0 and is 11 digits (e.g., 09876543210)
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // If 10 digits (standard Indian mobile number without country code)
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }

  return cleaned;
}

export function getWhatsAppLink(phone: string, message?: string): string {
  const cleanNumber = formatWhatsAppNumber(phone);
  if (!cleanNumber) return "#";

  const defaultMessage = message || "Hi! I am reaching out regarding the item listing on LINCO AI.";
  const encodedText = encodeURIComponent(defaultMessage);

  return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`;
}
