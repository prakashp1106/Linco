/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";

/**
 * Validates administrative API key using timing-safe comparison to prevent timing attacks.
 */
export function validateAdminApiKey(providedKey?: string): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey || !providedKey || typeof providedKey !== "string") {
    return false;
  }
  const expectedBuffer = Buffer.from(adminKey);
  const providedBuffer = Buffer.from(providedKey);
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
