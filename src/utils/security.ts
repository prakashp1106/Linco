/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Strips dangerous HTML tags, javascript: links, and unescaped scripts from user input.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .replace(/onload\s*=/gi, "")
    .replace(/onerror\s*=/gi, "")
    .replace(/onclick\s*=/gi, "")
    .trim();
}

/**
 * Checks if input contains suspicious executable patterns, XSS attack vectors, or blacklisted phishing domains.
 */
export function hasDangerousContent(input: string): boolean {
  if (!input) return false;
  const lower = input.toLowerCase();
  
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /document\.cookie/i,
    /window\.location/i,
    /<iframe/i,
    /eval\s*\(/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /<img[^>]+src=[^>]+onerror/i,
    /<svg[^>]+onload/i,
  ];

  return dangerousPatterns.some(pattern => pattern.test(lower));
}

/**
 * Validates whether a 4-digit PIN adheres to format requirements.
 */
export function isValidPinFormat(pin: string | null | undefined): boolean {
  if (!pin || typeof pin !== "string") return false;
  return /^\d{4}$/.test(pin.trim());
}

/**
 * Validates username format (lowercase letters, numbers, underscores/hyphens, no spaces, 1-30 chars).
 */
export function isValidUsername(username: string | null | undefined): boolean {
  if (!username || typeof username !== "string") return false;
  return /^[a-z0-9_\-]{1,30}$/.test(username.trim());
}

/**
 * Validates Indian or International phone numbers.
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== "string") return false;
  const clean = phone.replace(/[\s\-\(\)\+]/g, "");
  // Accept standard 10 digit Indian number or 10-15 digit E.164 format
  return /^\d{10,15}$/.test(clean);
}

/**
 * Mask sensitive phone number showing only first 2 and last 2 digits.
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "******";
  const clean = String(phone).trim();
  if (clean.length < 6) return "******";
  return clean.slice(0, 2) + "*".repeat(clean.length - 4) + clean.slice(-2);
}

/**
 * Validates administrative API Key against configured environment key.
 * Checks request header 'x-admin-key' or request body property 'adminKey'.
 */
export function validateAdminApiKey(
  headers: Record<string, string | string[] | undefined>,
  body: Record<string, any> | null | undefined,
  envAdminKey: string | undefined = process.env.ADMIN_API_KEY
): boolean {
  if (!envAdminKey) return true;
  const providedHeaderKey = headers["x-admin-key"];
  const headerKeyStr = Array.isArray(providedHeaderKey) ? providedHeaderKey[0] : providedHeaderKey;
  const providedKey = headerKeyStr || body?.adminKey;
  return providedKey === envAdminKey;
}
