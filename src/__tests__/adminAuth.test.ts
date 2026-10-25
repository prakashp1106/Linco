import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateAdminApiKey } from "../utils/adminAuth.js";

describe("validateAdminApiKey", () => {
  const originalEnv = process.env.ADMIN_API_KEY;

  beforeEach(() => {
    process.env.ADMIN_API_KEY = "super-secret-admin-key-12345";
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ADMIN_API_KEY = originalEnv;
    } else {
      delete process.env.ADMIN_API_KEY;
    }
  });

  it("returns true when provided key matches process.env.ADMIN_API_KEY exactly", () => {
    expect(validateAdminApiKey("super-secret-admin-key-12345")).toBe(true);
  });

  it("returns false when provided key is incorrect", () => {
    expect(validateAdminApiKey("wrong-key")).toBe(false);
  });

  it("returns false when provided key has different length", () => {
    expect(validateAdminApiKey("super-secret-admin-key-1234")).toBe(false);
  });

  it("returns false when provided key is null or undefined", () => {
    expect(validateAdminApiKey(null)).toBe(false);
    expect(validateAdminApiKey(undefined)).toBe(false);
  });

  it("returns false when ADMIN_API_KEY is not set or empty in environment", () => {
    delete process.env.ADMIN_API_KEY;
    expect(validateAdminApiKey("super-secret-admin-key-12345")).toBe(false);

    process.env.ADMIN_API_KEY = "";
    expect(validateAdminApiKey("super-secret-admin-key-12345")).toBe(false);
  });
});
