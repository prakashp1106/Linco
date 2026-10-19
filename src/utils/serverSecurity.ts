/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";

/**
 * Timing-safe validation of admin API keys using SHA-256 hashing and timingSafeEqual.
 * Prevents timing attacks on key verification.
 */
export function validateAdminApiKey(providedKey: string | null | undefined): boolean {
  const adminApiKey = process.env.ADMIN_API_KEY;
  if (!adminApiKey || typeof providedKey !== "string" || !providedKey) {
    return false;
  }

  const expectedHash = crypto.createHash("sha256").update(adminApiKey).digest();
  const providedHash = crypto.createHash("sha256").update(providedKey).digest();

  return crypto.timingSafeEqual(expectedHash, providedHash);
}
