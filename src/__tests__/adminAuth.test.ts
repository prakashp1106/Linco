/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateAdminApiKey } from "../utils/adminAuth";

describe("Admin Authentication Utility Suite", () => {
  const ORIGINAL_ENV = process.env.ADMIN_API_KEY;

  beforeEach(() => {
    process.env.ADMIN_API_KEY = "super-secret-admin-key-12345";
  });

  afterEach(() => {
    process.env.ADMIN_API_KEY = ORIGINAL_ENV;
  });

  it("validates correct admin API key", () => {
    expect(validateAdminApiKey("super-secret-admin-key-12345")).toBe(true);
  });

  it("rejects incorrect admin API key", () => {
    expect(validateAdminApiKey("wrong-admin-key")).toBe(false);
  });

  it("rejects empty, null, or undefined key inputs", () => {
    expect(validateAdminApiKey("")).toBe(false);
    expect(validateAdminApiKey(null)).toBe(false);
    expect(validateAdminApiKey(undefined)).toBe(false);
  });

  it("fails closed when ADMIN_API_KEY environment variable is missing", () => {
    delete process.env.ADMIN_API_KEY;
    expect(validateAdminApiKey("super-secret-admin-key-12345")).toBe(false);
  });

  it("handles keys of different lengths safely without throwing timing errors", () => {
    expect(validateAdminApiKey("short")).toBe(false);
    expect(validateAdminApiKey("extremely-long-key-that-does-not-match-the-expected-length-at-all")).toBe(false);
  });
});
