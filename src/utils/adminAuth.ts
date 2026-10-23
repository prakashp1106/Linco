/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";

/**
 * Validates an administrative API key using timing-safe comparison to prevent timing attacks.
 * SHA-256 digests are compared so both inputs are fixed 32-byte buffers for timingSafeEqual.
 */
export function validateAdminApiKey(providedKey: string | null | undefined): boolean {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey || !providedKey || typeof providedKey !== "string") {
    return false;
  }

  // Hash both keys to SHA-256 so buffers compared by timingSafeEqual are equal length (32 bytes)
  const providedBuffer = crypto.createHash("sha256").update(providedKey).digest();
  const expectedBuffer = crypto.createHash("sha256").update(expectedKey).digest();

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}
