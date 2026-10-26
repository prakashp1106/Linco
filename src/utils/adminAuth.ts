/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";

/**
 * Validates an administrative API key using timing-safe comparison.
 * Prevents timing attacks when checking process.env.ADMIN_API_KEY.
 */
export function validateAdminApiKey(providedKey: string | undefined | null | any): boolean {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey || typeof providedKey !== "string" || !providedKey) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedKey);
  const providedBuffer = Buffer.from(providedKey);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
