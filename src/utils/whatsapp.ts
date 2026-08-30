/**
 * Utility for formatting phone numbers and building WhatsApp direct chat URLs.
 */

export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return "";

  // If contact is encrypted (starts with ENC:), do not attempt formatting as phone
  if (phone.startsWith("ENC:") || phone.includes("*")) {
    return "";
  }

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

  // Validate length: valid international phone numbers are between 10 and 15 digits
  if (cleaned.length < 10 || cleaned.length > 15) {
    return "";
  }

  return cleaned;
}

export function getWhatsAppLink(phone: string, message?: string): string {
  const cleanNumber = formatWhatsAppNumber(phone);
  if (!cleanNumber) return "#";

  const defaultMessage = message || "Hi! I am reaching out regarding the item listing on LINCO AI.";
  const encodedText = encodeURIComponent(defaultMessage);

  // Using official WhatsApp wa.me click-to-chat URL format
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}
