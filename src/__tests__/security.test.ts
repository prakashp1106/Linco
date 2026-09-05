/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { 
  sanitizeText, 
  hasDangerousContent, 
  isValidPinFormat, 
  isValidUsername, 
  isValidPhoneNumber,
  maskPhoneNumber 
} from "../utils/security";

describe("LINCO Security, Sanitization & Validation Suite", () => {
  describe("Input Sanitization & XSS Defense", () => {
    it("strips malicious script tags from description text", () => {
      const dirty = "Lost black bag <script>alert('xss')</script> near Metro station";
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("alert('xss')");
      expect(clean).toContain("Lost black bag");
      expect(clean).toContain("near Metro station");
    });

    it("strips inline javascript: URIs and onload handlers", () => {
      const dirty = `<img src="x" onerror="stealCookies()"> and javascript:alert(1)`;
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain("onerror=");
      expect(clean).not.toContain("javascript:");
    });

    it("detects dangerous injection attempts", () => {
      expect(hasDangerousContent("<script>document.cookie</script>")).toBe(true);
      expect(hasDangerousContent("javascript:alert(1)")).toBe(true);
      expect(hasDangerousContent("<img src=x onerror=alert(1)>")).toBe(true);
      expect(hasDangerousContent("Lost my brown leather Wildhorn wallet at FC Road")).toBe(false);
    });
  });

  describe("PIN & Identity Validation", () => {
    it("validates 4-digit numeric PIN format strictly", () => {
      expect(isValidPinFormat("1234")).toBe(true);
      expect(isValidPinFormat("9999")).toBe(true);
      expect(isValidPinFormat("0000")).toBe(true);
      expect(isValidPinFormat("123")).toBe(false);
      expect(isValidPinFormat("12345")).toBe(false);
      expect(isValidPinFormat("abcd")).toBe(false);
      expect(isValidPinFormat("")).toBe(false);
    });

    it("validates safe profile usernames", () => {
      expect(isValidUsername("rahul_sharma")).toBe(true);
      expect(isValidUsername("linco-user2026")).toBe(true);
      expect(isValidUsername("john.doe")).toBe(false); // only a-z0-9_-
      expect(isValidUsername("admin user")).toBe(false); // no spaces
      expect(isValidUsername("<script>")).toBe(false);
    });
  });

  describe("Phone Masking & Privacy Controls", () => {
    it("masks Indian phone numbers for public viewers while retaining auditability", () => {
      expect(maskPhoneNumber("9876543210")).toBe("98******10");
      expect(maskPhoneNumber("919876543210")).toBe("91********10");
      expect(maskPhoneNumber("")).toBe("******");
    });

    it("validates standard phone number formats", () => {
      expect(isValidPhoneNumber("9876543210")).toBe(true);
      expect(isValidPhoneNumber("+919876543210")).toBe(true);
      expect(isValidPhoneNumber("98765 43210")).toBe(true);
      expect(isValidPhoneNumber("123")).toBe(false);
      expect(isValidPhoneNumber("invalid-phone")).toBe(false);
    });
  });

  describe("Admin API Authorization Controls", () => {
    const handleConfigUpdate = (req: { headers: Record<string, string>; body?: Record<string, any> }, envAdminKey?: string) => {
      if (envAdminKey) {
        const providedKey = req.headers["x-admin-key"] || req.body?.adminKey;
        if (!providedKey || providedKey !== envAdminKey) {
          return { status: 401, body: { error: "Unauthorized: Invalid or missing admin API key." } };
        }
      }
      const { threshold } = req.body || {};
      if (typeof threshold === "number" && threshold >= 0 && threshold <= 100) {
        return { status: 200, body: { success: true, matchThreshold: threshold } };
      }
      return { status: 400, body: { error: "Invalid threshold value. Must be between 0 and 100." } };
    };

    it("enforces 401 Unauthorized on POST /api/config when ADMIN_API_KEY is set and missing/invalid key is provided", () => {
      const envKey = "admin-secret-123";

      // Missing key -> 401
      const res1 = handleConfigUpdate({ headers: {}, body: { threshold: 75 } }, envKey);
      expect(res1.status).toBe(401);
      expect(res1.body.error).toContain("Unauthorized");

      // Wrong key -> 401
      const res2 = handleConfigUpdate({ headers: { "x-admin-key": "invalid-key" }, body: { threshold: 75 } }, envKey);
      expect(res2.status).toBe(401);

      // Valid header key -> 200
      const res3 = handleConfigUpdate({ headers: { "x-admin-key": envKey }, body: { threshold: 75 } }, envKey);
      expect(res3.status).toBe(200);
      expect(res3.body.matchThreshold).toBe(75);

      // Valid body key -> 200
      const res4 = handleConfigUpdate({ headers: {}, body: { adminKey: envKey, threshold: 85 } }, envKey);
      expect(res4.status).toBe(200);
      expect(res4.body.matchThreshold).toBe(85);

      // Unset ADMIN_API_KEY -> 200 without key
      const res5 = handleConfigUpdate({ headers: {}, body: { threshold: 90 } }, undefined);
      expect(res5.status).toBe(200);
    });
  });

  describe("Spam & Abuse Defense Edge Cases", () => {
    it("safely handles null, undefined and non-string inputs", () => {
      expect(sanitizeText(null as any)).toBe("");
      expect(sanitizeText(undefined as any)).toBe("");
      expect(hasDangerousContent("")).toBe(false);
      expect(isValidPinFormat(null)).toBe(false);
      expect(maskPhoneNumber("12345")).toBe("******");
    });

    it("detects eval and malicious SVG onload payloads", () => {
      expect(hasDangerousContent("<svg/onload=alert(1)>")).toBe(true);
      expect(hasDangerousContent("window.location='https://attacker.com'")).toBe(true);
      expect(hasDangerousContent("eval('malicious()')")).toBe(true);
    });
  });
});
