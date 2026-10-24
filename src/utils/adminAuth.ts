/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";

/**
 * Validates administrative API key against process.env.ADMIN_API_KEY using timing-safe comparison.
 */
export function validateAdminApiKey(providedKey: string | undefined): boolean {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey || !providedKey) {
    return false;
  }

  const expectedBuf = Buffer.from(expectedKey);
  const providedBuf = Buffer.from(providedKey);

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
