/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateAdminApiKey } from "../utils/adminAuth";

describe("Administrative Authentication Utilities", () => {
  const ORIGINAL_ENV = process.env.ADMIN_API_KEY;

  beforeEach(() => {
    process.env.ADMIN_API_KEY = "secret_admin_key_12345";
  });

  afterEach(() => {
    if (ORIGINAL_ENV !== undefined) {
      process.env.ADMIN_API_KEY = ORIGINAL_ENV;
    } else {
      delete process.env.ADMIN_API_KEY;
    }
  });

  it("returns true for matching admin API key", () => {
    expect(validateAdminApiKey("secret_admin_key_12345")).toBe(true);
  });

  it("returns false for non-matching admin API key", () => {
    expect(validateAdminApiKey("wrong_key")).toBe(false);
  });

  it("returns false when provided key is null, undefined, or empty", () => {
    expect(validateAdminApiKey(null)).toBe(false);
    expect(validateAdminApiKey(undefined)).toBe(false);
    expect(validateAdminApiKey("")).toBe(false);
  });

  it("returns false when ADMIN_API_KEY environment variable is not configured", () => {
    delete process.env.ADMIN_API_KEY;
    expect(validateAdminApiKey("secret_admin_key_12345")).toBe(false);
  });

  it("safely handles keys with differing lengths without crashing", () => {
    expect(validateAdminApiKey("short")).toBe(false);
    expect(validateAdminApiKey("extremely_long_key_that_does_not_match")).toBe(false);
  });
});
