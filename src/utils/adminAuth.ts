/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";

/**
 * Validates an administrative API key using timing-safe comparison to prevent timing attacks.
 * Compares against process.env.ADMIN_API_KEY.
 */
export function validateAdminApiKey(providedKey: string | undefined | null): boolean {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey || !providedKey || typeof providedKey !== "string") {
    return false;
  }

  const keyBuffer = Buffer.from(providedKey);
  const expectedBuffer = Buffer.from(expectedKey);

  if (keyBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(keyBuffer, expectedBuffer);
}
