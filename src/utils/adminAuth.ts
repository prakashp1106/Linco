/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";

/**
 * Validates an admin API key against process.env.ADMIN_API_KEY using constant-time comparison.
 */
export function validateAdminApiKey(providedKey: string | undefined | null): boolean {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey || !providedKey || typeof providedKey !== "string") {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedKey);
  const providedBuffer = Buffer.from(providedKey);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
