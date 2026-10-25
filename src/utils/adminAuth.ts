/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";

/**
 * Validates provided administrative API key against ADMIN_API_KEY environment variable
 * using a timing-safe buffer comparison to prevent timing side-channel attacks.
 */
export function validateAdminApiKey(providedKey: string | null | undefined): boolean {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey || typeof expectedKey !== "string" || expectedKey.trim() === "") {
    return false;
  }
  if (!providedKey || typeof providedKey !== "string") {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedKey);
  const providedBuffer = Buffer.from(providedKey);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
