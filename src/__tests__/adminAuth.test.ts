/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateAdminApiKey } from "../utils/adminAuth";

describe("Admin Authentication - validateAdminApiKey", () => {
  const originalApiKey = process.env.ADMIN_API_KEY;

  beforeEach(() => {
    process.env.ADMIN_API_KEY = "super-secret-admin-key-12345";
  });

  afterEach(() => {
    process.env.ADMIN_API_KEY = originalApiKey;
  });

  it("returns true for matching admin API key", () => {
    expect(validateAdminApiKey("super-secret-admin-key-12345")).toBe(true);
  });

  it("returns false for incorrect admin API key", () => {
    expect(validateAdminApiKey("wrong-key")).toBe(false);
  });

  it("returns false for key with different length", () => {
    expect(validateAdminApiKey("super-secret")).toBe(false);
  });

  it("returns false if provided key is null, undefined, empty, or non-string", () => {
    expect(validateAdminApiKey(undefined)).toBe(false);
    expect(validateAdminApiKey(null)).toBe(false);
    expect(validateAdminApiKey("")).toBe(false);
    expect(validateAdminApiKey(12345 as any)).toBe(false);
    expect(validateAdminApiKey({ key: "test" } as any)).toBe(false);
  });

  it("returns false if ADMIN_API_KEY env var is not set", () => {
    delete process.env.ADMIN_API_KEY;
    expect(validateAdminApiKey("super-secret-admin-key-12345")).toBe(false);
  });
});
