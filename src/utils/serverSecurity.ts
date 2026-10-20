/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";

/**
 * Validates an administrative API key using timing-safe string comparison
 * to protect against timing side-channel attacks.
 */
export function validateAdminApiKey(providedKey?: string | null): boolean {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey || !providedKey || typeof providedKey !== "string") {
    return false;
  }

  const expectedBuf = Buffer.from(expectedKey);
  const providedBuf = Buffer.from(providedKey);

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
