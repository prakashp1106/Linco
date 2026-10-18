/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";

/**
 * Timing-safe validation for administrative API keys using SHA-256 hash buffer comparison.
 */
export function validateAdminApiKey(providedKey: string | null | undefined): boolean {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey || !providedKey || typeof providedKey !== "string") {
    return false;
  }
  const keyHash = crypto.createHash("sha256").update(providedKey).digest();
  const expectedHash = crypto.createHash("sha256").update(expectedKey).digest();
  return crypto.timingSafeEqual(keyHash, expectedHash);
}
